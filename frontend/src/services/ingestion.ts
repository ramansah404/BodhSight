import * as XLSX from "xlsx";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_FILES = 5;
export const UPLOAD_HISTORY_KEY = "bodhsight_upload_history";

export type SupportedFileKind = "CSV" | "XLSX" | "XLS" | "PDF";
export type FileKind = SupportedFileKind | "UNKNOWN";
export type FileStatus = "processing" | "valid" | "warning" | "error";

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
}

export interface SpreadsheetPreview {
  type: "spreadsheet";
  sheetName: string;
  columns: string[];
  rowCount: number;
  rows: string[][];
  blankRowCount: number;
}

export interface PdfPreview {
  type: "pdf";
  pageCount: number | null;
}

export type PreviewData = SpreadsheetPreview | PdfPreview;

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  kind: FileKind;
  size: number;
  status: FileStatus;
  issues: ValidationIssue[];
  preview?: PreviewData;
}

export interface UploadHistoryItem {
  id: string;
  filename: string;
  kind: FileKind;
  size: number;
  timestamp: string;
  status: "Simulated upload";
}

const EXTENSION_TO_KIND: Record<string, SupportedFileKind> = {
  csv: "CSV",
  xlsx: "XLSX",
  xls: "XLS",
  pdf: "PDF",
};

const HEADER_HINTS = [
  "student",
  "roll",
  "registration",
  "name",
  "mark",
  "score",
  "assessment",
  "course",
  "subject",
  "attendance",
  "grade",
  "gpa",
];

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function getFileKind(file: File): FileKind {
  return EXTENSION_TO_KIND[getExtension(file.name)] ?? "UNKNOWN";
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function createFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function validateFile(file: File, duplicateNames: ReadonlySet<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const kind = getFileKind(file);

  if (kind === "UNKNOWN") {
    issues.push({ severity: "error", message: "Unsupported format. Use CSV, XLSX, XLS, or PDF." });
  }
  if (file.size === 0) {
    issues.push({ severity: "error", message: "The file is empty." });
  }
  if (file.size > MAX_FILE_SIZE) {
    issues.push({ severity: "error", message: "The file exceeds the 10 MB limit." });
  }
  if (duplicateNames.has(file.name.toLowerCase())) {
    issues.push({ severity: "error", message: "A file with this name is already selected." });
  }

  return issues;
}

function cellToText(cell: unknown): string {
  if (cell instanceof Date) return cell.toISOString().slice(0, 10);
  if (cell === null || cell === undefined) return "";
  return String(cell).trim();
}

function isBlankRow(row: string[]): boolean {
  return row.every((cell) => cell.trim() === "");
}

function hasRecognizableHeader(columns: string[]): boolean {
  return columns.some((column) => {
    const normalized = column.toLowerCase();
    return HEADER_HINTS.some((hint) => normalized.includes(hint));
  });
}

export async function parseSpreadsheet(file: File): Promise<{ preview: SpreadsheetPreview; issues: ValidationIssue[] }> {
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        preview: { type: "spreadsheet", sheetName: "", columns: [], rowCount: 0, rows: [], blankRowCount: 0 },
        issues: [{ severity: "error", message: "The workbook does not contain a worksheet." }],
      };
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: "",
      blankrows: false,
    }) as unknown[][];
    const rows = rawRows.map((row) => row.map(cellToText));
    const headerIndex = rows.findIndex((row) => !isBlankRow(row));
    const columns = headerIndex >= 0 ? rows[headerIndex] : [];
    const dataRows = headerIndex >= 0 ? rows.slice(headerIndex + 1).filter((row) => !isBlankRow(row)) : [];
    const blankRowCount = rows.slice(headerIndex + 1).filter(isBlankRow).length;
    const issues: ValidationIssue[] = [];

    if (dataRows.length === 0) {
      issues.push({ severity: "error", message: "The spreadsheet has no data rows." });
    }
    if (columns.length === 0 || !hasRecognizableHeader(columns)) {
      issues.push({ severity: "error", message: "No recognizable mark-sheet headers were found." });
    }
    if (blankRowCount > 0) {
      issues.push({ severity: "warning", message: `${blankRowCount} blank row${blankRowCount === 1 ? "" : "s"} will be ignored in preview.` });
    }

    return {
      preview: {
        type: "spreadsheet",
        sheetName,
        columns,
        rowCount: dataRows.length,
        rows: dataRows.slice(0, 20),
        blankRowCount,
      },
      issues,
    };
  } catch {
    return {
      preview: { type: "spreadsheet", sheetName: "", columns: [], rowCount: 0, rows: [], blankRowCount: 0 },
      issues: [{ severity: "error", message: "The spreadsheet could not be read. Check that it is a valid file." }],
    };
  }
}

export async function inspectFile(file: File, duplicateNames: ReadonlySet<string>): Promise<UploadFile> {
  const kind = getFileKind(file);
  const issues = validateFile(file, duplicateNames);
  const uploadFile: UploadFile = {
    id: createFileId(file),
    file,
    name: file.name,
    kind,
    size: file.size,
    status: "processing",
    issues,
  };

  if (issues.some((issue) => issue.severity === "error")) {
    return { ...uploadFile, status: "error" };
  }

  if (kind === "PDF") {
    return {
      ...uploadFile,
      status: "valid",
      preview: { type: "pdf", pageCount: null },
    };
  }

  const parsed = await parseSpreadsheet(file);
  const allIssues = [...issues, ...parsed.issues];
  return {
    ...uploadFile,
    issues: allIssues,
    preview: parsed.preview,
    status: allIssues.some((issue) => issue.severity === "error")
      ? "error"
      : allIssues.some((issue) => issue.severity === "warning")
        ? "warning"
        : "valid",
  };
}

export function loadUploadHistory(): UploadHistoryItem[] {
  try {
    const stored = localStorage.getItem(UPLOAD_HISTORY_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is UploadHistoryItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Record<string, unknown>;
      return typeof candidate.id === "string"
        && typeof candidate.filename === "string"
        && typeof candidate.kind === "string"
        && typeof candidate.size === "number"
        && typeof candidate.timestamp === "string"
        && candidate.status === "Simulated upload";
    });
  } catch {
    return [];
  }
}

export function saveUploadHistory(files: UploadFile[]): UploadHistoryItem[] {
  const current = loadUploadHistory();
  const additions = files.map<UploadHistoryItem>((item) => ({
    id: item.id,
    filename: item.name,
    kind: item.kind,
    size: item.size,
    timestamp: new Date().toISOString(),
    status: "Simulated upload",
  }));
  const history = [...additions, ...current].slice(0, 20);
  localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearUploadHistory(): void {
  localStorage.removeItem(UPLOAD_HISTORY_KEY);
}

export async function simulateUpload(onProgress: (progress: number) => void): Promise<void> {
  for (const progress of [0, 25, 50, 75, 100]) {
    onProgress(progress);
    if (progress < 100) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 220));
    }
  }
}
