import React, { useState, useEffect, useCallback } from "react";
import { X, Download, Loader2, FileText, AlertTriangle } from "lucide-react";
import type { ResumeData } from "../../utils/cv/parser"; 
import type { Lang } from "../../utils/i18n";
import { compileTypstToPdf } from "../../utils/cv/typst";

interface PdfViewerProps {
  isOpen: boolean;
  onClose: () => void;
  data: ResumeData;
  lang: Lang;
}

export default function PdfViewer({ isOpen, onClose, data, lang }: PdfViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePdf = useCallback(async () => {
    setIsCompiling(true);
    setError(null);
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      const blobUrl = await compileTypstToPdf(data, lang);
      setPdfUrl(blobUrl);
    } catch (err: any) {
      console.error("Erro na compilação WASM:", err);
      setError(err.message || "Falha ao compilar o PDF.");
    } finally {
      setIsCompiling(false);
    }
  }, [data, lang]);

  useEffect(() => {
    if (isOpen) {
      generatePdf();
    }
  }, [isOpen, generatePdf]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white dark:bg-zinc-900 border-4 border-zinc-900 dark:border-zinc-200 w-full max-w-5xl h-full max-h-[90vh] flex flex-col pixel-box animate-in zoom-in-95 duration-200 shadow-[10px_10px_0px_0px_#000]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b-4 border-zinc-900 dark:border-zinc-200 bg-[#f4f4f5] dark:bg-[#09090b]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 border-4 border-zinc-900 dark:border-zinc-200">
              <FileText size={20} strokeWidth={3} className="text-white" />
            </div>
            <div>
              <h2 className="font-silkscreen text-lg text-zinc-900 dark:text-zinc-100 uppercase leading-none">
                Preview
              </h2>
              <span className="font-dotgothic text-[10px] text-indigo-500 uppercase tracking-tighter">
                WASM_ENGINE_READY
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {pdfUrl && (
              <a 
                href={pdfUrl} 
                download={`${data.nome?.replace(/\s+/g, "_") || "curriculo"}.pdf`}
                className="flex items-center gap-2 px-4 py-2 font-silkscreen text-[10px] uppercase bg-emerald-500 text-zinc-900 border-4 border-zinc-900 hover:bg-emerald-400 active:translate-y-1 transition-transform"
              >
                <Download size={14} strokeWidth={3} /> Baixar
              </a>
            )}
            <button 
              onClick={onClose} 
              className="p-2 bg-red-500 text-white border-4 border-zinc-900 hover:bg-red-600 active:translate-y-1 transition-transform"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* CONTEUDO */}
        <div className="flex-grow relative bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
          {isCompiling ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-100 dark:bg-zinc-900">
              <Loader2 size={48} strokeWidth={3} className="text-indigo-500 animate-spin" />
              <p className="font-vt323 text-2xl text-zinc-600 dark:text-zinc-400">
                Compilando binário...
              </p>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center bg-zinc-100 dark:bg-zinc-900">
              <AlertTriangle size={48} strokeWidth={3} className="text-red-500" />
              <p className="font-silkscreen text-xl text-red-500 uppercase">System Error</p>
              <p className="font-vt323 text-xl text-zinc-700 dark:text-zinc-300 max-w-md">{error}</p>
              <button 
                onClick={generatePdf} 
                className="mt-4 px-6 py-3 font-silkscreen text-xs uppercase bg-zinc-900 text-white border-4 border-zinc-200"
              >
                Retry
              </button>
            </div>
          ) : pdfUrl ? (
            <iframe 
              src={`${pdfUrl}#toolbar=0&navpanes=0`} 
              className="w-full h-full border-none" 
              title="Resume Preview"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
} 