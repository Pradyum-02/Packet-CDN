import { createContext, useCallback, useContext, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { initialItems, REF_NOW, currentUserId, type Item } from "./data";
import { fileService } from "./fileService";
import { kindFromName } from "./format";

type Action =
  | { type: "star"; ids: string[]; value?: boolean }
  | { type: "trash"; ids: string[] }
  | { type: "restore"; ids: string[] }
  | { type: "purge"; ids: string[] }
  | { type: "emptyTrash" }
  | { type: "rename"; id: string; name: string }
  | { type: "move"; ids: string[]; parentId: string | null }
  | { type: "copy"; ids: string[]; parentId: string | null }
  | { type: "add"; item: Item }
  | { type: "share"; id: string };

const now = () => REF_NOW.toISOString();

function descendants(items: Item[], ids: string[]): Set<string> {
  const out = new Set(ids);
  let grew = true;
  while (grew) {
    grew = false;
    for (const i of items) if (i.parentId && out.has(i.parentId) && !out.has(i.id)) { out.add(i.id); grew = true; }
  }
  return out;
}

function reducer(items: Item[], a: Action): Item[] {
  switch (a.type) {
    case "star": {
      const set = new Set(a.ids);
      const allStarred = items.filter((i) => set.has(i.id)).every((i) => i.starred);
      const v = a.value ?? !allStarred;
      return items.map((i) => (set.has(i.id) ? { ...i, starred: v } : i));
    }
    case "trash": {
      const set = new Set(a.ids);
      return items.map((i) => (set.has(i.id) ? { ...i, trashed: true, trashedAt: now() } : i));
    }
    case "restore": {
      const set = new Set(a.ids);
      return items.map((i) => (set.has(i.id) ? { ...i, trashed: false, trashedAt: undefined } : i));
    }
    case "purge": {
      const set = descendants(items, a.ids);
      return items.filter((i) => !set.has(i.id));
    }
    case "emptyTrash": {
      const set = descendants(items, items.filter((i) => i.trashed).map((i) => i.id));
      return items.filter((i) => !set.has(i.id));
    }
    case "rename":
      return items.map((i) => (i.id === a.id ? { ...i, name: a.name, modified: now() } : i));
    case "move": {
      const set = new Set(a.ids);
      return items.map((i) => (set.has(i.id) && i.id !== a.parentId ? { ...i, parentId: a.parentId, modified: now() } : i));
    }
    case "copy": {
      const copies = items
        .filter((i) => a.ids.includes(i.id))
        .map((i) => ({ ...i, id: `${i.id}-copy-${Math.random().toString(36).slice(2, 7)}`, name: `Copy of ${i.name}`, parentId: a.parentId, modified: now(), owner: currentUserId, starred: false }));
      return [...items, ...copies];
    }
    case "add":
      return [...items, a.item];
    case "share":
      return items.map((i) => (i.id === a.id ? { ...i, shared: true } : i));
  }
}

export interface UploadEntry {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "done" | "error" | "canceled";
  parentId: string | null;
  error?: string | undefined;
}

export interface Toast { id: number; text: string; tone?: "ok" | "err" | undefined }

type Dialog =
  | { kind: "confirm"; title: string; body: string; confirm: string; danger?: boolean; onConfirm: () => void }
  | { kind: "prompt"; title: string; label: string; initial: string; confirm: string; onSubmit: (v: string) => void }
  | { kind: "move"; ids: string[]; mode: "move" | "copy" }
  | { kind: "share"; id: string }
  | { kind: "properties"; id: string }
  | { kind: "upload"; parentId: string | null };

export interface Settings {
  name: string;
  email: string;
  notifyShare: boolean;
  notifyUpload: boolean;
  notifyStorage: boolean;
  twoFactor: boolean;
  compact: boolean;
  theme: "dark" | "midnight";
  sidebar: "expanded" | "collapsed";
}

interface Ctx {
  items: Item[];
  dispatch: (a: Action) => void;
  byId: (id: string) => Item | undefined;
  children: (parentId: string | null, opts?: { includeHidden?: boolean }) => Item[];
  path: (id: string | null) => Item[];
  splatFor: (id: string) => string;
  uploads: UploadEntry[];
  startUploads: (files: { name: string; size: number }[], parentId: string | null) => void;
  retryUpload: (id: string) => void;
  cancelUpload: (id: string) => void;
  removeUpload: (id: string) => void;
  clearUploads: () => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast["tone"]) => void;
  dialog: Dialog | null;
  openDialog: (d: Dialog) => void;
  closeDialog: () => void;
  preview: string | null;
  setPreview: (id: string | null) => void;
  settings: Settings;
  updateSettings: (p: Partial<Settings>) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  // high-level helpers
  confirmDelete: (ids: string[], after?: () => void) => void;
  newFolder: (parentId: string | null) => void;
  rename: (id: string) => void;
  download: (ids: string[]) => void;
  copyLink: (id: string) => void;
}

const PacketContext = createContext<Ctx | null>(null);

export function PacketProvider({ children: kids }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, initialItems);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    name: "Pradyum", email: "pradyum@packet.dev", notifyShare: true, notifyUpload: true, notifyStorage: true,
    twoFactor: false, compact: false, theme: "dark", sidebar: "expanded",
  });
  const controllers = useRef(new Map<string, AbortController>());
  const toastId = useRef(0);

  const toast = useCallback((text: string, tone?: Toast["tone"]) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const byId = useCallback((id: string) => items.find((i) => i.id === id), [items]);
  const children = useCallback(
    (parentId: string | null, opts?: { includeHidden?: boolean }) =>
      items.filter((i) => i.parentId === parentId && !i.trashed && (opts?.includeHidden || !i.hidden)),
    [items],
  );
  const path = useCallback(
    (id: string | null) => {
      const out: Item[] = [];
      let cur = id ? items.find((i) => i.id === id) : undefined;
      while (cur) { out.unshift(cur); cur = cur.parentId ? items.find((i) => i.id === cur!.parentId) : undefined; }
      return out;
    },
    [items],
  );
  const splatFor = useCallback((id: string) => path(id).map((p) => p.id).join("/"), [path]);

  const runUpload = useCallback((entry: UploadEntry) => {
    const ctrl = new AbortController();
    controllers.current.set(entry.id, ctrl);
    setUploads((u) => u.map((x) => (x.id === entry.id ? { ...x, progress: 0, status: "uploading", error: undefined } : x)));
    fileService
      .uploadFile(entry, entry.parentId, {
        signal: ctrl.signal,
        onProgress: (p) => setUploads((u) => u.map((x) => (x.id === entry.id ? { ...x, progress: p } : x))),
      })
      .then(() => {
        setUploads((u) => u.map((x) => (x.id === entry.id ? { ...x, progress: 100, status: "done" } : x)));
        dispatch({ type: "add", item: { id: `up-${entry.id}`, name: entry.name, kind: kindFromName(entry.name), parentId: entry.parentId, size: entry.size, modified: now(), opened: now(), owner: currentUserId, starred: false, shared: false, tags: [] } });
      })
      .catch((e: Error) => {
        const canceled = e.name === "AbortError";
        setUploads((u) => u.map((x) => (x.id === entry.id ? { ...x, status: canceled ? "canceled" : "error", error: canceled ? "Canceled" : e.message } : x)));
      })
      .finally(() => controllers.current.delete(entry.id));
  }, []);

  const startUploads = useCallback((files: { name: string; size: number }[], parentId: string | null) => {
    const entries = files.map((f) => ({ id: Math.random().toString(36).slice(2, 10), name: f.name, size: f.size, progress: 0, status: "uploading" as const, parentId }));
    setUploads((u) => [...entries, ...u]);
    entries.forEach(runUpload);
  }, [runUpload]);

  const value = useMemo<Ctx>(() => {
    const openDialog = (d: Dialog) => setDialog(d);
    const closeDialog = () => setDialog(null);
    return {
      items, dispatch, byId, children, path, splatFor,
      uploads, startUploads,
      retryUpload: (id) => { const e = uploads.find((u) => u.id === id); if (e) runUpload(e); },
      cancelUpload: (id) => controllers.current.get(id)?.abort(),
      removeUpload: (id) => { controllers.current.get(id)?.abort(); setUploads((u) => u.filter((x) => x.id !== id)); },
      clearUploads: () => setUploads((u) => u.filter((x) => x.status === "uploading")),
      toasts, toast, dialog, openDialog, closeDialog, preview, setPreview,
      settings, updateSettings: (p) => setSettings((s) => ({ ...s, ...p })),
      sidebarCollapsed, setSidebarCollapsed,
      confirmDelete: (ids, after) => openDialog({
        kind: "confirm", title: `Move ${ids.length} item${ids.length > 1 ? "s" : ""} to trash?`,
        body: "Items in trash can be restored for 30 days before they are permanently removed.",
        confirm: "Move to Trash", danger: true,
        onConfirm: () => { dispatch({ type: "trash", ids }); toast(`${ids.length} item${ids.length > 1 ? "s" : ""} moved to trash`); after?.(); },
      }),
      newFolder: (parentId) => openDialog({
        kind: "prompt", title: "New folder", label: "Folder name", initial: "Untitled folder", confirm: "Create",
        onSubmit: (name) => { dispatch({ type: "add", item: { id: `f-${Math.random().toString(36).slice(2, 8)}`, name, kind: "folder", parentId, size: 0, fileCount: 0, modified: now(), owner: currentUserId, starred: false, shared: false, tags: [] } }); toast(`Folder “${name}” created`, "ok"); },
      }),
      rename: (id) => { const it = items.find((i) => i.id === id); if (!it) return; openDialog({ kind: "prompt", title: "Rename", label: "Name", initial: it.name, confirm: "Rename", onSubmit: (name) => { dispatch({ type: "rename", id, name }); toast("Renamed", "ok"); } }); },
      download: (ids) => { ids.forEach((id) => { const it = items.find((i) => i.id === id); if (it && it.kind !== "folder") void fileService.download(it); }); toast(`Downloading ${ids.length} item${ids.length > 1 ? "s" : ""}`); },
      copyLink: (id) => { const it = items.find((i) => i.id === id); if (!it) return; void navigator.clipboard?.writeText(fileService.shareLink(it)).catch(() => {}); toast("Link copied to clipboard", "ok"); },
    };
  }, [items, byId, children, path, splatFor, uploads, startUploads, runUpload, toasts, toast, dialog, preview, settings, sidebarCollapsed]);

  return <PacketContext.Provider value={value}>{kids}</PacketContext.Provider>;
}

export function usePacket() {
  const c = useContext(PacketContext);
  if (!c) throw new Error("usePacket must be used inside PacketProvider");
  return c;
}
