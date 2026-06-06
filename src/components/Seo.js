import React from 'react';
import { Helmet } from 'react-helmet-async';

// Centralized SEO helper for per-page meta tags.
// Renders title, description, canonical, Open Graph, Twitter card and any
// JSON-LD structured data via react-helmet-async (already wired in App.js
// through <HelmetProvider>). Keeps every public page's <head> consistent and
// gives Google/AI answer-engines unique, crawlable signals per route.

export const SITE_URL = 'https://ieltscomputertest.com';
export const SITE_NAME = 'ieltscomputertest.com';
export const DEFAULT_IMAGE = `${SITE_URL}/img/logo-ielts.png`;
export const DEFAULT_TITLE =
  'IELTS Computer Test – Practice IELTS Online Free | ieltscomputertest.com';
export const DEFAULT_DESCRIPTION =
  'Take the IELTS computer test online with a 100% real exam interface. Practice IELTS Listening, Reading, Writing and Speaking with up-to-date forecast tests. Improve your IELTS score effectively.';

/**
 * @param {string}  [title]        Page title (falls back to the site default).
 * @param {string}  [description]  Meta description.
 * @param {string}  [path]         Path portion of the canonical URL, e.g. "/about".
 * @param {string}  [image]        Absolute OG/Twitter image URL.
 * @param {string}  [type]         Open Graph type ("website" | "article" ...).
 * @param {boolean} [noindex]      When true, emit robots noindex.
 * @param {object|object[]} [jsonLd] One or more schema.org JSON-LD objects.
 */
export default function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  jsonLd = null,
}) {
  const fullTitle = title || DEFAULT_TITLE;
  const canonical = `${SITE_URL}${path}`;
  const schemas = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD structured data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
