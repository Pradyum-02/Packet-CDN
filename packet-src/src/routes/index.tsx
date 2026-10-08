import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, FilePlus2, FileUp, FolderPlus, Pin, Users } from "lucide-react";
import { useState } from "react";
import { storage } from "@/lib/packet/data";
import { isDoc, isMedia } from "@/lib/packet/format";
import { usePacket } from "@/lib/packet/store";
import { Tabs } from "@/components/packet/common";
import { FileTable, SelectionBar } from "@/components/packet/file-table";
import { FolderCard } from "@/components/packet/folder-card";
import { StorageOverview } from "@/components/packet/storage-overview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — Packet" },
      { name: "description", content: "Your Packet workspace: storage overview, pinned directories and recent files." },
      { property: "og:title", content: "Home — Packet" },
      { property: "og:description", content: "Storage overview, pinned directories and recent files." },
    ],
  }),
  component: Home,
});

const RECENT_IDS = ["resume", "report", "civic", "pres", "profile", "db"];

function Home() {
  const p = usePacket();
  const [tab, setTab] = useState<"all" | "docs" | "media" | "shared">("all");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const pinned = p.items.filter((i) => i.pinned && !i.trashed);
  const folderCount = p.items.filter((i) => i.kind === "folder" && !i.trashed).length;
  const recent = p.items
    .filter((i) => !i.trashed && i.kind !== "folder" && (RECENT_IDS.includes(i.id) || i.id.startsWith("up-")))
    .filter((i) => tab === "all" || (tab === "docs" ? isDoc(i) : tab === "media" ? isMedia(i) : i.shared));
  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow"><b>Workspace / Main</b><span className="dot" style={{ background: "var(--muted-foreground)", width: 4, height: 4 }} /><span style={{ textTransform: "none", letterSpacing: 0, display: "inline-flex", gap: 5, alignItems: "center" }}><span className="dot" /> Synced {storage.lastSyncMins}m ago</span></div>
          <h1 className="h1">Good morning, {p.settings.name}</h1>
          <p className="sub">Here's what's happening with your files across your workspace.</p>
        </div>
        <div className="btn-row">
          <button className="btn primary" onClick={() => p.openDialog({ kind: "upload", parentId: null })}><FileUp /> Upload File</button>
          <button className="btn" onClick={() => p.newFolder(null)}><FolderPlus /> New Folder</button>
          <Link to="/shared" className="btn" style={{ textDecoration: "none" }}><Users /> Shared With Me</Link>
          <button className="btn" onClick={() => p.toast("Request link copied — anyone with it can upload to Inbox", "ok")}><FilePlus2 /> Request Files</button>
        </div>
      </div>

      <div className="section" style={{ marginTop: 22 }}><StorageOverview /></div>

      <section className="section">
        <div className="section-head">
          <h2 className="h2"><Pin size={15} /> Pinned Directories</h2>
          <Link to="/files" className="link-btn">View all {folderCount} folders <ChevronRight size={12} /></Link>
        </div>
        <div className="grid-4">{pinned.map((f, i) => <FolderCard key={f.id} folder={f} index={i} />)}</div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="h2">Recent Files <span className="chip mono">{recent.length} files</span></h2>
          <Tabs value={tab} onChange={setTab} options={[{ value: "all", label: "All" }, { value: "docs", label: "Documents" }, { value: "media", label: "Media" }, { value: "shared", label: "Shared" }]} />
        </div>
        <SelectionBar ids={[...sel]} onClear={() => setSel(new Set())} />
        <FileTable items={recent} columns={["size", "modified", "owner"]} selected={sel} onSelect={setSel}
          empty={<div className="empty"><h4>Nothing here</h4><p>No recent files match this filter.</p></div>} />
      </section>
    </>
  );
}
