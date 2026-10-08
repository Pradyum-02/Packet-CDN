import { createFileRoute } from "@tanstack/react-router";
import { storage } from "@/lib/packet/data";
import { formatRelative, formatSize } from "@/lib/packet/format";
import { usePacket } from "@/lib/packet/store";
import { FileIcon, PageHeader } from "@/components/packet/common";
import { usedBytes } from "@/components/packet/layout";

export const Route = createFileRoute("/storage")({
  head: () => ({
    meta: [
      { title: "Storage — Packet" },
      { name: "description", content: "See how your Packet storage is used and free up space." },
      { property: "og:title", content: "Storage — Packet" },
      { property: "og:description", content: "Storage usage breakdown, largest files and recent changes." },
    ],
  }),
  component: Storage,
});

function Storage() {
  const p = usePacket();
  const used = usedBytes();
  const largest = p.items.filter((i) => i.kind !== "folder" && !i.trashed).sort((a, b) => b.size - a.size).slice(0, 6);
  const max = largest[0]?.size ?? 1;
  const stats = [
    { l: "Total", v: formatSize(storage.totalBytes) },
    { l: "Used", v: formatSize(used) },
    { l: "Available", v: formatSize(storage.totalBytes - used) },
  ];
  return (
    <>
      <PageHeader eyebrow={<b>{storage.tier}</b>} title="Storage" sub="Understand what's taking up space." actions={<button className="btn primary" onClick={() => p.toast("Upgrades will be available once billing is connected")}>Upgrade plan</button>} />
      <div className="grid-4 section" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
        {stats.map((s) => <div key={s.l} className="card panel"><div className="eyebrow">{s.l}</div><div className="h1" style={{ fontSize: 24 }}>{s.v}</div></div>)}
      </div>
      <section className="card panel section">
        <h2 className="h2">Breakdown</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {storage.categories.map((c) => (
            <div key={c.key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>{c.label}</span><span className="num">{formatSize(c.bytes)} · {((c.bytes / storage.totalBytes) * 100).toFixed(1)}%</span></div>
              <div className="bar"><span className={`seg-${c.tone}`} style={{ width: `${(c.bytes / storage.totalBytes) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </section>
      <div className="section" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <section className="card panel">
          <h2 className="h2">Largest files</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {largest.map((f) => (
              <button key={f.id} onClick={() => p.setPreview(f.id)} style={{ background: "none", border: 0, textAlign: "left", display: "flex", gap: 10, alignItems: "center", padding: 0 }}>
                <FileIcon kind={f.kind} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><b style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</b><span className="num">{formatSize(f.size)}</span></div>
                  <div className="bar" style={{ height: 3 }}><span style={{ width: `${(f.size / max) * 100}%` }} /></div>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="card panel">
          <h2 className="h2">Recent storage changes</h2>
          <div style={{ marginTop: 6 }}>
            {storage.changes.map((c) => (
              <div key={c.id} className="set-row" style={{ padding: "10px 0" }}>
                <div><h5 style={{ fontWeight: 500 }}>{c.label}</h5><p>{formatRelative(c.when)}</p></div>
                <span className="num" style={{ color: c.delta > 0 ? "var(--foreground)" : "var(--success)" }}>{c.delta > 0 ? "+" : "−"}{formatSize(Math.abs(c.delta))}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
