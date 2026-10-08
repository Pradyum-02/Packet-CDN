import { createFileRoute } from "@tanstack/react-router";
import { Share2 } from "lucide-react";
import { currentUserId } from "@/lib/packet/data";
import { usePacket } from "@/lib/packet/store";
import { EmptyState, PageHeader } from "@/components/packet/common";
import { FileTable } from "@/components/packet/file-table";

export const Route = createFileRoute("/shared")({
  head: () => ({
    meta: [
      { title: "Shared — Packet" },
      { name: "description", content: "Files shared with you and files you've shared in Packet." },
      { property: "og:title", content: "Shared — Packet" },
      { property: "og:description", content: "Files shared with you and by you." },
    ],
  }),
  component: Shared,
});

function Shared() {
  const p = usePacket();
  const live = p.items.filter((i) => !i.trashed);
  const withMe = live.filter((i) => i.sharedWithMe);
  const byMe = live.filter((i) => i.shared && i.owner === currentUserId);
  const empty = <EmptyState icon={<Share2 />} title="Nothing shared yet" body="Use Share on any file to collaborate." />;
  return (
    <>
      <PageHeader eyebrow={<b>Collaboration</b>} title="Shared" sub="Everything moving between you and your team." />
      <section className="section"><div className="section-head"><h2 className="h2">Shared With Me <span className="chip mono">{withMe.length}</span></h2></div><FileTable items={withMe} columns={["owner", "permission", "modified"]} empty={empty} /></section>
      <section className="section"><div className="section-head"><h2 className="h2">Shared By Me <span className="chip mono">{byMe.length}</span></h2></div><FileTable items={byMe} columns={["owner", "permission", "modified"]} empty={empty} /></section>
    </>
  );
}
