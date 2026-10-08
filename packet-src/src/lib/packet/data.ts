// Mock data for Packet. Replace with API responses via fileService later.

export type Kind =
  | "folder"
  | "pdf"
  | "image"
  | "archive"
  | "code"
  | "spreadsheet"
  | "database"
  | "video"
  | "audio"
  | "document"
  | "presentation"
  | "text";

export type Permission = "Owner" | "Editor" | "Viewer";

export interface Item {
  id: string;
  name: string;
  kind: Kind;
  parentId: string | null;
  size: number; // bytes (folders: aggregate)
  modified: string; // ISO
  opened?: string | undefined; // ISO, last accessed
  owner: string; // user id
  starred: boolean;
  shared: boolean;
  sharedWithMe?: boolean | undefined;
  permission?: Permission | undefined;
  hidden?: boolean | undefined;
  trashed?: boolean | undefined;
  trashedAt?: string | undefined;
  tags: string[];
  fileCount?: number | undefined;
  pinned?: boolean | undefined;
  pinLabel?: string | undefined;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initial: string;
  tone: "indigo" | "teal" | "violet" | "amber";
}

/** Fixed reference "now" so server and client render identical relative dates. */
export const REF_NOW = new Date("2026-10-03T16:00:00");

const ago = (mins: number) => new Date(REF_NOW.getTime() - mins * 60_000).toISOString();
const at = (iso: string) => new Date(iso).toISOString();
const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

export const users: Record<"me" | "sarah" | "alex" | "lena", User> & Record<string, User | undefined> = {
  me: { id: "me", name: "Pradyum", email: "pradyum@packet.dev", initial: "P", tone: "indigo" },
  sarah: { id: "sarah", name: "Sarah Lin", email: "sarah@packet.dev", initial: "S", tone: "teal" },
  alex: { id: "alex", name: "Alex Dev", email: "alex@packet.dev", initial: "A", tone: "violet" },
  lena: { id: "lena", name: "Lena Ortiz", email: "lena@packet.dev", initial: "L", tone: "amber" },
};

export const currentUserId = "me";

export const storage = {
  tier: "Tier 2 Cloud Volume",
  plan: "FREE",
  totalBytes: 100 * GB,
  categories: [
    { key: "documents", label: "Documents", bytes: 38.4 * GB, tone: "doc" },
    { key: "images", label: "Images", bytes: 18.2 * GB, tone: "img" },
    { key: "media", label: "Media & Video", bytes: 12.6 * GB, tone: "media" },
    { key: "other", label: "Other & Zip", bytes: 5.0 * GB, tone: "other" },
  ],
  endpoint: "s3.us-east-1.packet.internal",
  apiVersion: "v2.4.1",
  lastSyncMins: 2,
  changes: [
    { id: "c1", label: "Uploaded 3 files to RecallX", delta: 520.1 * MB, when: ago(90) },
    { id: "c2", label: "Emptied trash", delta: -2.4 * GB, when: ago(60 * 26) },
    { id: "c3", label: "Uploaded civicpulse.zip", delta: 184 * MB, when: ago(60 * 72) },
    { id: "c4", label: "Synced College lectures", delta: 1.8 * GB, when: ago(60 * 24 * 6) },
    { id: "c5", label: "Removed old backups", delta: -900 * MB, when: ago(60 * 24 * 11) },
  ],
};

const f = (p: Partial<Item> & Pick<Item, "id" | "name" | "kind">): Item => ({
  parentId: null,
  size: 0,
  modified: ago(60),
  owner: "me",
  starred: false,
  shared: false,
  tags: [],
  ...p,
});

export const initialItems: Item[] = [
  // Root folders
  f({ id: "projects", name: "Projects", kind: "folder", fileCount: 42, size: 3.2 * GB, modified: ago(10), pinned: true, shared: true, tags: ["work"] }),
  f({ id: "documents", name: "Documents", kind: "folder", fileCount: 128, size: 9.4 * GB, modified: ago(120), pinned: true }),
  f({ id: "images", name: "Images", kind: "folder", fileCount: 112, size: 6.1 * GB, modified: ago(60 * 24) }),
  f({ id: "college", name: "College", kind: "folder", fileCount: 16, size: 2.2 * GB, modified: at("2026-10-12T10:00:00".replace("2026-10-12", "2026-09-12")) }),
  f({ id: "personal", name: "Personal", kind: "folder", fileCount: 19, size: 1.1 * GB, modified: at("2026-09-28T09:00:00"), pinned: true }),
  f({ id: "work", name: "Work", kind: "folder", fileCount: 85, size: 4.8 * GB, modified: ago(60 * 24 * 4), shared: true }),

  // Projects
  f({ id: "recallx", name: "RecallX", kind: "folder", parentId: "projects", fileCount: 84, size: 3.24 * GB, modified: ago(30), pinned: true, pinLabel: "Work / RecallX", shared: true, tags: ["workspace"] }),
  f({ id: "civicpulse-src", name: "CivicPulse", kind: "folder", parentId: "projects", fileCount: 31, size: 420 * MB, modified: ago(60 * 70) }),

  // RecallX sub directories
  f({ id: "rx-projects", name: "Projects", kind: "folder", parentId: "recallx", fileCount: 48, size: 800 * MB, modified: ago(10) }),
  f({ id: "rx-documents", name: "Documents", kind: "folder", parentId: "recallx", fileCount: 24, size: 210 * MB, modified: ago(120) }),
  f({ id: "rx-images", name: "Images", kind: "folder", parentId: "recallx", fileCount: 112, size: 1.1 * GB, modified: ago(60 * 24) }),
  f({ id: "rx-college", name: "College", kind: "folder", parentId: "recallx", fileCount: 16, size: 90 * MB, modified: at("2026-09-12T10:00:00") }),
  f({ id: "rx-personal", name: "Personal", kind: "folder", parentId: "recallx", fileCount: 9, size: 40 * MB, modified: at("2026-09-28T10:00:00") }),
  f({ id: "rx-work", name: "Work", kind: "folder", parentId: "recallx", fileCount: 85, size: 500 * MB, modified: ago(60 * 24 * 4) }),

  // RecallX files
  f({ id: "schema", name: "schema-v2.sql", kind: "database", parentId: "recallx", size: 4.2 * MB, modified: at("2026-10-03T14:22:00"), opened: ago(20), starred: true, tags: ["db", "schema"] }),
  f({ id: "arch", name: "architecture-diagram.png", kind: "image", parentId: "recallx", size: 3.8 * MB, modified: ago(60 * 20), owner: "alex", opened: ago(45), tags: ["design"] }),
  f({ id: "agreement", name: "client-agreement-signed.pdf", kind: "pdf", parentId: "recallx", size: 1.1 * MB, modified: at("2024-10-24T11:00:00"), owner: "lena", starred: true, shared: true, tags: ["legal"] }),
  f({ id: "artifacts", name: "build-artifacts.tar.gz", kind: "archive", parentId: "recallx", size: 512 * MB, modified: ago(60 * 30), tags: ["ci"] }),
  f({ id: "env", name: "env-template.json", kind: "code", parentId: "recallx", size: 8 * KB, modified: ago(60 * 50), hidden: true, tags: ["config"] }),
  f({ id: "q2", name: "q2-financial-breakdown.xlsx", kind: "spreadsheet", parentId: "recallx", size: 640 * KB, modified: ago(60 * 24 * 5), owner: "sarah", shared: true, tags: ["finance"] }),

  // Root recent files
  f({ id: "resume", name: "resume.pdf", kind: "pdf", size: 240 * KB, modified: at("2026-10-03T09:12:00"), opened: ago(15), tags: ["career"] }),
  f({ id: "report", name: "project-report.pdf", kind: "pdf", parentId: "documents", size: 4.2 * MB, modified: ago(60 * 22), owner: "sarah", starred: true, shared: true, sharedWithMe: true, permission: "Editor", opened: ago(60 * 3), tags: ["report"] }),
  f({ id: "civic", name: "civicpulse.zip", kind: "archive", parentId: "projects", size: 184 * MB, modified: ago(60 * 72), opened: ago(60 * 26), tags: ["release"] }),
  f({ id: "pres", name: "presentation.pptx", kind: "presentation", parentId: "work", size: 14.8 * MB, modified: at("2026-05-14T10:00:00"), owner: "alex", shared: true, sharedWithMe: true, permission: "Viewer", opened: ago(60 * 30), tags: ["slides"] }),
  f({ id: "profile", name: "profile.png", kind: "image", parentId: "personal", size: 1.2 * MB, modified: at("2026-05-12T10:00:00"), opened: ago(60 * 50), tags: ["avatar"] }),
  f({ id: "db", name: "database.sql", kind: "database", parentId: "projects", size: 38.6 * MB, modified: at("2026-05-10T10:00:00"), tags: ["db"] }),

  // Others
  f({ id: "lecture", name: "distributed-systems-lecture.mp4", kind: "video", parentId: "college", size: 1.4 * GB, modified: at("2026-09-12T10:00:00"), tags: ["lecture"] }),
  f({ id: "podcast", name: "standup-recording.mp3", kind: "audio", parentId: "work", size: 48 * MB, modified: ago(60 * 24 * 8), owner: "sarah", sharedWithMe: true, shared: true, permission: "Viewer", tags: ["meeting"] }),
  f({ id: "notes", name: "meeting-notes.docx", kind: "document", parentId: "documents", size: 92 * KB, modified: ago(60 * 5), opened: ago(60 * 5), shared: true, tags: ["notes"] }),
  f({ id: "readme", name: "README.md", kind: "text", parentId: "recallx", size: 6 * KB, modified: ago(60 * 7), tags: ["docs"] }),
  f({ id: "backup", name: "photos-backup-2025.zip", kind: "archive", parentId: "images", size: 4.6 * GB, modified: at("2026-01-04T10:00:00") }),
  f({ id: "design-sys", name: "design-system.fig.pdf", kind: "pdf", parentId: "work", size: 22 * MB, modified: ago(60 * 24 * 2), owner: "lena", sharedWithMe: true, shared: true, permission: "Editor" }),

  // Trash
  f({ id: "oldlogo", name: "old-logo.svg", kind: "image", parentId: "images", size: 44 * KB, modified: at("2026-08-02T10:00:00"), trashed: true, trashedAt: ago(60 * 24 * 3) }),
  f({ id: "draft", name: "draft-v1.docx", kind: "document", parentId: "documents", size: 310 * KB, modified: at("2026-07-21T10:00:00"), trashed: true, trashedAt: ago(60 * 24 * 9) }),
  f({ id: "tmp", name: "tmp-export.csv", kind: "spreadsheet", parentId: "work", size: 2.1 * MB, modified: at("2026-09-01T10:00:00"), trashed: true, trashedAt: ago(60 * 24 * 1) }),
];
