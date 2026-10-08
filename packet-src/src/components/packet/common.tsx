import { Link } from "@tanstack/react-router";
import { Folder, Archive, Code2, Database, FileText, Film, Image as ImageIcon, Music, Presentation, Sheet, FileType2, ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { users, type Item, type Kind } from "@/lib/packet/data";
import { usePacket } from "@/lib/packet/store";

const icons: Record<Kind, LucideIcon> = {
  folder: Folder, pdf: FileType2, image: ImageIcon, archive: Archive, code: Code2, spreadsheet: Sheet,
  database: Database, video: Film, audio: Music, document: FileText, presentation: Presentation, text: FileText,
};

export function FileIcon({ kind, size }: { kind: Kind; size?: "lg" }) {
  const I = icons[kind];
  return <span className={`ficon ${size ?? ""}`} data-k={kind} aria-hidden><I /></span>;
}

export function Avatar({ userId, showName }: { userId: string; showName?: boolean }) {
  const u = users[userId] ?? users["me"];
  const isMe = userId === "me";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }} title={u.name}>
      <span className={`avatar ${u.tone}`}>{isMe ? "Y" : u.initial}</span>
      {showName && <span>{isMe ? "You" : u.name}</span>}
    </span>
  );
}

export function Breadcrumbs({ folderId }: { folderId: string | null }) {
  const { path, splatFor } = usePacket();
  const trail = path(folderId);
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {trail.length === 0 ? <span className="cur"><Folder size={13} /> My Files</span> : <Link to="/files"><Folder /> My Files</Link>}
      {trail.map((f, i) => (
        <span key={f.id} style={{ display: "contents" }}>
          <ChevronRight size={12} className="muted" />
          {i === trail.length - 1 ? <span className="cur">{f.name}</span> : <Link to="/files/$" params={{ _splat: splatFor(f.id) }}>{f.name}</Link>}
        </span>
      ))}
    </nav>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="ico">{icon}</div>
      <h4>{title}</h4>
      <p style={{ maxWidth: 340 }}>{body}</p>
      {action && <div style={{ marginTop: 10 }}>{action}</div>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, sub, actions }: { eyebrow: ReactNode; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="h1">{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {actions && <div className="btn-row">{actions}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, options, onChange, plain }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void; plain?: boolean }) {
  return (
    <div className={`tabs ${plain ? "plain" : ""}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={value === o.value} className={value === o.value ? "on" : ""} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-label={label} aria-checked={checked} className="switch" onClick={() => onChange(!checked)} />;
}

export function itemCount(i: Item, kids: Item[]) {
  return i.fileCount ?? kids.length;
}
