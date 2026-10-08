import { useNavigate } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, CheckSquare, Copy, Download, Eye, ExternalLink, FolderInput, Info, Link2, MoreVertical, Pencil, Share2, Star, Trash2, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Item } from "@/lib/packet/data";
import { formatDate, formatSize, kindLabel } from "@/lib/packet/format";
import { usePacket } from "@/lib/packet/store";
import { Avatar, FileIcon } from "./common";

export type Column = "kind" | "size" | "modified" | "owner" | "location" | "permission";
type SortKey = "name" | "size" | "modified";

export function useOpenItem() {
  const { setPreview, splatFor } = usePacket();
  const navigate = useNavigate();
  return (item: Item) => {
    if (item.kind === "folder") navigate({ to: "/files/$", params: { _splat: splatFor(item.id) } });
    else setPreview(item.id);
  };
}

export function ContextMenu({ item, x, y, onClose }: { item: Item; x: number; y: number; onClose: () => void }) {
  const p = usePacket();
  const open = useOpenItem();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.max(8, Math.min(x - r.width, window.innerWidth - r.width - 8));
    const top = y + r.height > window.innerHeight - 8 ? Math.max(8, y - r.height) : y;
    setPos({ left, top });
    el.querySelector("button")?.focus();
  }, [x, y]);

  useEffect(() => {
    const down = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const t = setTimeout(() => document.addEventListener("mousedown", down));
    document.addEventListener("keydown", key);
    window.addEventListener("scroll", onClose, true);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); window.removeEventListener("scroll", onClose, true); };
  }, [onClose]);

  const act = (fn: () => void) => () => { fn(); onClose(); };
  const isFolder = item.kind === "folder";
  return (
    <div ref={ref} className="menu" role="menu" style={pos}>
      <div className="lbl">Actions · {kindLabel[item.kind]}</div>
      {!isFolder && <button role="menuitem" onClick={act(() => p.setPreview(item.id))}><Eye /> Preview <span className="kbd">Space</span></button>}
      <button role="menuitem" onClick={act(() => open(item))}><ExternalLink /> Open</button>
      {!isFolder && <button role="menuitem" onClick={act(() => p.download([item.id]))}><Download /> Download</button>}
      <hr />
      <button role="menuitem" onClick={act(() => p.openDialog({ kind: "share", id: item.id }))}><Share2 /> Share</button>
      <button role="menuitem" onClick={act(() => p.copyLink(item.id))}><Link2 /> Copy link</button>
      <hr />
      <button role="menuitem" onClick={act(() => p.rename(item.id))}><Pencil /> Rename <span className="kbd">F2</span></button>
      <button role="menuitem" onClick={act(() => p.openDialog({ kind: "move", ids: [item.id], mode: "move" }))}><FolderInput /> Move</button>
      <button role="menuitem" onClick={act(() => p.openDialog({ kind: "move", ids: [item.id], mode: "copy" }))}><Copy /> Copy</button>
      <button role="menuitem" onClick={act(() => p.dispatch({ type: "star", ids: [item.id] }))}><Star /> {item.starred ? "Unstar" : "Star"}</button>
      <button role="menuitem" onClick={act(() => p.openDialog({ kind: "properties", id: item.id }))}><Info /> Properties</button>
      <hr />
      <button role="menuitem" className="danger" onClick={act(() => p.confirmDelete([item.id]))}><Trash2 /> Delete <span className="kbd">Del</span></button>
    </div>
  );
}

export function SelectionBar({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  const p = usePacket();
  if (!ids.length) return null;
  const total = ids.reduce((s, id) => s + (p.byId(id)?.size ?? 0), 0);
  const allStar = ids.every((id) => p.byId(id)?.starred);
  return (
    <div className="selbar" role="region" aria-label="Selection actions">
      <div className="count"><CheckSquare size={15} /> {ids.length} item{ids.length > 1 ? "s" : ""} selected <span className="total">Total: {formatSize(total)}</span></div>
      <div className="acts">
        <button className="btn sm on-selection" onClick={() => p.download(ids)}><Download /> <span className="hide-mobile">Download</span></button>
        <button className="btn sm on-selection" onClick={() => p.openDialog({ kind: "move", ids, mode: "move" })}><FolderInput /> <span className="hide-mobile">Move</span></button>
        <button className="btn sm on-selection" onClick={() => p.openDialog({ kind: "move", ids, mode: "copy" })}><Copy /> <span className="hide-mobile">Copy</span></button>
        <button className="btn sm on-selection" onClick={() => p.openDialog({ kind: "share", id: ids[0]! })}><Share2 /> <span className="hide-mobile">Share</span></button>
        <button className="btn sm on-selection" aria-label="Star" onClick={() => p.dispatch({ type: "star", ids })}><Star className={allStar ? "star-on" : ""} /></button>
        <button className="btn sm danger" onClick={() => p.confirmDelete(ids, onClear)}><Trash2 /> <span className="hide-mobile">Delete</span></button>
        <button className="icon-btn" aria-label="Clear selection" onClick={onClear}><X /></button>
      </div>
    </div>
  );
}

interface Props {
  items: Item[];
  columns: Column[];
  selected?: Set<string>;
  onSelect?: (s: Set<string>) => void;
  actions?: (item: Item) => React.ReactNode;
  caption?: React.ReactNode;
  empty?: React.ReactNode;
}

export function FileTable({ items, columns, selected, onSelect, actions, caption, empty }: Props) {
  const p = usePacket();
  const open = useOpenItem();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [menu, setMenu] = useState<{ item: Item; x: number; y: number } | null>(null);
  const selectable = !!onSelect && !!selected;

  const sorted = [...items].sort((a, b) => {
    if ((a.kind === "folder") !== (b.kind === "folder")) return a.kind === "folder" ? -1 : 1;
    const v = sort.key === "name" ? a.name.localeCompare(b.name) : sort.key === "size" ? a.size - b.size : a.modified.localeCompare(b.modified);
    return v * sort.dir;
  });

  const toggle = (id: string) => { if (!selected || !onSelect) return; const n = new Set(selected); if (n.has(id)) n.delete(id); else n.add(id); onSelect(n); };
  const allOn = selectable && items.length > 0 && items.every((i) => selected!.has(i.id));
  const someOn = selectable && items.some((i) => selected!.has(i.id));

  const SortTh = ({ k, label, cls }: { k: SortKey; label: string; cls?: string }) => (
    <th className={cls} aria-sort={sort.key === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button onClick={() => setSort((s) => ({ key: k, dir: s.key === k ? (s.dir === 1 ? -1 : 1) : 1 }))}>
        {label} {sort.key === k && (sort.dir === 1 ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
      </button>
    </th>
  );

  return (
    <div className={`table-wrap ${p.settings.compact ? "compact" : ""}`}>
      {caption}
      {items.length === 0 ? empty : (
        <table className="ft">
          <thead>
            <tr>
              {selectable && (
                <th className="c-check">
                  <input type="checkbox" className="check" aria-label="Select all" checked={allOn}
                    ref={(el) => { if (el) el.indeterminate = someOn && !allOn; }}
                    onChange={() => onSelect!(allOn ? new Set() : new Set(items.map((i) => i.id)))} />
                </th>
              )}
              <SortTh k="name" label="Name" cls="" />
              {columns.includes("kind") && <th className="hide-mobile" style={{ width: "16%" }}>Kind</th>}
              {columns.includes("location") && <th className="hide-mobile" style={{ width: "16%" }}>Location</th>}
              {columns.includes("size") && <SortTh k="size" label="Size" cls="hide-mobile" />}
              {columns.includes("permission") && <th className="hide-mobile" style={{ width: "12%" }}>Permission</th>}
              {columns.includes("modified") && <SortTh k="modified" label="Modified" cls="hide-tablet hide-mobile" />}
              {columns.includes("owner") && <th className="hide-mobile" style={{ width: "16%" }}>Owner</th>}
              <th className="c-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((it) => {
              const on = selected?.has(it.id);
              const parent = it.parentId ? p.byId(it.parentId) : null;
              return (
                <tr key={it.id} className={on ? "sel" : ""} onDoubleClick={() => open(it)}
                  onContextMenu={(e) => { e.preventDefault(); setMenu({ item: it, x: e.clientX + 200, y: e.clientY }); }}>
                  {selectable && <td className="c-check"><input type="checkbox" className="check" aria-label={`Select ${it.name}`} checked={!!on} onChange={() => toggle(it.id)} /></td>}
                  <td>
                    <div className="name-cell">
                      <FileIcon kind={it.kind} />
                      <button onClick={() => open(it)}>{it.name}</button>
                    </div>
                  </td>
                  {columns.includes("kind") && <td className="hide-mobile">{it.kind === "pdf" ? <span className="chip pdf">PDF Document</span> : <span className="secondary">{kindLabel[it.kind]}</span>}</td>}
                  {columns.includes("location") && <td className="hide-mobile secondary">{parent ? parent.name : "My Files"}</td>}
                  {columns.includes("size") && <td className="hide-mobile num">{it.kind === "folder" ? "—" : formatSize(it.size)}</td>}
                  {columns.includes("permission") && <td className="hide-mobile"><span className={`chip ${it.permission === "Editor" ? "primary" : ""}`}>{it.permission ?? "Owner"}</span></td>}
                  {columns.includes("modified") && <td className="hide-tablet hide-mobile num">{formatDate(it.trashedAt ?? it.modified)}</td>}
                  {columns.includes("owner") && <td className="hide-mobile"><Avatar userId={it.owner} showName /></td>}
                  <td className="c-actions">
                    <div className="row-actions">
                      {actions ? actions(it) : (
                        <>
                          <button className="icon-btn" aria-label={it.starred ? "Unstar" : "Star"} onClick={() => p.dispatch({ type: "star", ids: [it.id] })}><Star className={it.starred ? "star-on" : ""} /></button>
                          {it.kind !== "folder" && <button className="icon-btn hide-mobile" aria-label="Download" onClick={() => p.download([it.id])}><Download /></button>}
                          <button className="icon-btn" aria-label="More actions" aria-haspopup="menu" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setMenu({ item: it, x: r.right, y: r.bottom + 4 }); }}><MoreVertical /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {menu && <ContextMenu item={menu.item} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />}
    </div>
  );
}
