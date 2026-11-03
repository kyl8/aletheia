import { pipeline, env } from "@huggingface/transformers";

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

type ModelTier = "fast" | "precise";

type PipelineEvent = {
  status?: string;
  progress?: number;
};

type SegmentationResult = {
  mask?: unknown;
};

type SegmentationRunner = (image: string) => Promise<SegmentationResult[]>;

type MaskTensor = {
  width: number;
  height: number;
  data?: Uint8Array | Uint8ClampedArray;
  toDataURL?: () => string;
};

type WorkerRequest = {
  id: string;
  imageDataUrl: string;
  quality: ModelTier;
};

class WorkerModelSession {
  private static runner: SegmentationRunner | null = null;
  private static loadedTier: ModelTier | null = null;

  static async getRunner(
    tier: ModelTier,
    onProgress: (progress: number) => void,
  ): Promise<SegmentationRunner> {
    if (this.runner && this.loadedTier === tier) {
      return this.runner;
    }

    env.allowLocalModels = false;
    env.useBrowserCache = false;

    const modelId = tier === "precise" ? "briaai/RMBG-2.0" : "briaai/RMBG-1.4";

    const progressCallback = (event: PipelineEvent) => {
      if (event.status === "progress" && event.progress !== undefined) {
        onProgress(Math.round(event.progress));
      }
    };

    try {
      this.runner = (await (pipeline as (...args: unknown[]) => Promise<unknown>)("image-segmentation", modelId, {
        device: "webgpu",
        dtype: "fp32",
        progress_callback: progressCallback,
      })) as SegmentationRunner;
    } catch {
      this.runner = (await (pipeline as (...args: unknown[]) => Promise<unknown>)("image-segmentation", modelId, {
        device: "wasm",
        dtype: "fp32",
        progress_callback: progressCallback,
      })) as SegmentationRunner;
    }

    this.loadedTier = tier;
    return this.runner;
  }
}

function isMaskTensor(mask: unknown): mask is MaskTensor {
  return (
    typeof mask === "object" &&
    mask !== null &&
    "width" in mask &&
    "height" in mask
  );
}

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, imageDataUrl, quality } = event.data;

  try {
    const runner = await WorkerModelSession.getRunner(quality, (progress) => {
      workerScope.postMessage({ id, status: "progress", progress });
    });

    workerScope.postMessage({ id, status: "processing" });

    const result = await runner(imageDataUrl);
    const mask = result?.[0]?.mask;

    if (typeof mask === "string") {
      workerScope.postMessage({ id, status: "complete", mask: { type: "string", dataUrl: mask } });
      return;
    }

    if (mask instanceof Blob) {
      workerScope.postMessage({ id, status: "complete", mask: { type: "blob", blob: mask } });
      return;
    }

    if (isMaskTensor(mask) && typeof mask.toDataURL === "function") {
      workerScope.postMessage({ id, status: "complete", mask: { type: "string", dataUrl: mask.toDataURL() } });
      return;
    }

    if (isMaskTensor(mask) && mask.data && mask.width && mask.height) {
      const raw = mask.data;
      const uint8 = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
      const transferableBuffer = new ArrayBuffer(uint8.byteLength);
      new Uint8Array(transferableBuffer).set(uint8);

      workerScope.postMessage(
        {
          id,
          status: "complete",
          mask: {
            type: "tensor",
            width: mask.width,
            height: mask.height,
            data: transferableBuffer,
          },
        },
        [transferableBuffer],
      );
      return;
    }

    workerScope.postMessage({ id, status: "error", error: "Processamento de mascara falhou: saída inválida do modelo" });
  } catch (error) {
    workerScope.postMessage({
      id,
      status: "error",
      error: error instanceof Error ? error.message : "Erro desconhecido no worker",
    });
  }
};
