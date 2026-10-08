import { AlertCircle, CheckCircle2, Copy, Folder, Info, UploadCloud, X, RotateCw, Ban } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { users } from "@/lib/packet/data";
import { fileService } from "@/lib/packet/fileService";
import { formatDate, formatSize, kindLabel } from "@/lib/packet/format";
import { usePacket } from "@/lib/packet/store";
import { Avatar, FileIcon } from "./common";

export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" aria-label="Close" onClick={onClose}><X /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

function PromptBody({ label, initial, confirm, onSubmit, onClose }: { label: string; initial: string; confirm: string; onSubmit: (v: string) => void; onClose: () => void }) {
  const [v, setV] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.select(); }, []);
  const submit = () => { const t = v.trim(); if (!t) return; onSubmit(t); onClose(); };
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="field"><label htmlFor="prompt-in">{label}</label><input id="prompt-in" ref={ref} className="input" value={v} onChange={(e) => setV(e.target.value)} /></div>
      <div className="btn-row" style={{ justifyContent: "flex-end" }}><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={!v.trim()}>{confirm}</button></div>
    </form>
  );
}

function MoveBody({ ids, mode, onClose }: { ids: string[]; mode: "move" | "copy"; onClose: () => void }) {
  const p = usePacket();
  const [target, setTarget] = useState<string | null>(null);
  const folders = p.items.filter((i) => i.kind === "folder" && !i.trashed && !ids.includes(i.id));
  const depth = (id: string) => p.path(id).length - 1;
  return (
    <>
      <div style={{ maxHeight: 300, overflow: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        <button className={`nav-link ${target === null ? "active" : ""}`} onClick={() => setTarget(null)}><Folder /> My Files</button>
        {folders.map((f) => (
          <button key={f.id} className={`nav-link ${target === f.id ? "active" : ""}`} style={{ paddingLeft: 10 + (depth(f.id) + 1) * 16, background: target === f.id ? undefined : "transparent" }} onClick={() => setTarget(f.id)}><Folder /> {f.name}</button>
        ))}
      </div>
      <div className="btn-row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={() => { p.dispatch({ type: mode, ids, parentId: target }); p.toast(`${ids.length} item${ids.length > 1 ? "s" : ""} ${mode === "move" ? "moved" : "copied"} to ${target ? p.byId(target)?.name : "My Files"}`, "ok"); onClose(); }}>{mode === "move" ? "Move here" : "Copy here"}</button>
      </div>
    </>
  );
}

function ShareBody({ id, onClose }: { id: string; onClose: () => void }) {
  const p = usePacket();
  const it = p.byId(id);
  const [email, setEmail] = useState("");
  const [perm, setPerm] = useState("Viewer");
  const [people, setPeople] = useState<{ email: string; perm: string }[]>([{ email: users["sarah"].email, perm: "Editor" }]);
  if (!it) return null;
  return (
    <>
      <form className="btn-row" style={{ flexWrap: "nowrap" }} onSubmit={(e) => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) return p.toast("Enter a valid email", "err"); setPeople((x) => [...x, { email, perm }]); setEmail(""); p.dispatch({ type: "share", id }); p.toast(`Invited ${email}`, "ok"); }}>
        <input className="input" style={{ flex: 1 }} placeholder="Add people by email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select className="select" style={{ height: 32 }} value={perm} onChange={(e) => setPerm(e.target.value)}><option>Viewer</option><option>Editor</option></select>
        <button className="btn primary" style={{ height: 32 }}>Invite</button>
      </form>
      <div className="eyebrow" style={{ margin: "16px 0 6px" }}>People with access</div>
      <div className="set-row" style={{ padding: "8px 0" }}><Avatar userId={it.owner} showName /><span className="chip">Owner</span></div>
      {people.map((x) => (
        <div key={x.email} className="set-row" style={{ padding: "8px 0" }}><span>{x.email}</span><span className={`chip ${x.perm === "Editor" ? "primary" : ""}`}>{x.perm}</span></div>
      ))}
      <div className="eyebrow" style={{ margin: "16px 0 6px" }}>Link</div>
      <div className="btn-row" style={{ flexWrap: "nowrap" }}>
        <input className="input mono" style={{ flex: 1, fontSize: 12 }} readOnly value={fileService.shareLink(it)} />
        <button className="btn" style={{ height: 32 }} onClick={() => p.copyLink(id)}><Copy /> Copy</button>
      </div>
      <div className="btn-row" style={{ justifyContent: "flex-end", marginTop: 16 }}><button className="btn primary" onClick={onClose}>Done</button></div>
    </>
  );
}

function PropertiesBody({ id }: { id: string }) {
  const p = usePacket();
  const it = p.byId(id);
  if (!it) return null;
  return (
    <>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}><FileIcon kind={it.kind} size="lg" /><div><div style={{ fontWeight: 700 }}>{it.name}</div><div className="muted">{kindLabel[it.kind]}</div></div></div>
      <dl className="props">
        <dt>Size</dt><dd>{formatSize(it.size)}</dd>
        <dt>Location</dt><dd>/{p.path(it.parentId).map((x) => x.name).join("/")}</dd>
        <dt>Owner</dt><dd>{users[it.owner]?.name}</dd>
        <dt>Modified</dt><dd>{formatDate(it.modified)}</dd>
        <dt>Shared</dt><dd>{it.shared ? "Yes" : "No"}</dd>
        <dt>Tags</dt><dd>{it.tags.length ? it.tags.map((t) => `#${t}`).join(" ") : "—"}</dd>
        <dt>ID</dt><dd>{it.id}</dd>
      </dl>
    </>
  );
}

export function UploadBody({ parentId, onClose }: { parentId: string | null; onClose: () => void }) {
  const p = usePacket();
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const add = (list: FileList | null) => { if (list?.length) p.startUploads(Array.from(list).map((f) => ({ name: f.name, size: f.size })), parentId); };
  const target = parentId ? p.byId(parentId)?.name : "My Files";
  return (
    <>
      <div className={`dropzone ${over ? "over" : ""}`} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); }}>
        <UploadCloud />
        <div style={{ fontWeight: 700, fontSize: 14 }}>Drop files here</div>
        <div className="muted">or</div>
        <button className="btn primary" onClick={() => input.current?.click()}>Browse files</button>
        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Uploading to <b>{target}</b> · max 5 GB per file</div>
        <input ref={input} type="file" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      <UploadQueue />
      <div className="btn-row" style={{ justifyContent: "flex-end", marginTop: 14 }}>
        {p.uploads.some((u) => u.status !== "uploading") && <button className="btn" onClick={p.clearUploads}>Clear finished</button>}
        <button className="btn primary" onClick={onClose}>Done</button>
      </div>
    </>
  );
}

export function UploadQueue() {
  const p = usePacket();
  if (!p.uploads.length) return null;
  return (
    <div className="uq">
      {p.uploads.map((u) => {
        const cls = u.status === "done" ? "ok" : u.status === "error" || u.status === "canceled" ? "err" : "";
        return (
          <div key={u.id} className="uq-item">
            <FileIcon kind="text" />
            <div className="info">
              <div className="nm">{u.name}</div>
              <div className={`st ${cls}`}>
                <span>{u.status === "uploading" ? "Uploading…" : u.status === "done" ? "Completed" : u.status === "canceled" ? "Canceled" : `Failed · ${u.error}`}</span>
                <span className="num">{u.status === "uploading" ? `${u.progress}%` : formatSize(u.size)}</span>
              </div>
              <div className={`bar ${cls}`}><span style={{ width: `${u.status === "done" ? 100 : u.progress}%` }} /></div>
            </div>
            {u.status === "uploading" && <button className="icon-btn" aria-label="Cancel upload" onClick={() => p.cancelUpload(u.id)}><Ban /></button>}
            {(u.status === "error" || u.status === "canceled") && <button className="btn sm" onClick={() => p.retryUpload(u.id)}><RotateCw /> Retry</button>}
            {u.status !== "uploading" && <button className="icon-btn" aria-label="Remove" onClick={() => p.removeUpload(u.id)}><X /></button>}
          </div>
        );
      })}
    </div>
  );
}

export function GlobalDialogs() {
  const p = usePacket();
  const d = p.dialog;
  const close = p.closeDialog;
  return (
    <>
      {d?.kind === "confirm" && (
        <Modal title={d.title} onClose={close} footer={<><button className="btn" onClick={close}>Cancel</button><button className={`btn ${d.danger ? "danger" : "primary"}`} onClick={() => { d.onConfirm(); close(); }}>{d.confirm}</button></>}>
          <p className="sub">{d.body}</p>
        </Modal>
      )}
      {d?.kind === "prompt" && <Modal title={d.title} onClose={close}><PromptBody {...d} onClose={close} /></Modal>}
      {d?.kind === "move" && <Modal title={d.mode === "move" ? "Move to…" : "Copy to…"} onClose={close}><MoveBody ids={d.ids} mode={d.mode} onClose={close} /></Modal>}
      {d?.kind === "share" && <Modal title={`Share “${p.byId(d.id)?.name}”`} onClose={close} wide><ShareBody id={d.id} onClose={close} /></Modal>}
      {d?.kind === "properties" && <Modal title="Properties" onClose={close}><PropertiesBody id={d.id} /></Modal>}
      {d?.kind === "upload" && <Modal title="Upload files" onClose={close} wide><UploadBody parentId={d.parentId} onClose={close} /></Modal>}
      <div className="toast-stack" aria-live="polite">
        {p.toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone ?? ""}`}>{t.tone === "ok" ? <CheckCircle2 /> : t.tone === "err" ? <AlertCircle /> : <Info />}{t.text}</div>
        ))}
      </div>
    </>
  );
}
