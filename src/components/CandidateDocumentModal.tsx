import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, X, Download, ExternalLink, Upload, Trash2, 
  CheckCircle2, AlertCircle, FileCheck, Eye, Sparkles, Loader2 
} from 'lucide-react';
import { Candidate } from '../types';
import { ThemeConfig } from '../theme';
import { updateCandidateInFirestore } from '../services/candidateService';

interface CandidateDocumentModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  userEmail?: string;
  onCandidateUpdated?: (updated: Candidate) => void;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.png', '.jpg', '.jpeg', '.webp'];

const isSafeUrl = (url?: string): boolean => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const CandidateDocumentModal: React.FC<CandidateDocumentModalProps> = ({
  candidate,
  isOpen,
  onClose,
  theme,
  userEmail,
  onCandidateUpdated
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !candidate) return null;

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Security Check: Whitelist file extensions
    const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      setUploadError("Security Notice: Only PDF, Word (.doc, .docx), text, or image documents are permitted.");
      return;
    }

    // Limit to ~750KB for safe Firestore payload and prevention of storage abuse
    if (file.size > 750 * 1024) {
      setUploadError("File exceeds maximum allowed size (750KB). Please upload a compressed document or provide a secure cloud link.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const updates = {
          cvFileName: file.name.replace(/[^a-zA-Z0-9._\- ]/g, '_'),
          cvFileType: file.type || 'application/pdf',
          cvFileData: base64Data,
          updatedAt: new Date().toISOString()
        };

        await updateCandidateInFirestore(candidate.id, updates, userEmail);
        
        if (onCandidateUpdated) {
          onCandidateUpdated({ ...candidate, ...updates });
        }
        setIsUploading(false);
      } catch (err: any) {
        console.error("Upload error", err);
        setUploadError("Failed to attach document to Firestore. Please try again.");
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadError("Could not read file data.");
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = async () => {
    if (!window.confirm("Remove this document attachment from the candidate?")) return;
    setIsUploading(true);
    try {
      const updates = {
        cvFileName: '',
        cvFileType: '',
        cvFileData: '',
        updatedAt: new Date().toISOString()
      };
      await updateCandidateInFirestore(candidate.id, updates, userEmail);
      if (onCandidateUpdated) {
        onCandidateUpdated({ ...candidate, ...updates });
      }
    } catch (err) {
      console.error(err);
    }
    setIsUploading(false);
  };

  const hasFileData = Boolean(candidate.cvFileData);
  const hasExternalLink = Boolean(candidate.cv && candidate.cv.startsWith('http'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-2xl ${theme.bgCard} ${theme.border} border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${theme.border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${theme.badgePrimary} border shadow-sm`}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-extrabold ${theme.textPrimary}`}>Candidate Resume & Documents</h2>
              <p className={`text-xs ${theme.textSecondary}`}>
                {candidate.name} ({candidate.id}) • {candidate.role}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl hover:bg-slate-500/10 ${theme.textMuted} hover:${theme.textPrimary} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
          {/* Current Cloud Document Status */}
          <div className={`p-4 rounded-2xl ${theme.statCardBg} ${theme.statCardBorder} border flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>Cloud Attachment Status</span>
              {hasFileData ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Synced in Firestore
                </span>
              ) : hasExternalLink ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                  <ExternalLink className="w-3.5 h-3.5" /> External URL Linked
                </span>
              ) : (
                <span className={`text-xs font-bold ${theme.textMuted}`}>No document attached</span>
              )}
            </div>

            {/* Document Info Card */}
            {hasFileData && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/10 border border-slate-500/20">
                <div className="flex items-center gap-3 truncate">
                  <FileCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="truncate">
                    <div className={`text-sm font-bold truncate ${theme.textPrimary}`}>
                      {candidate.cvFileName || 'Resume.pdf'}
                    </div>
                    <div className={`text-[11px] ${theme.textMuted}`}>
                      Type: {candidate.cvFileType || 'PDF Document'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={candidate.cvFileData}
                    download={candidate.cvFileName || `${candidate.name}-Resume.pdf`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${theme.btnPrimary} text-xs font-semibold shadow-sm`}
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                  <button
                    onClick={handleRemoveAttachment}
                    disabled={isUploading}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Remove Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* External URL card */}
            {hasExternalLink && isSafeUrl(candidate.cv) && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-500/10 border border-slate-500/20">
                <div className="flex items-center gap-3 truncate">
                  <ExternalLink className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div className="truncate">
                    <div className={`text-sm font-bold truncate ${theme.textPrimary}`}>
                      Verified External Document Link
                    </div>
                    <div className={`text-[11px] ${theme.textMuted} truncate max-w-xs`}>
                      {candidate.cv}
                    </div>
                  </div>
                </div>
                <a
                  href={candidate.cv}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${theme.btnSecondary} text-xs font-semibold`}
                >
                  Open Link <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Upload / Replace Document Dropzone */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-2`}>
              Upload / Replace Cloud Resume
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                isDragOver ? 'border-teal-500 bg-teal-500/5' : `${theme.border} hover:border-teal-500/50 hover:bg-slate-500/5`
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.png,.jpg"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className={`w-8 h-8 animate-spin ${theme.textAccent}`} />
                  <span className={`text-xs font-medium ${theme.textSecondary}`}>Syncing document with Firestore...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 rounded-full bg-slate-500/10 text-teal-500">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className={`text-sm font-bold ${theme.textPrimary}`}>
                      Click to upload or drag & drop resume
                    </span>
                    <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                      PDF, DOCX, TXT, PNG, or JPG (up to 750KB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Embedded Preview if PDF or image */}
          {hasFileData && candidate.cvFileType?.includes('pdf') && (
            <div className="flex flex-col gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>
                Document In-App Preview
              </span>
              <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-500/20 bg-slate-900">
                <iframe
                  src={candidate.cvFileData}
                  title="Resume Preview"
                  className="w-full h-full border-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${theme.border} flex justify-end gap-3 bg-slate-500/5`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl ${theme.btnSecondary} text-xs font-semibold`}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
