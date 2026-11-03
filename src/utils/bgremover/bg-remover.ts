import { composeTransparentPng, type MaskSource } from "./mask-compose";
import { BriaModelSession, type ModelTier } from "./model-session";
import { segmentImageInWorker } from "./worker-client";

export type ModelQuality = ModelTier;

export interface TaskState {
  status: "idle" | "downloading" | "processing" | "done" | "error";
  message?: string;
  progress?: number;
}

export const ENABLE_PRECISE_TIER = false;

export async function readImageAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = () => reject(new Error("Falha ao ler imagem"));
    reader.readAsDataURL(file);
  });
}


interface ExtractForegroundParams {
  imageDataUrl: string;
  quality: ModelQuality;
  canvas: HTMLCanvasElement;
  onModelProgress?: (progress: number) => void;
  onRunStart?: () => void;
}

class ForegroundExtractor {
  private async segmentOnMainThread(params: {
    imageDataUrl: string;
    quality: ModelQuality;
    onModelProgress?: (progress: number) => void;
    onRunStart?: () => void;
  }): Promise<MaskSource> {
    const runner = await BriaModelSession.getRunner(params.quality, params.onModelProgress);
    params.onRunStart?.();
    const result = await runner(params.imageDataUrl);
    const mask = result?.[0]?.mask as MaskSource | undefined;

    if (!mask) {
      throw new Error("Processamento de mascara falhou: saída inválida do modelo");
    }

    return mask;
  }

  async run(params: ExtractForegroundParams): Promise<string> {
    const { imageDataUrl, quality, canvas, onModelProgress, onRunStart } = params;

    let mask: MaskSource | undefined;
    try {
      const workerMask = await segmentImageInWorker({
        imageDataUrl,
        quality,
        onProgress: onModelProgress,
        onRunStart,
      });

      if (workerMask.type === "string") {
        mask = workerMask.dataUrl;
      } else if (workerMask.type === "blob") {
        mask = workerMask.blob;
      } else {
        mask = {
          width: workerMask.width,
          height: workerMask.height,
          data: new Uint8Array(workerMask.data),
        };
      }
    } catch (workerError) {
      console.warn("Tentando recuperar com a main thread", workerError);
      mask = await this.segmentOnMainThread({
        imageDataUrl,
        quality,
        onModelProgress,
        onRunStart,
      });
    }

    if (!mask) {
      throw new Error("Processamento de mascara falhou: saída inválida do modelo");
    }

    return await composeTransparentPng(imageDataUrl, mask, canvas);
  }
}

const extractor = new ForegroundExtractor();

export async function extractForeground(params: ExtractForegroundParams): Promise<string> {
  return await extractor.run(params);
}
