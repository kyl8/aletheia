type PipelineEvent = {
  status?: string;
  progress?: number;
};

type SegmentationOutput = {
  mask?: unknown;
};

export type SegmentationRunner = (image: string) => Promise<SegmentationOutput[]>;

export type ModelTier = "fast" | "precise";

export class BriaModelSession {
  private static runner: SegmentationRunner | null = null;
  private static loadedTier: ModelTier | null = null;

  static async getRunner(
    tier: ModelTier,
    onProgress?: (progress: number) => void,
  ): Promise<SegmentationRunner> {
    if (this.runner && this.loadedTier === tier) {
      return this.runner;
    }

    const transformers = await import("@huggingface/transformers");
    const pipeline = transformers.pipeline as (...args: unknown[]) => Promise<unknown>;
    const env = transformers.env as { allowLocalModels: boolean; useBrowserCache: boolean };

    env.allowLocalModels = false;
    env.useBrowserCache = false;

    const modelId = tier === "precise" ? "briaai/RMBG-2.0" : "briaai/RMBG-1.4";

    const progressCallback = (event: PipelineEvent) => {
      if (event.status === "progress" && event.progress !== undefined) {
        onProgress?.(Math.round(event.progress));
      }
    };

    try {
      this.runner = (await pipeline("image-segmentation", modelId, {
        device: "webgpu",
        dtype: "fp32",
        progress_callback: progressCallback,
      })) as SegmentationRunner;
    } catch {
      this.runner = (await pipeline("image-segmentation", modelId, {
        device: "wasm",
        dtype: "fp32",
        progress_callback: progressCallback,
      })) as SegmentationRunner;
    }

    this.loadedTier = tier;
    return this.runner;
  }
}
