import Head from 'next/head';
import { SITE_NAME } from '../components/PageMeta';

/**
 * Site-wide document head. The viewport tag in particular belongs here rather
 * than in _document.js — without it a phone lays every page out at desktop
 * width and zooms out, which is what used to happen on eight of the ten public
 * pages. Individual pages override title/description via <PageMeta>.
 */
export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#004A99" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_KE" />
        <title key="title">{SITE_NAME}</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
