import type { ModelQuality } from "../../utils/bgremover/bg-remover";

interface QualitySelectorProps {
  qualityLabel: string;
  fastLabel: string;
  preciseLabel: string;
  fastHint: string;
  preciseHint: string;
  selectedTier: ModelQuality;
  isProcessing: boolean;
  onChangeTier: (mode: ModelQuality) => void;
}

export default function QualitySelector({
  qualityLabel,
  fastLabel,
  preciseLabel,
  fastHint,
  preciseHint,
  selectedTier,
  isProcessing,
  onChangeTier,
}: QualitySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="font-silkscreen text-xs uppercase">{qualityLabel}</label>
      <div className="flex gap-4">
        <button
          onClick={() => onChangeTier("fast")}
          className={`flex-1 border-4 border-zinc-900 dark:border-zinc-200 px-4 py-4 font-silkscreen text-xs uppercase pixel-box transition-transform ${
            selectedTier === "fast" ? "bg-emerald-500 text-zinc-900 dark:bg-emerald-400 font-bold scale-[1.02]" : "bg-white dark:bg-[#18181b] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
          disabled={isProcessing}
        >
          {fastLabel}
        </button>
        <button
          onClick={() => onChangeTier("precise")}
          className={`flex-1 border-4 border-zinc-900 dark:border-zinc-200 px-4 py-4 font-silkscreen text-xs uppercase pixel-box transition-transform ${
            selectedTier === "precise" ? "bg-indigo-500 text-white font-bold scale-[1.02]" : "bg-white dark:bg-[#18181b] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
          disabled={isProcessing}
        >
          {preciseLabel}
        </button>
      </div>
      <p className="font-vt323 text-lg text-zinc-600 dark:text-zinc-300">
        {selectedTier === "precise" ? preciseHint : fastHint}
      </p>
    </div>
  );
}
