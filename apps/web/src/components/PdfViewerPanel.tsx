interface PdfViewerPanelProps {
  title: string;
  blobUrl: string | null;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  downloadUrl?: string;
  redactedDownloadUrl?: string;
  /** Extra actions rendered after the download buttons */
  extraActions?: React.ReactNode;
}

const DownloadIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const RedactedIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

export function PdfViewerPanel({
  title,
  blobUrl,
  loading,
  error,
  onClose,
  downloadUrl,
  redactedDownloadUrl,
  extraActions,
}: PdfViewerPanelProps) {
  if (!loading && !blobUrl && !error) return null;

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-slate-50">
        <div>
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
          <span className="ml-2 text-xs text-slate-400">scroll to review</span>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {extraActions}
          {downloadUrl && (
            <a
              href={downloadUrl}
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <DownloadIcon />
              Download Normal
            </a>
          )}
          {redactedDownloadUrl && (
            <a
              href={redactedDownloadUrl}
              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors"
            >
              <RedactedIcon />
              Download Redacted
            </a>
          )}
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white w-7 h-7 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            title="Close viewer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center bg-slate-50" style={{ height: "80vh" }}>
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto" />
            <p className="text-sm text-slate-500">Loading PDF…</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center bg-slate-50" style={{ height: "20vh" }}>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : blobUrl ? (
        <iframe
          src={blobUrl}
          className="w-full border-0"
          style={{ height: "80vh" }}
          title={title}
        />
      ) : null}
    </div>
  );
}
