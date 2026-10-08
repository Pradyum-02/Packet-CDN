import { REF_NOW, type Item, type Kind } from "./data";

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = REF_NOW;
  if (dayKey(d) === dayKey(now)) return `Today, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (dayKey(d) === dayKey(y)) return "Yesterday";
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days >= 0 && days < 7) return `${Math.max(days, 2)} days ago`;
  const base = `${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return d.getFullYear() === now.getFullYear() ? base : `${base}, ${d.getFullYear()}`;
}

export function formatRelative(iso: string): string {
  const mins = Math.max(0, Math.round((REF_NOW.getTime() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  if (mins < 60 * 48) return "yesterday";
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export const kindLabel: Record<Kind, string> = {
  folder: "Folder",
  pdf: "PDF Document",
  image: "Image",
  archive: "Archive",
  code: "JSON / Code",
  spreadsheet: "Spreadsheet",
  database: "Database",
  video: "Video",
  audio: "Audio",
  document: "Document",
  presentation: "Presentation",
  text: "Text",
};

export function kindFromName(name: string): Kind {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["zip", "gz", "tar", "rar", "7z"].includes(ext)) return "archive";
  if (["json", "js", "ts", "tsx", "py", "go", "rs", "yml", "yaml", "html", "css"].includes(ext)) return "code";
  if (["xlsx", "xls", "csv"].includes(ext)) return "spreadsheet";
  if (["sql", "db", "sqlite"].includes(ext)) return "database";
  if (["mp4", "mov", "webm", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "flac", "m4a"].includes(ext)) return "audio";
  if (["doc", "docx", "odt"].includes(ext)) return "document";
  if (["ppt", "pptx", "key"].includes(ext)) return "presentation";
  return "text";
}

export const isMedia = (i: Item) => ["image", "video", "audio"].includes(i.kind);
export const isDoc = (i: Item) => ["pdf", "document", "spreadsheet", "presentation", "text"].includes(i.kind);
