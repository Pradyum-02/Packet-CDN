import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useState } from "react";
import { usePacket } from "@/lib/packet/store";
import { EmptyState, PageHeader } from "@/components/packet/common";
import { FileTable, SelectionBar } from "@/components/packet/file-table";

export const Route = createFileRoute("/starred")({
  head: () => ({
    meta: [
      { title: "Starred — Packet" },
      { name: "description", content: "Your starred files and folders in Packet." },
      { property: "og:title", content: "Starred — Packet" },
      { property: "og:description", content: "Your starred files and folders." },
    ],
  }),
  component: Starred,
});

function Starred() {
  const p = usePacket();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const items = p.items.filter((i) => i.starred && !i.trashed);
  return (
    <>
      <PageHeader eyebrow={<b>Collections</b>} title="Starred" sub="Quick access to the files and folders you care about most." />
      <div className="section">
        <SelectionBar ids={[...sel]} onClear={() => setSel(new Set())} />
        <FileTable items={items} columns={["kind", "location", "size", "modified"]} selected={sel} onSelect={setSel}
          empty={<EmptyState icon={<Star />} title="No starred items" body="Star files from any table to pin them here." />} />
      </div>
    </>
  );
}
