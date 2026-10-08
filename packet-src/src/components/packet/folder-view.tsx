import { Link } from "@tanstack/react-router";
import { ChevronRight, EyeOff, FolderOpen, FolderPlus, LayoutGrid, List, Share2, SlidersHorizontal, Star, UploadCloud, Filter } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatSize } from "@/lib/packet/format";
import { usePacket } from "@/lib/packet/store";
import { Breadcrumbs, EmptyState, FileIcon, Tabs } from "./common";
import { FileTable, SelectionBar, useOpenItem } from "./file-table";
import { FolderCard } from "./folder-card";

type F = "all" | "starred" | "shared" | "hidden";

export function FolderView({ folderId }: { folderId: string | null }) {
  const p = usePacket();
  const open = useOpenItem();
  const folder = folderId ? p.byId(folderId) : null;
  const [filter, setFilter] = useState<F>("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("modified");
  useEffect(() => { setSel(new Set()); setQ(""); }, [folderId]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a" && !(e.target as HTMLElement).closest("input")) { e.preventDefault(); setSel(new Set(files.map((f) => f.id))); }
      if (e.key === "Escape") { setSel(new Set()); setQ(""); }
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  });

  const all = p.children(folderId, { includeHidden: filter === "hidden" });
  const filtered = useMemo(() => all
    .filter((i) => (filter === "starred" ? i.starred : filter === "shared" ? i.shared : filter === "hidden" ? i.hidden : true))
    .filter((i) => i.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (sortBy === "size" ? b.size - a.size : sortBy === "name" ? a.name.localeCompare(b.name) : b.modified.localeCompare(a.modified))), [all, filter, q, sortBy]);
  const dirs = filtered.filter((i) => i.kind === "folder");
  const files = filtered.filter((i) => i.kind !== "folder");
  const totalFiles = folder?.fileCount ?? all.filter((i) => i.kind !== "folder").length;
  const totalSize = folder?.size ?? all.reduce((s, i) => s + i.size, 0);

  if (folderId && !folder) {
    return <EmptyState icon={<FolderOpen />} title="Folder not found" body="It may have been moved or deleted." action={<Link to="/files" className="btn primary" style={{ textDecoration: "none" }}>Back to My Files</Link>} />;
  }

  return (
    <>
      <div className="section-head" style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <Breadcrumbs folderId={folderId} />
          {folder?.tags.includes("workspace") && <span className="chip mono">branch:main</span>}
        </div>
        <span className="muted" style={{ fontSize: 11 }}>Directory: {totalFiles} files, {all.filter((i) => i.kind === "folder").length} folders · {formatSize(totalSize)}</span>
      </div>

      <div className="card toolbar">
        <div className="title">{folder?.name ?? "My Files"} <small>{folder?.tags.includes("workspace") ? "WORKSPACE" : "FOLDER"}</small></div>
        <label className="filter-input"><Filter size={12} /><input placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter in folder" /><span className="kbd">Esc</span></label>
        <Tabs plain value={filter} onChange={setFilter} options={[
          { value: "all", label: "All" }, { value: "starred", label: <><Star /> Starred</> },
          { value: "shared", label: <><Share2 /> Shared</> }, { value: "hidden", label: <><EyeOff /> Hidden</> },
        ]} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }} className="muted"><SlidersHorizontal size={13} />
            <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by"><option value="modified">Date Modified</option><option value="name">Name</option><option value="size">Size</option></select>
          </label>
          <div className="tabs">
            <button className={view === "list" ? "on" : ""} aria-label="List view" onClick={() => setView("list")}><List /></button>
            <button className={view === "grid" ? "on" : ""} aria-label="Grid view" onClick={() => setView("grid")}><LayoutGrid /></button>
          </div>
          <button className="btn" onClick={() => p.newFolder(folderId)}><FolderPlus /> <span className="hide-mobile">New Folder</span></button>
          <button className="btn primary" onClick={() => p.openDialog({ kind: "upload", parentId: folderId })}><UploadCloud /> Upload</button>
        </div>
      </div>

      <SelectionBar ids={[...sel]} onClear={() => setSel(new Set())} />

      {filtered.length === 0 ? (
        <div className="card" style={{ marginTop: 12 }}>
          <EmptyState icon={<FolderOpen />} title={q || filter !== "all" ? "No matches" : "This folder is empty"} body={q || filter !== "all" ? "Try a different filter." : "Drop files here or create a folder to get started."}
            action={<button className="btn primary" onClick={() => p.openDialog({ kind: "upload", parentId: folderId })}><UploadCloud /> Upload files</button>} />
        </div>
      ) : (
        <>
          {dirs.length > 0 && (
            <section style={{ marginTop: 14 }}>
              <div className="section-head"><span className="eyebrow">Directories <span className="chip mono">{dirs.length}</span></span><Link to="/files" className="link-btn">View all directories <ChevronRight size={12} /></Link></div>
              <div className="grid-6">{dirs.map((d, i) => <FolderCard key={d.id} folder={d} variant="dir" index={i} />)}</div>
            </section>
          )}
          {files.length > 0 && (
            <section style={{ marginTop: 16 }}>
              {view === "list" ? (
                <FileTable items={files} columns={["kind", "size", "modified"]} selected={sel} onSelect={setSel}
                  caption={<div className="table-cap"><span className="t">Files in {folder?.name ?? "My Files"}</span><span>Showing {files.length} of {totalFiles} items · <button className="link-btn" onClick={() => setSel(new Set(files.map((f) => f.id)))}>Select All (Cmd+A)</button></span></div>} />
              ) : (
                <div className="grid-6">
                  {files.map((f) => (
                    <button key={f.id} className={`folder-card sm ${sel.has(f.id) ? "" : ""}`} style={sel.has(f.id) ? { borderColor: "var(--primary)" } : undefined}
                      onClick={(e) => { if (e.metaKey || e.ctrlKey) { const n = new Set(sel); n.has(f.id) ? n.delete(f.id) : n.add(f.id); setSel(n); } else open(f); }}>
                      <FileIcon kind={f.kind} />
                      <span className="meta-top num">{formatSize(f.size)}</span>
                      <span className="name">{f.name}</span>
                      <span className="updated">{f.starred ? "★ Starred" : f.shared ? "Shared" : "Private"}</span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </>
  );
}
