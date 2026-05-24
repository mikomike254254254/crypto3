import {
  buildWallexJsonLd,
  LOGO_IMAGE,
  OG_IMAGE,
  SEO_DESCRIPTION,
  SEO_KEYWORDS,
  SEO_SUBTITLE,
  SEO_TITLE,
  SITE_NAME,
  SITE_URL,
} from "../constants/seo";

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setLink(rel: string, href: string, extra?: Record<string, string>) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      el.setAttribute(key, value);
    }
  }
}

function setJsonLd() {
  let el = document.querySelector('script[type="application/ld+json"]');
  if (!el) {
    el = document.createElement("script");
    el.setAttribute("type", "application/ld+json");
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(buildWallexJsonLd());
}

/** Ensures SPA navigations keep strong defaults for search/social previews */
export function applyWallexSeo() {
  document.title = SEO_TITLE;
  setMeta("description", SEO_DESCRIPTION);
  setMeta("keywords", SEO_KEYWORDS);
  setMeta("og:type", "website", true);
  setMeta("og:url", SITE_URL, true);
  setMeta("og:site_name", SITE_NAME, true);
  setMeta("og:title", SEO_TITLE, true);
  setMeta("og:description", SEO_SUBTITLE, true);
  setMeta("og:image", OG_IMAGE, true);
  setMeta("og:image:width", "512", true);
  setMeta("og:image:height", "512", true);
  setMeta("og:image:alt", "Wallex crypto wallet logo", true);
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", SEO_TITLE);
  setMeta("twitter:description", SEO_DESCRIPTION);
  setMeta("twitter:image", OG_IMAGE);
  setLink("canonical", `${SITE_URL}/`);
  setLink("icon", "/logo.png", { type: "image/png" });
  setLink("apple-touch-icon", "/logo.png");
  setJsonLd();
}
