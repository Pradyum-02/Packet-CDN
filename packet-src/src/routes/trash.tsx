import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Trash2, X } from "lucide-react";
import { usePacket } from "@/lib/packet/store";
import { EmptyState, PageHeader } from "@/components/packet/common";
import { FileTable } from "@/components/packet/file-table";

export const Route = createFileRoute("/trash")({
  head: () => ({
    meta: [
      { title: "Trash — Packet" },
      { name: "description", content: "Restore or permanently delete removed files in Packet." },
      { property: "og:title", content: "Trash — Packet" },
      { property: "og:description", content: "Restore or permanently delete removed files." },
    ],
  }),
  component: Trash,
});

function Trash() {
  const p = usePacket();
  const items = p.items.filter((i) => i.trashed);
  const purge = (id: string, name: string) => p.openDialog({ kind: "confirm", title: `Delete “${name}” forever?`, body: "This can't be undone.", confirm: "Delete Permanently", danger: true, onConfirm: () => { p.dispatch({ type: "purge", ids: [id] }); p.toast("Permanently deleted"); } });
  return (
    <>
      <PageHeader eyebrow={<b>Retention · 30 days</b>} title="Trash" sub="Items are permanently removed 30 days after deletion."
        actions={items.length > 0 && <button className="btn danger" onClick={() => p.openDialog({ kind: "confirm", title: "Empty trash?", body: `All ${items.length} items will be permanently deleted. This can't be undone.`, confirm: "Empty Trash", danger: true, onConfirm: () => { p.dispatch({ type: "emptyTrash" }); p.toast("Trash emptied"); } })}><Trash2 /> Empty Trash</button>} />
      <div className="section">
        <FileTable items={items} columns={["location", "size", "modified"]}
          empty={<EmptyState icon={<Trash2 />} title="Trash is empty" body="Deleted files show up here." />}
          actions={(it) => (
            <>
              <button className="icon-btn" aria-label={`Restore ${it.name}`} title="Restore" onClick={() => { p.dispatch({ type: "restore", ids: [it.id] }); p.toast(`Restored ${it.name}`, "ok"); }}><RotateCcw /></button>
              <button className="icon-btn" aria-label={`Delete ${it.name} permanently`} title="Delete permanently" onClick={() => purge(it.id, it.name)}><X /></button>
            </>
          )} />
      </div>
    </>
  );
}
