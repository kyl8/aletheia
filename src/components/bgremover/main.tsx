import { useCallback, useMemo, useRef, useState } from "react";
import { t } from "../../utils/i18n";
import { RefreshCw, XCircle, Info } from "lucide-react";
import {
  ENABLE_PRECISE_TIER,
  extractForeground,
  readImageAsDataUrl,
  type ModelQuality,
  type TaskState,
} from "../../utils/bgremover/bg-remover";
import BgRemoverHeader from "./header";
import QualitySelector from "./quality-selector";
import UploadZone from "./upload-zone";
import { ResultStage, SourceStage } from "./image-stage";
import type { BgRemoverLabels, BgRemoverProps } from "./types";

function useLabels(lang: BgRemoverProps["lang"]): BgRemoverLabels {
  return useMemo(
    () => ({
      title: t("bgTitle", lang),
      subtitle: t("bgSubtitle", lang),
      uploadTitle: t("bgUploadTitle", lang),
      uploadHint: t("bgUploadHint", lang),
      yourImage: t("bgYourImage", lang),
      result: t("bgResult", lang),
      clear: t("bgClear", lang),
      remove: t("bgRemove", lang),
      download: t("bgDownload", lang),
      original: t("bgOriginal", lang),
      removed: t("bgRemoved", lang),
      downloading: t("bgDownloading", lang),
      processing: t("bgProcessing", lang),
      error: t("bgError", lang),
      info: t("bgInfo", lang),
      back: t("bgBack", lang),
      quality: t("bgQuality", lang),
      fast: t("bgFast", lang),
      precise: t("bgPrecise", lang),
      preciseHint: t("bgPreciseHint", lang),
      fastHint: t("bgFastHint", lang),
      genericFailure: t("bgProcessFailed", lang),
    }),
    [lang],
  );
}

export default function BackgroundRemoverTool({ lang, onBack }: BgRemoverProps) {
  const labels = useLabels(lang);

  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<ModelQuality>("fast");
  const [runState, setRunState] = useState<TaskState>({ status: "idle" });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadSelectedFile = useCallback(async (file: File) => {
    const dataUrl = await readImageAsDataUrl(file);
    setOriginalImageUrl(dataUrl);
    setProcessedImageUrl(null);
    setRunState({ status: "idle" });
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        void loadSelectedFile(file);
      }
    },
    [loadSelectedFile],
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        void loadSelectedFile(file);
      }
      event.target.value = "";
    },
    [loadSelectedFile],
  );

  const resetImages = () => {
    setOriginalImageUrl(null);
    setProcessedImageUrl(null);
    setRunState({ status: "idle" });
  };

  const downloadResult = () => {
    if (!processedImageUrl) return;
    const link = document.createElement("a");
    link.download = "background-removed.png";
    link.href = processedImageUrl;
    link.click();
  };

  const removeBackground = async () => {
    if (!originalImageUrl || !canvasRef.current) return;

    try {
      setRunState({ status: "downloading", message: labels.downloading, progress: 0 });
      const outputImage = await extractForeground({
        imageDataUrl: originalImageUrl,
        quality: selectedQuality,
        canvas: canvasRef.current,
        onModelProgress: (progressValue) => {
          setRunState({
            status: "downloading",
            message: labels.downloading,
            progress: progressValue,
          });
        },
        onRunStart: () => {
          setRunState({ status: "processing", message: labels.processing });
        },
      });

      setProcessedImageUrl(outputImage);
      setRunState({ status: "done" });
    } catch (error) {
      console.error("Background removal failed:", error);
      setRunState({
        status: "error",
        message: error instanceof Error ? error.message : labels.genericFailure,
      });
    }
  };

  const isBusy = runState.status === "downloading" || runState.status === "processing";

  return (
    <div className="space-y-6 bg-zinc-50 dark:bg-[#000000] border-4 border-zinc-900 dark:border-emerald-500 p-8 pixel-box max-w-4xl mx-auto dark:shadow-[inset_0_0_20px_rgba(16,185,129,0.15)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20 dark:opacity-40 z-10 mix-blend-overlay" />
      
      <div className="relative z-20">
        <BgRemoverHeader title={labels.title} subtitle={labels.subtitle} backLabel={labels.back} onBack={onBack} />

      {ENABLE_PRECISE_TIER && (
        <QualitySelector
          qualityLabel={labels.quality}
          fastLabel={labels.fast}
          preciseLabel={labels.precise}
          fastHint={labels.fastHint}
          preciseHint={labels.preciseHint}
          selectedTier={selectedQuality}
          isProcessing={isBusy}
          onChangeTier={setSelectedQuality}
        />
      )}

      {!originalImageUrl ? (
        <UploadZone uploadTitle={labels.uploadTitle} uploadHint={labels.uploadHint} onDrop={handleDrop} onSelect={handleFileSelect} />
      ) : !processedImageUrl ? (
        <SourceStage
          title={labels.yourImage}
          clearLabel={labels.clear}
          sourceImage={originalImageUrl}
          isProcessing={isBusy}
          onClear={resetImages}
        />
      ) : (
        <ResultStage
          resultTitle={labels.result}
          clearLabel={labels.clear}
          downloadLabel={labels.download}
          originalLabel={labels.original}
          removedLabel={labels.removed}
          sourceImage={originalImageUrl}
          resultImage={processedImageUrl}
          onClear={resetImages}
          onDownload={downloadResult}
        />
      )}

      {originalImageUrl && !processedImageUrl && (
        <div className="space-y-2 mt-4 relative z-20">
          <button
            onClick={removeBackground}
            disabled={isBusy}
            className="w-full h-14 border-4 border-zinc-900 dark:border-emerald-500 bg-indigo-600 dark:bg-[#050510] text-white dark:text-emerald-400 pixel-box font-silkscreen text-sm uppercase flex items-center justify-center gap-3 disabled:opacity-60 hover:bg-indigo-500 dark:hover:bg-emerald-900/40 transition-colors shadow-[4px_4px_0_0_#18181b] dark:shadow-[4px_4px_0_0_#10b981] active:translate-y-1"
          >
            {isBusy ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>{runState.message}</span>
                {runState.status === "downloading" && runState.progress !== undefined && <span>{runState.progress}%</span>}
              </>
            ) : (
              labels.remove
            )}
          </button>

          {runState.status === "downloading" && runState.progress !== undefined && (
            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${runState.progress}%` }} />
            </div>
          )}
        </div>
      )}

      {runState.status === "error" && (
        <div className="flex items-start gap-3 p-4 border-4 border-red-500 bg-red-100 dark:bg-[#050510] relative z-20">
          <XCircle size={20} className="text-red-500 shrink-0 mt-0.5 dark:brightness-0 dark:sepia dark:saturate-[500%] dark:hue-rotate-[100deg]" />
          <div>
            <p className="font-silkscreen text-xs uppercase text-red-600">{labels.error}</p>
            <p className="font-vt323 text-xl text-zinc-700 dark:text-red-400">{runState.message}</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-start gap-2 p-3 bg-zinc-100 dark:bg-[#050510] border-4 border-zinc-900 dark:border-emerald-500 relative z-20">
        <Info size={16} className="text-zinc-500 dark:text-emerald-500 shrink-0 mt-1 dark:brightness-0 dark:sepia dark:saturate-[500%] dark:hue-rotate-[100deg]" />
        <p className="font-vt323 text-lg text-zinc-600 dark:text-emerald-600">{labels.info}</p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
