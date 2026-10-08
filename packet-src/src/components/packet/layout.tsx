import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, Clock, FileText, FolderPlus, FolderUp, Folder, Home, Keyboard, LogOut, MoreVertical, PanelLeft, Plus, Search, Settings, Share2, Star, Trash2, Upload, UploadCloud, User, FilePlus2, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { storage } from "@/lib/packet/data";
import { formatSize } from "@/lib/packet/format";
import { usePacket } from "@/lib/packet/store";
import { GlobalDialogs } from "./modals";
import { FilePreview } from "./preview";

const nav: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/files", label: "My Files", icon: Folder },
  { to: "/recent", label: "Recent", icon: Clock },
  { to: "/starred", label: "Starred", icon: Star },
  { to: "/shared", label: "Shared", icon: Share2 },
  { to: "/trash", label: "Trash", icon: Trash2 },
];

export function usedBytes() { return storage.categories.reduce((s, c) => s + c.bytes, 0); }

function useCurrentFolder(): string | null {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (!path.startsWith("/files/")) return null;
  return path.split("/").filter(Boolean).pop() ?? null;
}

function Sidebar() {
  const p = usePacket();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const pct = (usedBytes() / storage.totalBytes) * 100;
  const [menu, setMenu] = useState(false);
  return (
    <aside className={`sidebar ${p.sidebarCollapsed ? "collapsed" : ""}`} aria-label="Primary">
      <div className="brand"><span className="brand-mark" /><span className="nav-label">Packet</span></div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map((n) => (
          <Link key={n.to} to={n.to} className={`nav-link ${isActive(n.to) ? "active" : ""}`} title={n.label}><n.icon /><span className="nav-label">{n.label}</span></Link>
        ))}
      </nav>
      <div className="side-sep" />
      <div className="side-storage hide-collapsed">
        <div className="row"><span>STORAGE</span><Link to="/storage" className="link-btn">Details</Link></div>
        <div className="bar"><span style={{ width: `${pct}%` }} /></div>
        <div className="side-meta">{formatSize(usedBytes())} of {formatSize(storage.totalBytes)} used ({Math.round(pct)}%)</div>
        <Link to="/storage" className="link-btn" style={{ marginTop: 6, color: "var(--foreground)", fontWeight: 600 }}><Upload size={11} /> Upgrade Storage</Link>
      </div>
      <div style={{ marginTop: 12 }}>
        <Link to="/settings" className={`nav-link ${isActive("/settings") ? "active" : ""}`} title="Settings"><Settings /><span className="nav-label">Settings</span></Link>
        <Link to="/storage" className={`nav-link ${isActive("/storage") ? "active" : ""}`} title="Storage" style={{ display: p.sidebarCollapsed ? undefined : "none" }}><UploadCloud /></Link>
      </div>
      <div className="side-user" style={{ position: "relative" }}>
        <span className="avatar square">{p.settings.name[0]}</span>
        <div className="hide-collapsed" style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}>{p.settings.name} <span className="chip">{storage.plan}</span></div>
          <div className="muted" style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" }}>{p.settings.email}</div>
        </div>
        <button className="icon-btn hide-collapsed" aria-label="Account menu" onClick={() => setMenu((m) => !m)}><MoreVertical /></button>
        {menu && (
          <div className="menu" style={{ position: "absolute", bottom: "110%", left: 0, right: 0 }} onMouseLeave={() => setMenu(false)}>
            <Link to="/settings" onClick={() => setMenu(false)} style={{ textDecoration: "none" }}><button><User /> Profile</button></Link>
            <button onClick={() => { p.setSidebarCollapsed(true); setMenu(false); }}><PanelLeft /> Collapse sidebar</button>
            <hr /><button onClick={() => { p.toast("Sign-out will be available once accounts are connected"); setMenu(false); }}><LogOut /> Sign out</button>
          </div>
        )}
      </div>
    </aside>
  );
}

function Topbar() {
  const p = usePacket();
  const navigate = useNavigate();
  const folder = useCurrentFolder();
  const q = useRouterState({ select: (s) => (s.location.pathname === "/search" ? ((s.location.search as { q?: string }).q ?? "") : "") });
  const [value, setValue] = useState(q);
  const [menu, setMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => setValue(q), [q]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); } };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);
  useEffect(() => {
    if (!menu) return;
    const c = () => setMenu(false);
    const t = setTimeout(() => document.addEventListener("click", c));
    return () => { clearTimeout(t); document.removeEventListener("click", c); };
  }, [menu]);
  return (
    <header className="topbar">
      <button className="icon-btn hide-mobile" aria-label="Toggle sidebar" onClick={() => p.setSidebarCollapsed(!p.sidebarCollapsed)}><PanelLeft /></button>
      <span className="brand-mark only-mobile" />
      <label className="search">
        <Search size={14} />
        <input ref={inputRef} aria-label="Search" placeholder="Search files, folders, or tags..." value={value}
          onChange={(e) => { setValue(e.target.value); navigate({ to: "/search", search: { q: e.target.value }, replace: true }); }} />
        <span className="kbd hide-mobile">⌘ K</span>
      </label>
      <div className="top-actions">
        <div style={{ position: "relative" }}>
          <button className="btn" aria-haspopup="menu" onClick={() => setMenu((m) => !m)}><Plus /> <span className="hide-mobile">New</span> <ChevronDown size={12} /></button>
          {menu && (
            <div className="menu" style={{ position: "absolute", top: "110%", right: 0 }}>
              <button onClick={() => p.newFolder(folder)}><FolderPlus /> New Folder</button>
              <button onClick={() => p.openDialog({ kind: "upload", parentId: folder })}><Upload /> Upload File</button>
              <button onClick={() => p.openDialog({ kind: "upload", parentId: folder })}><FolderUp /> Upload Folder</button>
              <hr />
              <button onClick={() => p.toast("Document editor coming with the backend")}><FileText /> New Document</button>
              <button onClick={() => p.toast("Text editor coming with the backend")}><FilePlus2 /> New Text File</button>
            </div>
          )}
        </div>
        <button className="btn primary" onClick={() => p.openDialog({ kind: "upload", parentId: folder })}><UploadCloud /> <span className="hide-mobile">Upload</span></button>
        <button className="icon-btn" aria-label="Notifications" onClick={() => p.toast("Sarah Lin shared project-report.pdf with you")}><Bell /><span className="ping" /></button>
        <button className="icon-btn hide-mobile" aria-label="Keyboard shortcuts" onClick={() => p.toast("⌘K search · Esc close · Double-click to open")}><Keyboard /></button>
        <Link to="/settings" className="avatar" style={{ width: 28, height: 28, borderRadius: 7, textDecoration: "none" }} aria-label="Profile"><User size={14} /></Link>
      </div>
    </header>
  );
}

function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [...nav.slice(0, 4), { to: "/settings", label: "Settings", icon: Settings }];
  return (
    <nav className="mobile-nav" aria-label="Mobile">
      {items.map((n) => (
        <Link key={n.to} to={n.to} className={(n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)) ? "active" : ""}><n.icon />{n.label}</Link>
      ))}
    </nav>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const p = usePacket();
  const uploading = p.uploads.filter((u) => u.status === "uploading");
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        <main className="content">{children}</main>
        <footer className="statusbar">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span className="dot" /> Background sync worker: {uploading.length ? `Uploading ${uploading.length}` : "Idle"} · Endpoint: <code>{storage.endpoint}</code></span>
          <span>CLI Access: <code>`packet sync --watch`</code> · API {storage.apiVersion}</span>
        </footer>
      </div>
      <MobileNav />
      {uploading.length > 0 && !p.dialog && (
        <div className="upload-dock">
          <button className="toast" style={{ border: 0 }} onClick={() => p.openDialog({ kind: "upload", parentId: null })}>
            <UploadCloud /> Uploading {uploading.length} file{uploading.length > 1 ? "s" : ""} · {Math.round(uploading.reduce((s, u) => s + u.progress, 0) / uploading.length)}%
          </button>
        </div>
      )}
      <GlobalDialogs />
      <FilePreview />
    </div>
  );
}
