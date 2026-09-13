import { useMemo, useRef, useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  FileText,
  Info,
  Trash2,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiClient } from "../services/api";
import {
  clearUploadHistory,
  formatFileSize,
  inspectFile,
  loadUploadHistory,
  MAX_FILES,
  saveUploadHistory,
  type FileKind,
  type FileStatus,
  type PreviewData,
  type SpreadsheetPreview,
  type UploadFile,
  type UploadHistoryItem,
} from "../services/ingestion";

const ACCEPTED_FORMATS = ".csv,.xlsx,.xls,.pdf";

const statusLabels: Record<FileStatus, string> = {
  processing: "Processing",
  valid: "Valid",
  warning: "Warning",
  error: "Error",
};

function FileKindIcon({ kind }: { kind: FileKind }) {
  if (kind === "PDF") return <FileText className="text-rose-500" size={22} />;
  if (kind === "UNKNOWN") return <FileText className="text-secondary" size={22} />;
  return <FileSpreadsheet className="text-emerald-500" size={22} />;
}

function StatusBadge({ status }: { status: FileStatus }) {
  const styles: Record<FileStatus, string> = {
    processing: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    valid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  };
  const icons: Record<FileStatus, typeof Check> = {
    processing: Clock3,
    valid: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
  };
  const Icon = icons[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${styles[status]}`}>
      <Icon size={13} aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}

function PreviewPanel({ preview, filename, size }: { preview: PreviewData | undefined; filename: string; size: number }) {
  if (!preview) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-border bg-surface/30 p-6 text-center text-sm text-secondary">
        Select a file to inspect its preview.
      </div>
    );
  }

  if (preview.type === "pdf") {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-border bg-surface/30 p-8 text-center">
        <FileText className="mb-3 text-rose-500" size={34} />
        <h3 className="font-bold text-primary">PDF accepted</h3>
        <p className="mt-1 text-sm text-secondary">{filename} · {formatFileSize(size)}</p>
        <p className="mt-4 max-w-md text-sm text-secondary">
          {preview.pageCount ? `${preview.pageCount} pages detected. ` : "Page count will be determined by the server. "}
          PDF extraction will be handled by the AI extraction pipeline in Phase 2.
        </p>
      </div>
    );
  }

  return <SpreadsheetPreviewTable preview={preview} />;
}

function SpreadsheetPreviewTable({ preview }: { preview: SpreadsheetPreview }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-lg border border-border bg-surface/60 px-3 py-2 text-secondary">
          Sheet <strong className="text-primary">{preview.sheetName || "Unnamed"}</strong>
        </span>
        <span className="rounded-lg border border-border bg-surface/60 px-3 py-2 text-secondary">
          Rows <strong className="text-primary">{preview.rowCount}</strong>
        </span>
        <span className="rounded-lg border border-border bg-surface/60 px-3 py-2 text-secondary">
          Columns <strong className="text-primary">{preview.columns.filter(Boolean).length}</strong>
        </span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        {preview.rows.length > 0 ? (
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-surface-secondary/70 text-xs uppercase tracking-wide text-secondary">
              <tr>
                {preview.columns.map((column, index) => (
                  <th className="whitespace-nowrap border-b border-border px-4 py-3 font-bold" key={`${column}-${index}`}>
                    {column || `Column ${index + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {preview.rows.map((row, rowIndex) => (
                <tr className="text-primary" key={rowIndex}>
                  {preview.columns.map((_, columnIndex) => (
                    <td className="max-w-56 whitespace-nowrap px-4 py-3" key={`${rowIndex}-${columnIndex}`}>
                      {row[columnIndex] || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-sm text-secondary">No preview rows available.</div>
        )}
      </div>
      <p className="text-xs text-secondary">Showing the first {Math.min(20, preview.rows.length)} data rows. No file contents are uploaded or stored.</p>
    </div>
  );
}

function HistoryRow({ item }: { item: UploadHistoryItem }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface/35 px-4 py-3">
      <FileKindIcon kind={item.kind} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-primary">{item.filename}</p>
        <p className="text-xs text-secondary">{item.kind} · {formatFileSize(item.size)} · {new Date(item.timestamp).toLocaleString()}</p>
      </div>
      <span className="hidden items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 sm:flex">
        <Check size={14} /> {item.status}
      </span>
    </div>
  );
}

export default function Ingestion() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<UploadHistoryItem[]>(loadUploadHistory);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const selectedFile = files.find((file) => file.id === selectedId) ?? files[0];
  const blockingErrors = files.some((file) => file.status === "error" || file.status === "processing");
  const canConfirm = files.length > 0 && !blockingErrors && !isUploading;
  const selectedNames = useMemo(() => new Set(files.map((file) => file.name.toLowerCase())), [files]);

  const addFiles = async (incomingFiles: File[]) => {
    setFeedback(null);
    setUploadComplete(false);
    if (incomingFiles.length === 0) return;

    const availableSlots = MAX_FILES - files.length;
    if (availableSlots <= 0) {
      setFeedback(`You can select up to ${MAX_FILES} files per batch.`);
      return;
    }

    const uniqueIncomingFiles = incomingFiles.filter((file, index, allFiles) => (
      allFiles.findIndex((candidate) => candidate.name.toLowerCase() === file.name.toLowerCase()) === index
    ));
    const filesToInspect = uniqueIncomingFiles.slice(0, availableSlots);
    const names = new Set(selectedNames);
    const initialFiles: UploadFile[] = filesToInspect.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      name: file.name,
      kind: "UNKNOWN",
      size: file.size,
      status: "processing",
      issues: [],
    }));

    setFiles((current) => [...current, ...initialFiles]);
    if (!selectedId && initialFiles[0]) setSelectedId(initialFiles[0].id);
    if (incomingFiles.length > availableSlots) {
      setFeedback(`Only ${availableSlots} more file${availableSlots === 1 ? "" : "s"} can be added to this batch.`);
    } else if (uniqueIncomingFiles.length < incomingFiles.length) {
      setFeedback("Duplicate filenames were ignored. Each selected filename must be unique.");
    }

    for (const file of filesToInspect) {
      const inspected = await inspectFile(file, names);
      names.add(file.name.toLowerCase());
      setFiles((current) => current.map((item) => item.id === inspected.id ? inspected : item));
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);
    void addFiles(Array.from(event.dataTransfer.files));
  };

  const removeFile = (id: string) => {
    setFiles((current) => current.filter((file) => file.id !== id));
    if (selectedId === id) setSelectedId(null);
    setUploadComplete(false);
  };

  const confirmUpload = async () => {
    if (!canConfirm) return;
    setIsUploading(true);
    setProgress(0);
    setFeedback(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file.file, file.name));
      setProgress(25);
      const response = await apiClient.post<{ upload_id: string; status: string }>("/agent10/ingestion/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (event.total) setProgress(Math.max(25, Math.round((event.loaded / event.total) * 75)));
        },
      });
      setProgress(100);
      setHistory(saveUploadHistory(files));
      setUploadComplete(true);
      setFeedback(`Backend ingestion ${response.data.status.toLowerCase()}. Review the extraction before committing marks.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "The backend upload could not be completed.";
      setFeedback(message);
    } finally {
      setIsUploading(false);
    }
  };

  const clearHistory = () => {
    clearUploadHistory();
    setHistory([]);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="glass-panel rounded-3xl border border-border/70 p-6 md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <UploadCloud size={14} /> Faculty workspace
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary md:text-4xl">Upload Marks</h1>
            <p className="mt-2 max-w-2xl text-sm text-secondary md:text-base">Upload and validate faculty assessment files before they enter the academic intelligence pipeline.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
            <Info size={15} className="text-indigo-500" /> Phase 1 client-side validation
          </div>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
        <div className="space-y-6">
          <motion.div
            animate={{ scale: isDragging ? 1.01 : 1 }}
            className={`glass-card rounded-3xl border-2 border-dashed p-6 text-center transition-colors md:p-10 ${isDragging ? "border-indigo-500 bg-indigo-500/10" : "border-border/80"}`}
            onDragEnter={(event) => { event.preventDefault(); dragDepth.current += 1; setIsDragging(true); }}
            onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "copy"; setIsDragging(true); }}
            onDragLeave={(event) => { event.preventDefault(); dragDepth.current -= 1; if (dragDepth.current <= 0) { dragDepth.current = 0; setIsDragging(false); } }}
            onDrop={handleDrop}
          >
            <motion.div animate={{ y: isDragging ? -4 : 0 }} className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
              <UploadCloud size={32} />
            </motion.div>
            <h2 className="text-xl font-bold text-primary">Drop your mark sheet here</h2>
            <p className="mt-2 text-sm text-secondary">Drag files here or browse from your device</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <FileText size={17} /> Browse files
            </button>
            <input ref={fileInputRef} className="sr-only" type="file" multiple accept={ACCEPTED_FORMATS} onChange={handleInputChange} aria-label="Browse mark sheet files" />
            <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs font-semibold text-secondary">
              <span>CSV · XLSX · XLS · PDF</span><span>Up to 10 MB per file</span><span>Up to 5 files</span>
            </div>
          </motion.div>

          {feedback && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300" role="status">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {uploadComplete && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300" role="status">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              <span><strong>Upload successful.</strong> The files were sent to the backend for deterministic extraction and validation.</span>
            </div>
          )}

          <section className="glass-card rounded-3xl p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-primary">Selected Files</h2>
                <p className="text-xs text-secondary">{files.length} of {MAX_FILES} files selected</p>
              </div>
              {files.length > 0 && <button type="button" onClick={() => setFiles([])} className="text-xs font-bold text-secondary hover:text-rose-500">Clear selection</button>}
            </div>
            {files.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-secondary">Your selected files will appear here.</div>
            ) : (
              <div className="space-y-3">
                {files.map((file) => (
                  <div key={file.id} className={`flex w-full items-center gap-3 rounded-2xl border p-3 transition ${selectedFile?.id === file.id ? "border-indigo-500/50 bg-indigo-500/10" : "border-border/70 bg-surface/30"}`}>
                    <button type="button" onClick={() => setSelectedId(file.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset">
                      <FileKindIcon kind={file.kind} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-primary">{file.name}</span>
                        <span className="block text-xs text-secondary">{file.kind} · {formatFileSize(file.size)}</span>
                      </span>
                      <StatusBadge status={file.status} />
                    </button>
                    <button type="button" onClick={() => removeFile(file.id)} className="rounded-lg p-1.5 text-secondary hover:bg-rose-500/10 hover:text-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500" title={`Remove ${file.name}`} aria-label={`Remove ${file.name}`}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="glass-card rounded-3xl p-5 md:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-primary">Preview</h2>
            <p className="text-xs text-secondary">Client-side inspection before backend extraction.</p>
          </div>
          <PreviewPanel preview={selectedFile?.preview} filename={selectedFile?.name ?? ""} size={selectedFile?.size ?? 0} />
          {selectedFile?.issues.length ? (
            <div className="mt-5 space-y-2" aria-label="Validation messages">
              {selectedFile.issues.map((issue, index) => (
                <div className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${issue.severity === "error" ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300" : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`} key={`${issue.message}-${index}`}>
                  {issue.severity === "error" ? <XCircle size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
                  <span>{issue.message}</span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </section>

      <section className="glass-panel rounded-3xl border border-border/70 p-5 md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-bold text-primary">Confirm Upload</h2>
            <p className="mt-1 text-sm text-secondary">Files with blocking validation errors cannot be confirmed.</p>
          </div>
          <button type="button" disabled={!canConfirm} onClick={() => void confirmUpload()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-45">
            {isUploading ? <Clock3 size={17} className="animate-pulse" /> : <UploadCloud size={17} />}
            {isUploading ? `Uploading ${progress}%` : "Confirm Upload"}
          </button>
        </div>
        {isUploading && <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-secondary" aria-label={`Upload progress ${progress}%`}><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full bg-indigo-500" /></div>}
      </section>

      <section className="glass-card rounded-3xl p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-primary">Recent Uploads</h2>
            <p className="text-xs text-secondary">Metadata is retained locally for this upload history.</p>
          </div>
          {history.length > 0 && <button type="button" onClick={clearHistory} className="inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:text-rose-500"><Trash2 size={14} /> Clear history</button>}
        </div>
        {history.length === 0 ? <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-secondary">Completed uploads will appear here.</p> : <div className="grid gap-2 md:grid-cols-2">{history.slice(0, 6).map((item) => <HistoryRow item={item} key={item.id + item.timestamp} />)}</div>}
      </section>
    </div>
  );
}
