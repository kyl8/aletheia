import { useRef, useState } from "react";
import { UploadCloud, FilePlus, Loader2 } from "lucide-react";
import { t, type Lang } from "../../utils/i18n";

interface UpProps {
  onFile: (file: File) => void;
  onNew: () => void;
  lang: Lang;
}

export default function FileIngestion({ onFile, onNew, lang }: UpProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setFileName(file.name);
    try {
      await onFile(file);
    } finally {
      setIsProcessing(false);
      setFileName("");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-3xl mx-auto">
      
      {/* EXTRAIR COM IA */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`group relative p-6 bg-white dark:bg-zinc-900 text-center cursor-pointer pixel-box flex flex-col items-center justify-center min-h-[160px] ${
          isProcessing ? 'opacity-80' : 'hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
        } ${isDragging ? 'bg-indigo-100 dark:bg-indigo-900/40' : ''}`}
      >
        <input type="file" ref={fileInputRef} className="sr-only" accept=".pdf,.docx,.txt" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />

        <div className="mb-4 border-4 border-zinc-900 dark:border-zinc-200 p-3 bg-zinc-100 dark:bg-zinc-800">
          {isProcessing ? <Loader2 size={24} strokeWidth={3} className="text-indigo-500 animate-spin" /> : <UploadCloud size={24} strokeWidth={2} className="text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-500 group-hover:scale-110 transition-transform" />}
        </div>
        
        <h3 className="font-silkscreen text-sm leading-relaxed text-zinc-900 dark:text-white uppercase">
          {isProcessing ? t("uploadProcessing", lang) : t("uploadTitle", lang)}
        </h3>
        
        <p className="mt-2 font-vt323 text-lg text-zinc-600 dark:text-zinc-400">
          {isProcessing ? fileName : t("uploadDesc", lang)}
        </p>

        {!isProcessing && (
          <div className="mt-4 flex gap-2">
            {["PDF", "DOCX", "TXT"].map(fmt => (
              <span key={fmt} className="font-vt323 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-200 px-2 py-0.5 uppercase">{fmt}</span>
            ))}
          </div>
        )}
      </div>

      {/* CRIAR CV DO ZERO */}
      <div
        onClick={onNew}
        className="group p-6 bg-white dark:bg-zinc-900 text-center cursor-pointer pixel-box flex flex-col items-center justify-center min-h-[160px] hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
      >
        <div className="mb-4 border-4 border-zinc-900 dark:border-zinc-200 p-3 bg-zinc-100 dark:bg-zinc-800">
          <FilePlus size={24} strokeWidth={2} className="text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-500 group-hover:scale-110 transition-transform" />
        </div>
        
        <h3 className="font-silkscreen text-sm leading-relaxed text-zinc-900 dark:text-white uppercase">
          {t("scratchTitle", lang)}
        </h3>
        
        <p className="mt-2 font-vt323 text-lg text-zinc-600 dark:text-zinc-400">
          {t("scratchDesc", lang)}
        </p>
      </div>
    </div>
  );
}