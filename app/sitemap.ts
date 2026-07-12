import type { MetadataRoute } from "next";

const BASE = "https://www.mastograd.eu";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/products`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/products/alphabet`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/products/numbers`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/products/bundle`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
