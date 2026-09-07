import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, Check, Lock, Key, AlertCircle, Loader2, Sparkles, 
  User, Briefcase, MapPin, Mail, Phone, DollarSign, Globe,
  FileText, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { Candidate, CompensationType, EmploymentType } from '../types';
import { ThemeConfig } from '../theme';
import { updateCandidateWithBackend } from '../services/candidateService';
import { parseLocation, parseSeniority } from '../utils';

interface CandidateEditModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  userEmail?: string;
  onCandidateUpdated?: (updated: Candidate) => void;
  onSuccessToast?: (msg: string) => void;
}

export const CandidateEditModal: React.FC<CandidateEditModalProps> = ({
  candidate,
  isOpen,
  onClose,
  theme,
  userEmail,
  onCandidateUpdated,
  onSuccessToast
}) => {
  if (!isOpen || !candidate) return null;

  // Form State
  const [name, setName] = useState(candidate.name || '');
  const [role, setRole] = useState(candidate.role || '');
  const [seniority, setSeniority] = useState<string>(candidate.seniority || parseSeniority(candidate.experience, candidate.role));
  const [skills, setSkills] = useState(candidate.skills || '');
  const [experience, setExperience] = useState(candidate.experience || '');
  const [specialization, setSpecialization] = useState(candidate.specialization || '');
  const [location, setLocation] = useState(candidate.location || '');
  
  // Custom Compensation State (Person-specific, no defaults forced)
  const [compensationType, setCompensationType] = useState<CompensationType>(
    candidate.compensationType || (candidate.hourlyRate ? 'Hourly' : 'Monthly Salary')
  );
  const [currency, setCurrency] = useState<string>(candidate.currency || 'USD');
  const [hourlyRate, setHourlyRate] = useState<string>(
    candidate.hourlyRate !== undefined && candidate.hourlyRate !== null ? String(candidate.hourlyRate) : ''
  );
  const [salaryExpectation, setSalaryExpectation] = useState<string>(
    candidate.salaryExpectation !== undefined && candidate.salaryExpectation !== null ? String(candidate.salaryExpectation) : ''
  );
  const [minSalary, setMinSalary] = useState<string>(
    candidate.minSalary !== undefined && candidate.minSalary !== null ? String(candidate.minSalary) : ''
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>(candidate.employmentType || 'Full-time');
  const [compensationNotes, setCompensationNotes] = useState<string>(candidate.compensationNotes || '');

  const [email, setEmail] = useState(candidate.email || '');
  const [whatsapp, setWhatsapp] = useState(candidate.whatsapp || '');
  const [portfolio, setPortfolio] = useState(candidate.portfolio || '');
  const [cv, setCv] = useState(candidate.cv || '');
  const [notes, setNotes] = useState(candidate.notes || '');

  // Backend Password State
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pipeline & Scorecard State
  const [pipelineStage, setPipelineStage] = useState<string>(candidate.pipelineStage || 'Available on Bench');
  const [preferredTimezones, setPreferredTimezones] = useState(candidate.preferredTimezones?.join(', ') || '');
  const [techRating, setTechRating] = useState(candidate.scorecard?.technicalRating || 0);
  const [commRating, setCommRating] = useState(candidate.scorecard?.communicationClarity || 0);
  const [englishProficiency, setEnglishProficiency] = useState(candidate.scorecard?.englishProficiency || '');
  const [availabilityDate, setAvailabilityDate] = useState(candidate.scorecard?.availabilityDate || '');
  const [scorecardNotes, setScorecardNotes] = useState(candidate.scorecard?.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password.trim()) {
      setErrorMessage("Please enter the authorization password (MIHORAtlnt@1) to save edits.");
      return;
    }

    setIsSaving(true);

    try {
      const { country, city } = parseLocation(location);
      const updates: Partial<Candidate> = {
        name: name.trim(),
        role: role.trim(),
        seniority: seniority as any,
        skills: skills.trim(),
        experience: experience.trim(),
        specialization: specialization.trim(),
        location: location.trim(),
        country,
        city,
        compensationType,
        currency: currency.trim() || 'USD',
        hourlyRate: hourlyRate.trim() ? Number(hourlyRate) : undefined,
        salaryExpectation: salaryExpectation.trim() ? Number(salaryExpectation) : undefined,
        minSalary: minSalary.trim() ? Number(minSalary) : undefined,
        employmentType: (employmentType || undefined) as any,
        compensationNotes: compensationNotes.trim() || undefined,
        email: email.trim(),
        whatsapp: whatsapp.trim(),
        portfolio: portfolio.trim(),
        cv: cv.trim(),
        notes: notes.trim(),
        pipelineStage: pipelineStage as any,
        preferredTimezones: preferredTimezones.split(',').map(t => t.trim()).filter(Boolean),
        scorecard: {
          technicalRating: techRating || undefined,
          communicationClarity: commRating || undefined,
          englishProficiency: englishProficiency ? (englishProficiency as any) : undefined,
          availabilityDate: availabilityDate.trim() || undefined,
          notes: scorecardNotes.trim() || undefined
        },
        updatedAt: new Date().toISOString()
      };

      // Call backend to verify password and persist changes
      const updatedRecord = await updateCandidateWithBackend(
        candidate.id,
        updates,
        password.trim(),
        userEmail
      );

      if (onCandidateUpdated) {
        onCandidateUpdated(updatedRecord);
      }

      if (onSuccessToast) {
        onSuccessToast(`Candidate ${name} updated and persisted successfully on backend!`);
      }

      setIsSaving(false);
      onClose();
    } catch (err: any) {
      console.error("Edit submission error:", err);
      setErrorMessage(err.message || "Backend rejected update. Please check the authorization password.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-2xl ${theme.bgCard} ${theme.border} border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${theme.border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${theme.badgePrimary} border shadow-sm`}>
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-extrabold ${theme.textPrimary}`}>Edit Candidate Profile</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-400 border border-slate-500/20">
                  {candidate.id}
                </span>
              </div>
              <p className={`text-xs ${theme.textSecondary}`}>
                Protected edit flow verified & persisted via backend server
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex flex-col gap-5 custom-scrollbar">
          {/* Error Banner */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs font-semibold flex items-center gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Backend Password Verification Required Box */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Admin Authorization Required
                </span>
              </div>
              <span className="text-[11px] font-mono text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Password: MIHORAtlnt@1
              </span>
            </div>
            <p className={`text-xs ${theme.textSecondary}`}>
              To maintain data integrity and security, the backend server validates your authorization password before applying changes.
            </p>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password (MIHORAtlnt@1) to authorize..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500`}
                required
              />
            </div>

            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Role / Title *
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500`}
                required
              />
            </div>
          </div>

          {/* Seniority & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Seniority Tier
              </label>
              <div className="grid grid-cols-4 gap-1">
                {['Junior', 'Mid', 'Senior', 'Lead/Principal'].map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setSeniority(lvl)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-xl border transition-all text-center ${
                      seniority === lvl
                        ? `${theme.badgePrimary} border-teal-500 shadow-sm`
                        : `${theme.border} ${theme.textSecondary} hover:${theme.textPrimary}`
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Experience (e.g. 3 years)
              </label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>
          </div>

          {/* Rates & Compensation (Fully Customizable Per Candidate) */}
          <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Customized Compensation & Rates
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Stored directly in database</span>
            </div>

            {/* Currency and Model Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                  Compensation Model
                </label>
                <select
                  value={compensationType}
                  onChange={(e) => setCompensationType(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                >
                  <option value="Monthly Salary">📅 Monthly Salary</option>
                  <option value="Hourly">🕒 Hourly Rate</option>
                  <option value="Annual Package">🏛️ Annual Package</option>
                  <option value="Daily Rate">☀️ Daily Rate</option>
                  <option value="Project / Contract">🤝 Project / Contract</option>
                  <option value="Custom / Negotiable">💬 Custom / Negotiable</option>
                </select>
              </div>

              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                  Currency Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. USD, EUR, GBP, PKR, CAD, AED..."
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>
            </div>

            {/* Target Salary, Hourly Rate, and Min Floor */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                  Target Salary ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000000"
                  placeholder="e.g. 4500"
                  value={salaryExpectation}
                  onChange={(e) => setSalaryExpectation(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>

              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                  Hourly Rate ({currency}/hr)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  placeholder="e.g. 35"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>

              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                  Minimum Floor ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000000"
                  placeholder="e.g. 3800"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>
            </div>

            {/* Employment Type & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                  Employment Arrangement
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  className={`w-full px-3 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract / Freelance">Contract / Freelance</option>
                  <option value="C2C / 1099">C2C / 1099</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              <div>
                <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                  Compensation Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Negotiable on equity, requires PTO..."
                  value={compensationNotes}
                  onChange={(e) => setCompensationNotes(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>
            </div>
          </div>

          {/* Location & Specialization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Location (City, Country)
              </label>
              <input
                type="text"
                placeholder="e.g. Lahore, Pakistan"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>

            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Specialization / Domain
              </label>
              <input
                type="text"
                placeholder="e.g. Mobile Apps, Design Systems, FinTech"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>
          </div>

          {/* Technical Skills */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
              Technical Skills (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Figma, React, TypeScript, Tailwind, Node.js"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="candidate@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>

            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                WhatsApp / Phone
              </label>
              <input
                type="text"
                placeholder="+92 300 1234567"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Portfolio URL
              </label>
              <input
                type="url"
                placeholder="https://behance.net/..."
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>

            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                CV / Resume Link
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={cv}
                onChange={(e) => setCv(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>
          </div>

          {/* ATS Pipeline & Timezones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Pipeline Stage
              </label>
              <select
                value={pipelineStage}
                onChange={(e) => setPipelineStage(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              >
                <option value="Available on Bench">Available on Bench</option>
                <option value="Screening">Screening</option>
                <option value="Client Submitted">Client Submitted</option>
                <option value="Interviewing">Interviewing</option>
                <option value="Placed / Engaged">Placed / Engaged</option>
              </select>
            </div>
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Preferred Timezones (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. US Eastern, GMT/UK, CET, APAC"
                value={preferredTimezones}
                onChange={(e) => setPreferredTimezones(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500`}
              />
            </div>
          </div>

          {/* Scorecard */}
          <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 space-y-4">
            <h4 className="text-sm font-bold text-teal-600 dark:text-teal-400">Recruiter Scorecard</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>Tech Rating (1-5)</label>
                <input
                  type="number" min="0" max="5"
                  value={techRating} onChange={(e) => setTechRating(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </div>
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>Comm Rating (1-5)</label>
                <input
                  type="number" min="0" max="5"
                  value={commRating} onChange={(e) => setCommRating(Number(e.target.value))}
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </div>
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>English Proficiency</label>
                <select
                  value={englishProficiency} onChange={(e) => setEnglishProficiency(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-teal-500`}
                >
                  <option value="">Unrated</option>
                  <option value="Basic">Basic</option>
                  <option value="Conversational">Conversational</option>
                  <option value="Fluent">Fluent</option>
                  <option value="Native">Native</option>
                </select>
              </div>
              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>Availability Date</label>
                <input
                  type="date"
                  value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
              </div>
            </div>
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>Scorecard Notes</label>
              <textarea
                rows={2}
                placeholder="Technical notes, communication style..."
                value={scorecardNotes}
                onChange={(e) => setScorecardNotes(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
              General Notes & Comments
            </label>
            <textarea
              rows={2}
              placeholder="Add general notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500`}
            />
          </div>
        </form>

        {/* Footer */}
        <div className={`p-4 border-t ${theme.border} flex items-center justify-between bg-slate-500/5`}>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Changes are verified and written by backend server</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl ${theme.btnSecondary} text-xs font-semibold`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl ${theme.btnPrimary} text-xs font-semibold shadow-sm`}
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save & Persist via Backend
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
