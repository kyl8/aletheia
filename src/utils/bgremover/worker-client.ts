import type { ModelQuality } from "./bg-remover";

export type SerializedMask =
  | { type: "string"; dataUrl: string }
  | { type: "blob"; blob: Blob }
  | { type: "tensor"; width: number; height: number; data: ArrayBuffer };

type WorkerMessage =
  | { id: string; status: "progress"; progress: number }
  | { id: string; status: "processing" }
  | { id: string; status: "complete"; mask: SerializedMask }
  | { id: string; status: "error"; error?: string };

type PendingRequest = {
  resolve: (mask: SerializedMask) => void;
  reject: (error: Error) => void;
  onProgress?: (progress: number) => void;
  onRunStart?: () => void;
};

class BackgroundWorkerClient {
  private static instance: BackgroundWorkerClient | null = null;

  static getInstance(): BackgroundWorkerClient {
    if (!this.instance) {
      this.instance = new BackgroundWorkerClient();
    }
    return this.instance;
  }

  private worker: Worker;
  private pending = new Map<string, PendingRequest>();

  private constructor() {
    this.worker = this.createWorker();
  }

  private createWorker(): Worker {
    const worker = new Worker(new URL("../worker/remover.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      const job = this.pending.get(message.id);
      if (!job) return;

      if (message.status === "progress") {
        job.onProgress?.(message.progress);
        return;
      }

      if (message.status === "processing") {
        job.onRunStart?.();
        return;
      }

      if (message.status === "complete") {
        this.pending.delete(message.id);
        job.resolve(message.mask);
        return;
      }

      if (message.status === "error") {
        this.pending.delete(message.id);
        job.reject(new Error(message.error || "Worker no background falhou"));
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      const details = [event.message, event.filename, event.lineno, event.colno]
        .filter((value) => value !== undefined && value !== "")
        .join(" @ ");

      for (const [id, job] of this.pending.entries()) {
        job.reject(new Error(`Background worker falhou ${details ? `: ${details}` : ""}`));
        this.pending.delete(id);
      }

      this.worker = this.createWorker();
    };

    return worker;
  }

  runSegmentation(params: {
    imageDataUrl: string;
    quality: ModelQuality;
    onProgress?: (progress: number) => void;
    onRunStart?: () => void;
  }): Promise<SerializedMask> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return new Promise((resolve, reject) => {
      this.pending.set(id, {
        resolve,
        reject,
        onProgress: params.onProgress,
        onRunStart: params.onRunStart,
      });

      this.worker.postMessage({
        id,
        imageDataUrl: params.imageDataUrl,
        quality: params.quality,
      });
    });
  }
}

export async function segmentImageInWorker(params: {
  imageDataUrl: string;
  quality: ModelQuality;
  onProgress?: (progress: number) => void;
  onRunStart?: () => void;
}): Promise<SerializedMask> {
  const client = BackgroundWorkerClient.getInstance();
  return await client.runSegmentation(params);
}
