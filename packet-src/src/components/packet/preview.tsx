import { ChevronLeft, ChevronRight, Download, Maximize2, Share2, X, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import arch from "@/assets/architecture-diagram.jpg";
import { users, type Item } from "@/lib/packet/data";
import { formatDate, formatSize, kindLabel } from "@/lib/packet/format";
import { usePacket } from "@/lib/packet/store";
import { FileIcon } from "./common";

const sampleCode: Record<string, string> = {
  sql: `-- RecallX schema v2\nCREATE TABLE workspaces (\n  id UUID PRIMARY KEY,\n  name TEXT NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT now()\n);\n\nCREATE TABLE files (\n  id UUID PRIMARY KEY,\n  workspace_id UUID REFERENCES workspaces(id),\n  path TEXT NOT NULL,\n  size_bytes BIGINT DEFAULT 0\n);`,
  json: `{\n  "API_URL": "https://api.packet.dev",\n  "STORAGE_BUCKET": "packet-main",\n  "REGION": "us-east-1",\n  "MAX_UPLOAD_MB": 5120,\n  "ENABLE_SYNC": true\n}`,
  md: `# RecallX\n\nSpaced-repetition workspace built on Packet.\n\n## Setup\n\n  packet sync --watch\n\n// see architecture-diagram.png`,
};

function highlight(line: string) {
  const parts = line.split(/("[^"]*"|--.*$|\/\/.*$|\b\d+\b|\b(?:CREATE|TABLE|PRIMARY|KEY|REFERENCES|DEFAULT|NOT|NULL|TEXT|UUID|BIGINT|TIMESTAMPTZ|true|false)\b)/g);
  return parts.map((t, i) => {
    if (!t) return null;
    if (t.startsWith('"')) return <span key={i} className="tk-s">{t}</span>;
    if (t.startsWith("--") || t.startsWith("//")) return <span key={i} className="tk-c">{t}</span>;
    if (/^\d+$/.test(t)) return <span key={i} className="tk-n">{t}</span>;
    if (/^[A-Za-z]+$/.test(t) && i % 2 === 1) return <span key={i} className="tk-k">{t}</span>;
    return <span key={i}>{t}</span>;
  });
}

function Body({ item, page, zoom }: { item: Item; page: number; zoom: number }) {
  if (item.kind === "pdf") {
    return (
      <div className="pdf-page" style={{ transform: `scale(${zoom})` }}>
        <h4>{item.name.replace(/\.pdf$/, "")}</h4>
        <div style={{ fontSize: 10, marginBottom: 16, fontFamily: "var(--font-code)" }}>Page {page} · {users[item.owner]?.name}</div>
        {Array.from({ length: 22 }, (_, i) => <div key={i} className="ln" style={{ width: `${60 + ((i * 37 + page * 13) % 40)}%` }} />)}
      </div>
    );
  }
  if (item.kind === "image") return <img src={arch} alt={item.name} width={1280} height={800} style={{ maxWidth: "100%", height: "auto", objectFit: "contain", alignSelf: "center", transform: `scale(${zoom})`, borderRadius: 6 }} />;
  if (["code", "database", "text"].includes(item.kind)) {
    const ext = item.name.split(".").pop() ?? "";
    const src = sampleCode[ext] ?? sampleCode["json"] ?? "";
    return <div className="code-view" style={{ fontSize: 12.5 * zoom }}>{src.split("\n").map((l, i) => <div key={i} className="l"><i>{i + 1}</i><span>{highlight(l)}</span></div>)}</div>;
  }
  return null;
}

export function FilePreview() {
  const p = usePacket();
  const item = p.preview ? p.byId(p.preview) : undefined;
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { setPage(1); setZoom(1); }, [p.preview]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && p.setPreview(null);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [p]);
  if (!item) return null;
  const supported = ["pdf", "image", "code", "database", "text"].includes(item.kind);
  const pages = 4;
  return (
    <div className="preview" ref={ref} role="dialog" aria-label={`Preview ${item.name}`}>
      <div className="preview-bar">
        <FileIcon kind={item.kind} />
        <div style={{ minWidth: 0 }}><div className="nm">{item.name}</div><div className="muted" style={{ fontSize: 11 }}>{kindLabel[item.kind]} · {formatSize(item.size)}</div></div>
        {supported && (
          <div className="preview-tools">
            {item.kind === "pdf" && <>
              <button className="icon-btn" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((x) => Math.max(1, x - 1))}><ChevronLeft /></button>
              <span className="num" style={{ padding: "0 6px" }}>{page} / {pages}</span>
              <button className="icon-btn" aria-label="Next page" disabled={page === pages} onClick={() => setPage((x) => Math.min(pages, x + 1))}><ChevronRight /></button>
              <span className="vsep" />
            </>}
            <button className="icon-btn" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))}><ZoomOut /></button>
            <span className="num hide-mobile" style={{ width: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button className="icon-btn" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(1)))}><ZoomIn /></button>
            <button className="icon-btn hide-mobile" aria-label="Fullscreen" onClick={() => void ref.current?.requestFullscreen?.()}><Maximize2 /></button>
          </div>
        )}
        <div className="btn-row" style={{ marginLeft: supported ? 0 : "auto", flexWrap: "nowrap" }}>
          <button className="btn hide-mobile" onClick={() => p.openDialog({ kind: "share", id: item.id })}><Share2 /> Share</button>
          <button className="btn primary" onClick={() => p.download([item.id])}><Download /> <span className="hide-mobile">Download</span></button>
          <button className="icon-btn" aria-label="Close preview" onClick={() => p.setPreview(null)}><X /></button>
        </div>
      </div>
      <div className="preview-stage">
        {supported ? <Body item={item} page={page} zoom={zoom} /> : (
          <div className="card panel" style={{ alignSelf: "center", width: 380, maxWidth: "100%", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><FileIcon kind={item.kind} size="lg" /></div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
            <p className="muted" style={{ margin: "4px 0 16px" }}>Preview isn't available for this file type.</p>
            <dl className="props" style={{ textAlign: "left" }}>
              <dt>Type</dt><dd>{kindLabel[item.kind]}</dd><dt>Size</dt><dd>{formatSize(item.size)}</dd>
              <dt>Modified</dt><dd>{formatDate(item.modified)}</dd><dt>Owner</dt><dd>{users[item.owner]?.name}</dd>
            </dl>
            <button className="btn primary" style={{ marginTop: 16, width: "100%" }} onClick={() => p.download([item.id])}><Download /> Download</button>
          </div>
        )}
      </div>
    </div>
  );
}
