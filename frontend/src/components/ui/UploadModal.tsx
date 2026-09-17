import React, { useState, useRef } from "react";
import { Upload, X, FileType, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IngestionAPI } from "../../services/api";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: "attendance" | "course_results";
}

export default function UploadModal({ isOpen, onClose, documentType }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const res = await IngestionAPI.uploadFile(file, documentType);
      setResult(res);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-surface rounded-2xl shadow-2xl border border-border/50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-surface-hover/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-content">Bulk Upload</h2>
                  <p className="text-sm text-content-muted">
                    {documentType === "attendance" ? "Update Student Attendance" : "Update Course Results"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-content-muted hover:bg-surface-hover rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-6">
              {!result && !error && (
                <>
                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer
                      ${file ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10' : 'border-border hover:border-teal-500/50 hover:bg-surface-hover'}
                    `}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      accept=".csv, .xlsx, .pdf"
                    />
                    
                    <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-600">
                      {file ? <FileType size={32} /> : <Upload size={32} />}
                    </div>
                    
                    <div className="text-center">
                      <p className="font-semibold text-content">
                        {file ? file.name : "Click or drag file here"}
                      </p>
                      <p className="text-sm text-content-muted mt-1">
                        {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports CSV, XLSX, and PDF"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-surface-hover p-4 rounded-xl text-sm text-content-muted border border-border/50">
                    <p className="font-semibold mb-1">Format Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Must contain 'rollno' or 'student_id'</li>
                      <li>Include 'attendance' or 'cgpa' columns</li>
                      <li>PDF files must have clear tabular structures</li>
                    </ul>
                  </div>
                </>
              )}

              {uploading && (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
                  <p className="font-medium text-content animate-pulse">Processing file using Agent 10 AI...</p>
                </div>
              )}

              {error && !uploading && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl border border-red-200 dark:border-red-800/30 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Upload Failed</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {result && !uploading && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 p-6 rounded-xl border border-green-200 dark:border-green-800/30 flex flex-col items-center text-center gap-3">
                  <CheckCircle2 className="w-12 h-12" />
                  <div>
                    <h3 className="font-bold text-lg">Upload Successful!</h3>
                    <p className="text-sm mt-1 text-green-700 dark:text-green-400">
                      Processed {result.file_info?.rows_detected || 0} rows. Valid: {result.file_info?.rows_valid || 0}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 bg-surface-hover/30 flex justify-end gap-3">
              <button
                className="px-5 py-2.5 rounded-xl font-medium text-content hover:bg-surface-hover transition-colors"
                onClick={onClose}
              >
                {result || error ? "Close" : "Cancel"}
              </button>
              {!result && !error && (
                <button
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl shadow-lg shadow-teal-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={!file || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  Upload
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
