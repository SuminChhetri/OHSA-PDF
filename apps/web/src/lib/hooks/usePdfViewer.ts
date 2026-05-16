"use client";

import { useState, useEffect, useRef } from "react";

export function usePdfViewer() {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentBlobUrl = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (currentBlobUrl.current) URL.revokeObjectURL(currentBlobUrl.current);
    };
  }, []);

  function fetchPdf(url: string) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (currentBlobUrl.current) {
      URL.revokeObjectURL(currentBlobUrl.current);
      currentBlobUrl.current = null;
    }
    setBlobUrl(null);
    setError(null);
    setLoading(true);

    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.blob();
      })
      .then((blob) => {
        const next = URL.createObjectURL(blob);
        currentBlobUrl.current = next;
        setBlobUrl(next);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message ?? "Failed to load PDF");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }

  function close() {
    abortRef.current?.abort();
    if (currentBlobUrl.current) {
      URL.revokeObjectURL(currentBlobUrl.current);
      currentBlobUrl.current = null;
    }
    setBlobUrl(null);
    setLoading(false);
    setError(null);
  }

  return { blobUrl, loading, error, fetchPdf, close };
}
