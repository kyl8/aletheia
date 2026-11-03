import React from "react";
import { AlertTriangle } from "lucide-react";

export default function AlertModal({ isOpen, title, message, confirmText, cancelText, onConfirm, onCancel }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-900/70 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-zinc-900 border-4 border-zinc-900 dark:border-zinc-200 p-8 max-w-md w-full pixel-box animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-4 border-b-4 border-zinc-900 dark:border-zinc-200 pb-4 mb-6">
          <div className="bg-red-500 p-2 border-4 border-zinc-900 dark:border-zinc-200">
            <AlertTriangle size={24} strokeWidth={3} className="text-white" />
          </div>
          <h2 className="font-silkscreen text-xl text-red-500 uppercase">{title}</h2>
        </div>
        <p className="font-vt323 text-2xl text-zinc-700 dark:text-zinc-300 mb-8 leading-relaxed">{message}</p>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 font-silkscreen text-xs">
          <button onClick={onCancel} className="px-6 py-3 bg-zinc-200 dark:bg-zinc-800 border-4 border-zinc-900 dark:border-zinc-200">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="px-6 py-3 bg-red-500 text-white border-4 border-zinc-900 dark:border-zinc-200">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}