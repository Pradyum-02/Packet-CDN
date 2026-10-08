/**
 * Service boundary for Packet. The UI only talks to this interface;
 * swap `mockFileService` for an HTTP implementation when the backend lands.
 */
import { initialItems, type Item } from "./data";

export interface UploadOptions {
  onProgress: (pct: number) => void;
  signal: AbortSignal;
}

export interface FileService {
  listItems(): Promise<Item[]>;
  uploadFile(file: { name: string; size: number }, parentId: string | null, opts: UploadOptions): Promise<void>;
  download(item: Item): Promise<void>;
  shareLink(item: Item): string;
}

export const mockFileService: FileService = {
  async listItems() {
    return structuredClone(initialItems);
  },
  uploadFile(file, _parentId, { onProgress, signal }) {
    return new Promise((resolve, reject) => {
      let pct = 0;
      // Deterministic-ish failure for demo: names containing "fail" or ~12% chance.
      const willFail = /fail/i.test(file.name) || Math.random() < 0.12;
      const failAt = 30 + Math.random() * 50;
      const timer = setInterval(() => {
        pct = Math.min(100, pct + 4 + Math.random() * 12);
        if (willFail && pct >= failAt) {
          clearInterval(timer);
          reject(new Error("Network interrupted"));
          return;
        }
        onProgress(Math.round(pct));
        if (pct >= 100) {
          clearInterval(timer);
          resolve();
        }
      }, 180);
      signal.addEventListener("abort", () => {
        clearInterval(timer);
        reject(new DOMException("Canceled", "AbortError"));
      });
    });
  },
  async download(item) {
    const blob = new Blob([`Packet mock download: ${item.name}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  shareLink(item) {
    return `https://packet.dev/s/${item.id}`;
  },
};

export const fileService: FileService = mockFileService;
