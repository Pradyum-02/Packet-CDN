import { Link } from "@tanstack/react-router";
import { ArrowRight, PieChart, Sparkles } from "lucide-react";
import { storage } from "@/lib/packet/data";
import { formatSize } from "@/lib/packet/format";
import { usePacket } from "@/lib/packet/store";
import { usedBytes } from "./layout";

export function StorageOverview() {
  const p = usePacket();
  const used = usedBytes();
  const pct = (used / storage.totalBytes) * 100;
  return (
    <section className="card panel" style={{ padding: 18 }} aria-label="Storage allocation">
      <div className="section-head" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="ficon" style={{ width: 34, height: 34 }}><PieChart /></span>
          <div>
            <div className="h2" style={{ fontSize: 16 }}>Storage Allocation <span className="chip mono">{pct.toFixed(1)}% Quota</span></div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{storage.tier} · {formatSize(used)} used of {formatSize(storage.totalBytes)} (<span style={{ color: "var(--success)" }}>{formatSize(storage.totalBytes - used)}</span> available)</div>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn" onClick={() => p.toast("Cleanup rules: auto-delete trash after 30 days is on")}><Sparkles /> Cleanup Rules</button>
          <Link to="/storage" className="btn primary" style={{ textDecoration: "none" }}>Manage Storage <ArrowRight /></Link>
        </div>
      </div>
      <div className="seg-bar" role="img" aria-label={`${pct.toFixed(1)}% used`}>
        {storage.categories.map((c) => <span key={c.key} className={`seg-${c.tone}`} style={{ width: `${(c.bytes / storage.totalBytes) * 100}%` }} />)}
      </div>
      <div className="legend">
        {storage.categories.map((c) => (
          <div key={c.key}><i className={`seg-${c.tone}`} /><span>{c.label}<b>{formatSize(c.bytes)}</b></span></div>
        ))}
      </div>
    </section>
  );
}
