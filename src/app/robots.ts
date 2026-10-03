import type { MetadataRoute } from "next";

const SITE = "https://www.sniffertrek.com";

const privatePaths = [
  "/admin/",
  "/auth/",
  "/konto",
  "/login",
  "/planer",
  "/v2",
  "/v3",
  "/legacy-home",
  "/expedia-shop-curator",
  "/geschichten",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          ...privatePaths,
          ...privatePaths.flatMap((p) => [`/en${p}`, `/es${p}`]),
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
