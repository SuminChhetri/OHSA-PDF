"use client";

import { useState, useEffect, useRef } from "react";

export function usePdfViewer() {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const currentBlobUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
    };
  }, []);

  function fetchPdf(url: string) {
    if (currentBlobUrl.current) {
      URL.revokeObjectURL(currentBlobUrl.current);
      currentBlobUrl.current = null;
    }
    setBlobUrl(null);
    setLoading(true);

    let alive = true;
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        if (!alive) return;
        const next = URL.createObjectURL(blob);
        currentBlobUrl.current = next;
        setBlobUrl(next);
      })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }

  function close() {
    if (currentBlobUrl.current) {
      URL.revokeObjectURL(currentBlobUrl.current);
      currentBlobUrl.current = null;
    }
    setBlobUrl(null);
    setLoading(false);
  }

  return { blobUrl, loading, fetchPdf, close };
}
