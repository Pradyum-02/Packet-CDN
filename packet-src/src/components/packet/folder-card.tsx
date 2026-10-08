import { Link } from "@tanstack/react-router";
import { Folder, FolderOpen, Users } from "lucide-react";
import type { Item } from "@/lib/packet/data";
import { formatRelative } from "@/lib/packet/format";
import { usePacket } from "@/lib/packet/store";

export function FolderCard({ folder, variant = "pinned", index = 0 }: { folder: Item; variant?: "pinned" | "dir"; index?: number }) {
  const { splatFor, children } = usePacket();
  const count = folder.fileCount ?? children(folder.id).length;
  const splat = splatFor(folder.id);
  if (variant === "dir") {
    return (
      <Link to="/files/$" params={{ _splat: splat }} className="folder-card sm" style={{ textDecoration: "none", color: "inherit" }}>
        <span className={`ico ${index === 0 ? "solid" : ""}`}><Folder fill="currentColor" /></span>
        <span className="meta-top num">{count} files</span>
        <span className="name">{folder.name}</span>
        <span className="updated">Updated {formatRelative(folder.modified)}</span>
      </Link>
    );
  }
  return (
    <Link to="/files/$" params={{ _splat: splat }} className="folder-card" style={{ textDecoration: "none", color: "inherit" }}>
      <span className={`ico ${index === 1 ? "accent" : ""}`}>{index === 1 ? <FolderOpen /> : <Folder />}</span>
      <span className="name">{folder.pinLabel ?? folder.name}</span>
      <span className="meta">
        <span>{count} files</span>
        <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
          {folder.shared ? <><Users size={11} /> {index === 0 ? 4 : 6}</> : index === 2 ? "Vaulted" : "Private"}
        </span>
      </span>
    </Link>
  );
}
