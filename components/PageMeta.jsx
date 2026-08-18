import Head from 'next/head';

/**
 * Per-page metadata. Site-wide defaults (viewport, favicon, theme colour) live
 * in `pages/_app.jsx` and apply to every route; this component adds what only
 * the page itself knows — its title, its description, and the canonical URL
 * search engines and social cards should use.
 *
 * Next.js de-duplicates <Head> tags by `key`, so a page that renders PageMeta
 * overrides the defaults rather than appending a second copy.
 */

export const SITE_NAME = 'E-Vive Kenya';
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://e-vive.vercel.app').replace(/\/$/, '');

export default function PageMeta({
  title,
  description,
  path = '/',
  image = '/images/hero-hca-elder.png',
  noindex = false,
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const url = `${SITE_URL}${path}`;
  const imageUrl = image?.startsWith('http') ? image : `${SITE_URL}${image}`;

  return (
    <Head>
      <title key="title">{fullTitle}</title>
      {description && <meta key="desc" name="description" content={description} />}
      <link key="canonical" rel="canonical" href={url} />
      {noindex && <meta key="robots" name="robots" content="noindex,nofollow" />}

      <meta key="og:title" property="og:title" content={fullTitle} />
      {description && <meta key="og:desc" property="og:description" content={description} />}
      <meta key="og:url" property="og:url" content={url} />
      <meta key="og:image" property="og:image" content={imageUrl} />

      <meta key="tw:card" name="twitter:card" content="summary_large_image" />
      <meta key="tw:title" name="twitter:title" content={fullTitle} />
      {description && <meta key="tw:desc" name="twitter:description" content={description} />}
      <meta key="tw:image" name="twitter:image" content={imageUrl} />
    </Head>
  );
}
