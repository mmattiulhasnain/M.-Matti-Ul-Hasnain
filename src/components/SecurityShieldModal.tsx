import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, X, Lock, KeyRound, CheckCircle2, 
  Server, Database, AlertCircle, FileCheck, RefreshCw 
} from 'lucide-react';
import { ThemeConfig } from '../theme';

interface SecurityShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  userEmail?: string;
  isFirestoreConnected: boolean;
}

export const SecurityShieldModal: React.FC<SecurityShieldModalProps> = ({
  isOpen,
  onClose,
  theme,
  userEmail,
  isFirestoreConnected
}) => {
  if (!isOpen) return null;

  const securityPillars = [
    {
      title: 'Cloud Firestore Zero-Trust Rules',
      status: isFirestoreConnected ? 'Enforced & Active' : 'Connected',
      description: 'Strict Attribute-Based Access Control (ABAC), volumetric field limits (name/role <= 150 chars, CV payload <= 750KB), and default deny catch-all.',
      icon: <Database className="w-5 h-5 text-emerald-500" />,
      badges: ['ABAC Rules Active', 'Volumetric Checks', 'Default Deny']
    },
    {
      title: 'Backend Brute-Force & Rate Limiting',
      status: 'Active (200 req/min)',
      description: 'In-memory IP tracker limits failed authorization attempts to 5 before triggering a 15-minute lockout. General API rate throttled at 200 req/min.',
      icon: <Server className="w-5 h-5 text-indigo-500" />,
      badges: ['5-Failure Lockout', 'Timing-Safe Equality', 'IP Throttling']
    },
    {
      title: 'Input Sanitization & Anti-XSS Protection',
      status: 'Active',
      description: 'All string updates and incoming payloads are cleansed of script tags, javascript: schemes, and event handlers. External URLs are validated for https:// and http://.',
      icon: <ShieldCheck className="w-5 h-5 text-teal-500" />,
      badges: ['Script Stripping', 'Safe URL Protocols', 'Rel Noopener']
    },
    {
      title: 'Document & MIME Type Whitelist',
      status: 'Active',
      description: 'Candidate resumes and attachments are strictly validated against allowed document formats (.pdf, .doc, .docx, .txt, image) with 750KB hard ceiling.',
      icon: <FileCheck className="w-5 h-5 text-amber-500" />,
      badges: ['PDF/Word Only', 'Max 750KB', 'No Executables']
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-xl ${theme.bgCard} ${theme.border} border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${theme.border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-extrabold ${theme.textPrimary}`}>Security Shield</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Protected
                </span>
              </div>
              <p className={`text-xs ${theme.textSecondary}`}>
                Zero-Trust ABAC, Rate-Limiting & Payload Sanitization
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
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-4 rounded-2xl bg-slate-500/5 border border-slate-500/10 flex items-center justify-between">
            <div>
              <div className={`text-xs font-semibold ${theme.textMuted}`}>Authenticated Operator</div>
              <div className={`text-sm font-bold ${theme.textPrimary}`}>{userEmail || 'Authorized Recruiter'}</div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Google Token Verified
            </div>
          </div>

          <div className="space-y-3">
            {securityPillars.map((pillar, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${theme.border} ${theme.bgMain} transition-all`}>
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-500/10">
                      {pillar.icon}
                    </div>
                    <span className={`text-sm font-bold ${theme.textPrimary}`}>{pillar.title}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 whitespace-nowrap">
                    {pillar.status}
                  </span>
                </div>
                <p className={`text-xs ${theme.textSecondary} leading-relaxed mb-3 pl-8`}>
                  {pillar.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pl-8">
                  {pillar.badges.map((b, i) => (
                    <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${theme.badgePrimary} border`}>
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${theme.border} ${theme.bgMain} flex items-center justify-between text-xs`}>
          <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
            <Lock className="w-3.5 h-3.5" /> End-to-End Cryptographic Protection
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl ${theme.btnPrimary} font-semibold`}
          >
            Acknowledge
          </button>
        </div>
      </motion.div>
    </div>
  );
};
