import { createFileRoute } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";
import { z } from "zod";
import { kindLabel } from "@/lib/packet/format";
import { usePacket } from "@/lib/packet/store";
import { EmptyState, PageHeader } from "@/components/packet/common";
import { FileTable } from "@/components/packet/file-table";

export const Route = createFileRoute("/search")({
  validateSearch: (s) => z.object({ q: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Search — Packet" },
      { name: "description", content: "Search files, folders, file types and tags across Packet." },
      { property: "og:title", content: "Search — Packet" },
      { property: "og:description", content: "Search across your Packet workspace." },
    ],
  }),
  component: Search,
});

function Search() {
  const { q = "" } = Route.useSearch();
  const p = usePacket();
  const term = q.trim().toLowerCase().replace(/^#/, "");
  const results = term
    ? p.items.filter((i) => !i.trashed && (i.name.toLowerCase().includes(term) || kindLabel[i.kind].toLowerCase().includes(term) || i.kind.includes(term) || i.tags.some((t) => t.includes(term))))
    : [];
  return (
    <>
      <PageHeader eyebrow={<b>Search</b>} title={term ? `Results for “${q}”` : "Search"} sub={term ? `${results.length} match${results.length === 1 ? "" : "es"} by name, type, folder or tag` : "Type in the search bar above — try “pdf”, “#finance” or “recallx”."} />
      <div className="section">
        {term && <FileTable items={results} columns={["kind", "location", "modified", "owner"]} empty={<EmptyState icon={<SearchIcon />} title="No results" body="Try another name, file type or tag." />} />}
      </div>
    </>
  );
}
