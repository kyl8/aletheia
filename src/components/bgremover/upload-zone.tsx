import { Upload } from "lucide-react";

interface UploadZoneProps {
  uploadTitle: string;
  uploadHint: string;
  onDrop: (event: React.DragEvent) => void;
  onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function UploadZone({ uploadTitle, uploadHint, onDrop, onSelect }: UploadZoneProps) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={(event) => event.preventDefault()}
      onClick={() => document.getElementById("bg-file-input")?.click()}
      className="border-4 border-dashed border-zinc-900 dark:border-zinc-200 p-12 text-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-[#1e1b4b] pixel-box transition-all hover:border-solid hover:border-indigo-500 group bg-white dark:bg-[#18181b]"
    >
      <input id="bg-file-input" type="file" accept="image/*" onChange={onSelect} className="hidden" />
      <Upload size={42} className="mx-auto mb-4" />
      <p className="font-silkscreen text-sm uppercase">{uploadTitle}</p>
      <p className="mt-2 font-vt323 text-xl text-zinc-600 dark:text-zinc-300">{uploadHint}</p>
    </div>
  );
}
