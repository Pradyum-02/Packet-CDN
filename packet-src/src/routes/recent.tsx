import { createFileRoute } from "@tanstack/react-router";
import { usePacket } from "@/lib/packet/store";
import { PageHeader } from "@/components/packet/common";
import { FileTable } from "@/components/packet/file-table";

export const Route = createFileRoute("/recent")({
  head: () => ({
    meta: [
      { title: "Recent — Packet" },
      { name: "description", content: "Files you recently opened or modified in Packet." },
      { property: "og:title", content: "Recent — Packet" },
      { property: "og:description", content: "Recently opened and modified files." },
    ],
  }),
  component: Recent,
});

function Recent() {
  const p = usePacket();
  const files = p.items.filter((i) => !i.trashed && i.kind !== "folder");
  const opened = files.filter((i) => i.opened).sort((a, b) => b.opened!.localeCompare(a.opened!)).slice(0, 8);
  const modified = [...files].sort((a, b) => b.modified.localeCompare(a.modified)).slice(0, 8);
  return (
    <>
      <PageHeader eyebrow={<b>Activity</b>} title="Recent" sub="Pick up where you left off." />
      <section className="section"><div className="section-head"><h2 className="h2">Recently opened</h2></div><FileTable items={opened} columns={["location", "size", "modified", "owner"]} /></section>
      <section className="section"><div className="section-head"><h2 className="h2">Recently modified</h2></div><FileTable items={modified} columns={["location", "size", "modified", "owner"]} /></section>
    </>
  );
}
