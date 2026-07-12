import type { MetadataRoute } from "next";

// Everything public is welcome to crawl — including AI assistants' crawlers
// (they're covered by `*`; we deliberately do NOT block them, since agents
// recommending gifts is a discovery channel). Only the order/preview API and
// the internal print-rendering route are kept out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/print"] }],
    sitemap: "https://www.mastograd.eu/sitemap.xml",
  };
}
