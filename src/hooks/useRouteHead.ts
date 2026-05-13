import { useEffect } from "react";

interface RouteHeadOptions {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
}

const SITE_ORIGIN = "https://vision-flow-trainer.lovable.app";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useRouteHead({ title, description, canonicalPath, robots }: RouteHeadOptions) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", `${SITE_ORIGIN}${canonicalPath}`);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertCanonical(`${SITE_ORIGIN}${canonicalPath}`);

    if (robots) {
      upsertMeta("name", "robots", robots);
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonicalPath, robots]);
}
