import { createFileRoute } from "@tanstack/react-router";
import { FolderView } from "@/components/packet/folder-view";

export const Route = createFileRoute("/files/$")({
  head: () => ({
    meta: [
      { title: "Folder — Packet" },
      { name: "description", content: "Folder contents in your Packet workspace." },
      { property: "og:title", content: "Folder — Packet" },
      { property: "og:description", content: "Folder contents in your Packet workspace." },
    ],
  }),
  component: FolderRoute,
});

function FolderRoute() {
  const { _splat } = Route.useParams();
  const id = (_splat ?? "").split("/").filter(Boolean).pop() ?? null;
  return <FolderView folderId={id} />;
}
