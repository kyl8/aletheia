import { Trash, Download } from "lucide-react";

interface SourceStageProps {
  title: string;
  clearLabel: string;
  sourceImage: string;
  isProcessing: boolean;
  onClear: () => void;
}

export function SourceStage({ title, clearLabel, sourceImage, isProcessing, onClear }: SourceStageProps) {
  return (
    <div className="space-y-4 mt-4">
      <div className="pt-2 flex items-center justify-between">
        <h3 className="font-silkscreen text-sm uppercase text-indigo-600 dark:text-indigo-400">//{title}</h3>
        <button
          onClick={onClear}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 font-silkscreen text-xs uppercase border-4 border-zinc-900 dark:border-zinc-200 bg-white dark:bg-[#18181b] pixel-box hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <Trash size={14} /> {clearLabel}
        </button>
      </div>

      <div className="border-4 border-zinc-900 dark:border-zinc-200 bg-white dark:bg-[#18181b] p-4 pixel-box shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.3)]">
        <img src={sourceImage} alt="Source" className="max-w-full max-h-80 mx-auto object-contain" />
      </div>
    </div>
  );
}

interface ResultStageProps {
  resultTitle: string;
  clearLabel: string;
  downloadLabel: string;
  originalLabel: string;
  removedLabel: string;
  sourceImage: string;
  resultImage: string;
  onClear: () => void;
  onDownload: () => void;
}

export function ResultStage({
  resultTitle,
  clearLabel,
  downloadLabel,
  originalLabel,
  removedLabel,
  sourceImage,
  resultImage,
  onClear,
  onDownload,
}: ResultStageProps) {
  return (
    <div className="space-y-4 mt-6">
      <div className="pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h3 className="font-silkscreen text-sm uppercase text-emerald-600 dark:text-emerald-400">//{resultTitle}</h3>
        <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full md:w-auto">
          <button
            onClick={onClear}
            className="min-w-[136px] flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 font-silkscreen text-xs uppercase border-4 border-zinc-900 dark:border-zinc-200 bg-white dark:bg-[#18181b] pixel-box hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Trash size={14} /> {clearLabel}
          </button>
          <button
            onClick={onDownload}
            className="min-w-[136px] flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 font-silkscreen text-xs uppercase border-4 border-zinc-900 dark:border-zinc-200 bg-emerald-400 text-zinc-900 pixel-box hover:bg-emerald-300"
          >
            <Download size={14} /> {downloadLabel}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        <div className="space-y-3">
          <p className="font-vt323 text-xl text-center text-zinc-600 dark:text-zinc-400">{originalLabel}</p>
          <div className="border-4 border-zinc-900 dark:border-zinc-200 bg-white dark:bg-[#18181b] aspect-square flex items-center justify-center p-3 pixel-box shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.3)]">
            <img src={sourceImage} alt="Original" className="max-w-full max-h-full object-contain" />
          </div>
        </div>
        <div className="space-y-3">
          <p className="font-vt323 text-xl text-center text-zinc-600 dark:text-zinc-400">{removedLabel}</p>
          <div
            className="border-4 border-zinc-900 dark:border-zinc-200 aspect-square flex items-center justify-center p-3 pixel-box shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.3)]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(82,82,91,0.35) 1px, transparent 0), linear-gradient(135deg, rgba(16,185,129,0.10), rgba(99,102,241,0.10))",
              backgroundSize: "10px 10px, 100% 100%",
              backgroundPosition: "0 0, 0 0",
            }}
          >
            <img src={resultImage} alt="Background removed" className="max-w-full max-h-full object-contain drop-shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
