import { createFileRoute } from "@tanstack/react-router";
import { Bell, HardDrive, Monitor, Palette, Shield, User } from "lucide-react";
import { useState } from "react";
import { storage } from "@/lib/packet/data";
import { formatSize } from "@/lib/packet/format";
import { usePacket } from "@/lib/packet/store";
import { PageHeader, Switch } from "@/components/packet/common";
import { usedBytes } from "@/components/packet/layout";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Packet" },
      { name: "description", content: "Manage your Packet profile, security, notifications and appearance." },
      { property: "og:title", content: "Settings — Packet" },
      { property: "og:description", content: "Profile, security, notifications and appearance settings." },
    ],
  }),
  component: Settings,
});

const sections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "account", label: "Account", icon: Monitor },
  { id: "storage", label: "Storage", icon: HardDrive },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
] as const;

function Settings() {
  const p = usePacket();
  const s = p.settings;
  const [tab, setTab] = useState<(typeof sections)[number]["id"]>("profile");
  const [name, setName] = useState(s.name);
  const [email, setEmail] = useState(s.email);
  const Row = ({ t, d, children }: { t: string; d: string; children: React.ReactNode }) => <div className="set-row"><div><h5>{t}</h5><p>{d}</p></div>{children}</div>;
  return (
    <>
      <PageHeader eyebrow={<b>Preferences</b>} title="Settings" sub="Saved locally for now — synced once accounts go live." />
      <div className="settings">
        <nav aria-label="Settings sections">
          {sections.map((x) => <button key={x.id} className={`nav-link ${tab === x.id ? "active" : ""}`} style={{ background: tab === x.id ? undefined : "transparent", fontSize: 13 }} onClick={() => setTab(x.id)}><x.icon /> {x.label}</button>)}
        </nav>
        <div className="card panel">
          {tab === "profile" && (
            <form onSubmit={(e) => { e.preventDefault(); p.updateSettings({ name: name.trim() || s.name, email }); p.toast("Profile saved", "ok"); }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}><span className="avatar square lg">{s.name[0]}</span><button type="button" className="btn" onClick={() => p.toast("Avatar upload arrives with the backend")}>Change avatar</button></div>
              <div className="field"><label htmlFor="n">Name</label><input id="n" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="field"><label htmlFor="e">Email</label><input id="e" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <button className="btn primary">Save changes</button>
            </form>
          )}
          {tab === "account" && (
            <>
              <Row t="Plan" d={`${storage.plan} · ${storage.tier}`}><button className="btn" onClick={() => p.toast("Billing coming soon")}>Upgrade</button></Row>
              <Row t="Export data" d="Download an archive of all your files."><button className="btn" onClick={() => p.toast("Export queued")}>Export</button></Row>
              <Row t="Delete account" d="Permanently remove your account and files."><button className="btn danger" onClick={() => p.openDialog({ kind: "confirm", title: "Delete account?", body: "This is a demo — nothing will be deleted.", confirm: "Delete", danger: true, onConfirm: () => p.toast("Demo only") })}>Delete</button></Row>
            </>
          )}
          {tab === "storage" && (
            <>
              <Row t="Usage" d={`${formatSize(usedBytes())} of ${formatSize(storage.totalBytes)} used`}><span className="chip mono">{Math.round((usedBytes() / storage.totalBytes) * 100)}%</span></Row>
              <Row t="Auto-empty trash" d="Remove trashed files after 30 days."><Switch label="Auto-empty trash" checked onChange={() => p.toast("Required on the free plan")} /></Row>
            </>
          )}
          {tab === "security" && (
            <>
              <Row t="Password" d="Last changed 3 months ago."><button className="btn" onClick={() => p.openDialog({ kind: "prompt", title: "Change password", label: "New password", initial: "", confirm: "Update", onSubmit: () => p.toast("Password updated", "ok") })}>Change</button></Row>
              <Row t="Two-factor authentication" d={s.twoFactor ? "Enabled via authenticator app." : "Add an extra layer of security."}><Switch label="Two-factor" checked={s.twoFactor} onChange={(v) => { p.updateSettings({ twoFactor: v }); p.toast(v ? "2FA enabled" : "2FA disabled", "ok"); }} /></Row>
              <div className="eyebrow" style={{ marginTop: 16 }}>Active sessions</div>
              {([["Chrome · Windows", "Pune, IN · current"], ["Packet CLI v2.4", "s3.us-east-1 · 2h ago"], ["Safari · iPhone", "Mumbai, IN · yesterday"]] as const).map(([a, b], i) => (
                <Row key={a} t={a} d={b}>{i === 0 ? <span className="chip primary">This device</span> : <button className="btn sm" onClick={() => p.toast(`Signed out ${a}`)}>Revoke</button>}</Row>
              ))}
            </>
          )}
          {tab === "notifications" && (
            <>
              <Row t="File sharing" d="When someone shares a file with you."><Switch label="File sharing" checked={s.notifyShare} onChange={(v) => p.updateSettings({ notifyShare: v })} /></Row>
              <Row t="Uploads" d="When uploads finish or fail."><Switch label="Uploads" checked={s.notifyUpload} onChange={(v) => p.updateSettings({ notifyUpload: v })} /></Row>
              <Row t="Storage warnings" d="When you pass 80% and 95% of your quota."><Switch label="Storage warnings" checked={s.notifyStorage} onChange={(v) => p.updateSettings({ notifyStorage: v })} /></Row>
            </>
          )}
          {tab === "appearance" && (
            <>
              <Row t="Theme" d="Packet is designed dark-first."><select className="select" value={s.theme} onChange={(e) => p.updateSettings({ theme: e.target.value as "dark" })}><option value="dark">Dark</option><option value="midnight">Midnight</option></select></Row>
              <Row t="Compact mode" d="Tighter rows in file tables."><Switch label="Compact mode" checked={s.compact} onChange={(v) => p.updateSettings({ compact: v })} /></Row>
              <Row t="Collapsed sidebar" d="Show icons only in the sidebar."><Switch label="Collapsed sidebar" checked={p.sidebarCollapsed} onChange={(v) => p.setSidebarCollapsed(v)} /></Row>
            </>
          )}
        </div>
      </div>
    </>
  );
}
