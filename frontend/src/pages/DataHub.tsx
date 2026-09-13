import { useState, useRef } from "react";
import { UploadCloud, FileSpreadsheet, FileText, Database, CheckCircle2, AlertCircle, Sparkles, X, File as FileIcon } from "lucide-react";
import { Agent10API } from "../services/api";
import ManualEntry from "./ManualEntry";

export default function DataHub() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("attendance");
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"upload" | "manual">("upload");
  const rawRole = localStorage.getItem("bodhsight_display_role") || localStorage.getItem("bodhsight_role") || "Faculty";

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/pdf", // .pdf
      "text/csv" // .csv
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|docx|pdf|csv)$/)) {
      setErrorMsg("Invalid file type. Please upload Excel (.xlsx), Word (.docx), or PDF (.pdf) files.");
      setUploadState("error");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setErrorMsg("File is too large. Maximum size is 10MB.");
      setUploadState("error");
      return;
    }

    setSelectedFile(file);
    setUploadState("idle");
    setErrorMsg("");
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadState("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploadState("uploading");
    try {
      await Agent10API.uploadDocument(selectedFile, docType);
      setUploadState("success");
      setTimeout(() => {
        clearFile();
      }, 3000);
    } catch (err: any) {
      setUploadState("error");
      setErrorMsg(err.message || "Failed to upload file to Agent 10.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/50 rounded-3xl p-8 text-primary shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-500/20 mb-2">
            <Database size={14} /> Data Hub ({rawRole} View)
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-950 dark:text-indigo-100">Document Ingestion & Uploads</h1>
          <p className="text-indigo-800/80 dark:text-indigo-200/70 text-sm mt-1">
            Upload raw documents to the Agent 10 ingestion queue. The current backend acknowledges the file, records an audit event, and processes supported CSV rows when available.
          </p>
        </div>
        <div className="flex bg-surface-hover/50 p-1 rounded-xl border border-border mt-4 md:mt-0">
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-sm' : 'text-secondary hover:text-primary'}`}
            onClick={() => setActiveTab("upload")}
          >
            File Upload
          </button>
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'manual' ? 'bg-indigo-600 text-white shadow-sm' : 'text-secondary hover:text-primary'}`}
            onClick={() => setActiveTab("manual")}
          >
            Manual Entry
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Upload Zone or Manual Entry */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "upload" ? (
            <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <UploadCloud className="text-indigo-500" size={20} />
              Ingestion Queue
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-semibold text-primary mb-2">Document Context</label>
              <select 
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium text-primary focus:outline-none focus:border-indigo-500"
              >
                <option value="attendance">Daily Attendance Log</option>
                <option value="marks">Mid-Term Marks / Grades</option>
                <option value="assignments">Assignment Submissions</option>
                <option value="condonation">Condonation Medical Certificates</option>
                <option value="all">Import All (Consolidated Data)</option>
              </select>
            </div>

            <div 
              className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-colors
                ${dragActive ? "border-indigo-500 bg-indigo-500/5" : "border-border hover:bg-surface-hover"}
                ${selectedFile ? "border-emerald-500/50 bg-emerald-500/5" : ""}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleChange}
                accept=".xlsx, .xls, .csv, .pdf, .docx"
              />
              
              {!selectedFile ? (
                <>
                  <div className="p-4 bg-background rounded-full border border-border shadow-sm mb-4">
                    <UploadCloud size={32} className="text-indigo-500" />
                  </div>
                  <h3 className="text-lg font-bold text-primary">Drag & Drop Document</h3>
                  <p className="text-sm text-secondary mt-2">or click to browse from your computer</p>
                  <p className="text-xs text-secondary/60 mt-4 font-semibold uppercase tracking-wider">Supports .XLSX, .PDF, .DOCX</p>
                </>
              ) : (
                <div className="flex flex-col items-center z-10 relative pointer-events-none">
                  <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-4">
                    <FileIcon size={32} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-primary truncate max-w-xs">{selectedFile.name}</h3>
                  <p className="text-sm text-secondary mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  
                  {uploadState === "idle" && (
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); clearFile(); }}
                      className="mt-4 text-xs font-bold text-rose-500 hover:text-rose-600 pointer-events-auto bg-surface px-3 py-1.5 rounded-lg border border-border shadow-sm flex items-center gap-1"
                    >
                      <X size={14} /> Remove File
                    </button>
                  )}
                </div>
              )}
            </div>

            {uploadState === "error" && (
              <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium">
                <AlertCircle size={18} /> {errorMsg}
              </div>
            )}
            
            {uploadState === "success" && (
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                <CheckCircle2 size={18} /> Backend acknowledged the upload. Validation and operational approval are not exposed by the current ingestion API.
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploadState === "uploading" || uploadState === "success"}
              className={`w-full mt-6 py-4 rounded-xl text-sm font-bold flex justify-center items-center gap-2 transition-all shadow-md
                ${(!selectedFile || uploadState === "success") 
                  ? "bg-surface-secondary text-secondary cursor-not-allowed border border-border" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 cursor-pointer"
                }
              `}
            >
              {uploadState === "uploading" ? (
                <>Loading <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></>
              ) : uploadState === "success" ? (
                <>Uploaded Successfully</>
              ) : (
                <>Upload & Process via Agent 10</>
              )}
            </button>
          </div>
          ) : (
            <ManualEntry />
          )}
        </div>

        {/* Right Col: Info */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-primary mb-4 uppercase tracking-wider">How it works</h3>
            <ul className="space-y-4 text-sm text-secondary">
              <li className="flex gap-3">
                <div className="mt-0.5"><FileSpreadsheet size={16} className="text-emerald-500" /></div>
                <div>
                  <strong className="text-primary block">Upload Excel (.xlsx)</strong>
                  Agent 10 automatically maps column headers (e.g. "Roll No", "Marks") to the database schema.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5"><FileText size={16} className="text-blue-500" /></div>
                <div>
                  <strong className="text-primary block">Upload Word (.docx)</strong>
                  Unstructured notes and meeting minutes are parsed using LLMs to extract action items.
                </div>
              </li>
              <li className="flex gap-3">
                <div className="mt-0.5"><FileIcon size={16} className="text-rose-500" /></div>
                <div>
                  <strong className="text-primary block">Upload PDF (.pdf)</strong>
                  Medical certificates for condonation are OCR scanned and verified.
                </div>
              </li>
              <li className="flex gap-3 pt-4 border-t border-border">
                <div className="mt-0.5"><Sparkles size={16} className="text-indigo-500" /></div>
                <div>
                  <strong className="text-primary block">Zero-Touch Processing</strong>
                  Once uploaded, data instantly affects anomaly detection and dashboard metrics.
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
