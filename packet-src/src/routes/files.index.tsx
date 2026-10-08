import { createFileRoute } from "@tanstack/react-router";
import { FolderView } from "@/components/packet/folder-view";

export const Route = createFileRoute("/files/")({
  head: () => ({
    meta: [
      { title: "My Files — Packet" },
      { name: "description", content: "Browse, organize and manage all your files and folders in Packet." },
      { property: "og:title", content: "My Files — Packet" },
      { property: "og:description", content: "Browse and manage all your files and folders." },
    ],
  }),
  component: () => <FolderView folderId={null} />,
});
