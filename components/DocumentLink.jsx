import { useState, useEffect } from 'react';
import { documentUrl } from '../lib/store';

/**
 * Rendering an uploaded document, wherever it happens to live.
 *
 * Certificates and photos exist in two shapes now: older records carry the file
 * inline as `fileDataUrl`, newer ones carry a `filePath` into private object
 * storage. Callers should not have to care which, so both helpers here take the
 * document and hand back something an `<img>` or an `<a>` can use.
 *
 * Stored files resolve to a signed URL that expires in five minutes, minted
 * only after the API route has checked who is asking — so these URLs are not
 * something to cache, log or paste into a ticket.
 */

/** Resolves a document to a usable URL. Returns null while it is still working. */
export function useDocumentUrl(doc) {
  const [url, setUrl] = useState(doc?.fileDataUrl || doc?.previewUrl || null);

  useEffect(() => {
    let cancelled = false;
    const inline = doc?.fileDataUrl || doc?.previewUrl || null;
    if (inline) { setUrl(inline); return undefined; }
    if (!doc?.filePath) { setUrl(null); return undefined; }

    setUrl(null);
    documentUrl(doc.filePath).then(signed => { if (!cancelled) setUrl(signed); });
    return () => { cancelled = true; };
  }, [doc?.fileDataUrl, doc?.previewUrl, doc?.filePath]);

  return url;
}

/**
 * A link that opens a document in a new tab.
 *
 * For stored files the signed URL is fetched when the link is clicked rather
 * than when the list renders — a page listing twenty certificates should not
 * mint twenty short-lived credentials for documents nobody opens.
 */
export function DocumentLink({ doc, children, style }) {
  const [busy, setBusy] = useState(false);
  const inline = doc?.fileDataUrl || null;

  if (!inline && !doc?.filePath) return null;

  if (inline) {
    return (
      <a href={inline} target="_blank" rel="noreferrer" download={doc.fileName || undefined} style={style}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const url = await documentUrl(doc.filePath);
        setBusy(false);
        if (url) window.open(url, '_blank', 'noopener');
        else alert('That document could not be opened. It may have been removed.');
      }}
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', ...style }}
    >
      {busy ? 'Opening…' : children}
    </button>
  );
}

/** An `<img>` for a document, inline or stored. */
export function DocumentImage({ doc, alt, style, className }) {
  const url = useDocumentUrl(doc);
  if (!url) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt || ''} style={style} className={className} />;
}
