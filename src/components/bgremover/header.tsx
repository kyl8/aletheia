import { ArrowLeft } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  backLabel: string;
  onBack: () => void;
}

export default function BgRemoverHeader({ title, subtitle, backLabel, onBack }: HeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b-4 border-zinc-900 dark:border-zinc-200 pb-4">
      <div>
        <h2 className="font-silkscreen text-xl uppercase">{title}</h2>
        <p className="font-vt323 text-xl text-zinc-600 dark:text-zinc-300">{subtitle}</p>
      </div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 font-silkscreen text-xs uppercase border-4 border-zinc-900 dark:border-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      >
        <ArrowLeft size={16} /> {backLabel}
      </button>
    </div>
  );
}
