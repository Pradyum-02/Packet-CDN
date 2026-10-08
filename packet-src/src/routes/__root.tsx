import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, HeadContent, Scripts, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PacketProvider } from "@/lib/packet/store";
import { AppLayout } from "@/components/packet/layout";

function NotFoundComponent() {
  return (
    <div className="empty" style={{ minHeight: "60vh", justifyContent: "center" }}>
      <h4 style={{ fontSize: 40 }}>404</h4>
      <p>This path doesn't exist in your workspace.</p>
      <Link to="/" className="btn primary" style={{ marginTop: 12, textDecoration: "none" }}>Go home</Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="empty" style={{ minHeight: "60vh", justifyContent: "center" }}>
      <h4>This page didn't load</h4>
      <p>Something went wrong. Try again or head back home.</p>
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn primary" onClick={() => { router.invalidate(); reset(); }}>Try again</button>
        <a href="/" className="btn" style={{ textDecoration: "none" }}>Go home</a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Packet — Cloud file storage" },
      { name: "description", content: "Packet is a fast, developer-grade cloud storage workspace for your files and folders." },
      { property: "og:title", content: "Packet — Cloud file storage" },
      { property: "og:description", content: "Packet is a fast, developer-grade cloud storage workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <PacketProvider>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </PacketProvider>
    </QueryClientProvider>
  );
}
