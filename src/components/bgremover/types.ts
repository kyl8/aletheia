import type { Lang } from "../../utils/i18n";

export interface BgRemoverProps {
  lang: Lang;
  onBack: () => void;
}

export interface BgRemoverLabels {
  title: string;
  subtitle: string;
  uploadTitle: string;
  uploadHint: string;
  yourImage: string;
  result: string;
  clear: string;
  remove: string;
  download: string;
  original: string;
  removed: string;
  downloading: string;
  processing: string;
  error: string;
  info: string;
  back: string;
  quality: string;
  fast: string;
  precise: string;
  preciseHint: string;
  fastHint: string;
  genericFailure: string;
}
