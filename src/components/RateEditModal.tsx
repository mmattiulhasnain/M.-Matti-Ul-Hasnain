import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, X, Check, TrendingUp, Sparkles, Loader2, Key, 
  AlertCircle, Eye, EyeOff, ShieldCheck, Briefcase, Calculator,
  FileText, Plus, BadgePercent, Clock, Calendar, CheckCircle2
} from 'lucide-react';
import { Candidate, CompensationType, EmploymentType } from '../types';
import { ThemeConfig } from '../theme';
import { updateCandidateWithBackend } from '../services/candidateService';

interface RateEditModalProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  userEmail?: string;
  onUpdated?: (updated: Candidate) => void;
}

const COMMON_CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'PKR', symbol: '₨', label: 'PKR (₨)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD ($)' },
  { code: 'AUD', symbol: 'AU$', label: 'AUD ($)' },
  { code: 'AED', symbol: 'AED', label: 'AED' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'SGD', symbol: 'SG$', label: 'SGD ($)' },
];

const COMPENSATION_TYPES: { type: CompensationType; label: string; periodLabel: string; icon: string }[] = [
  { type: 'Hourly', label: 'Hourly Rate', periodLabel: '/hr', icon: '🕒' },
  { type: 'Monthly Salary', label: 'Monthly Salary', periodLabel: '/mo', icon: '📅' },
  { type: 'Annual Package', label: 'Annual Package', periodLabel: '/yr', icon: '🏛️' },
  { type: 'Daily Rate', label: 'Daily Rate', periodLabel: '/day', icon: '☀️' },
  { type: 'Project / Contract', label: 'Project / Contract', periodLabel: '/project', icon: '🤝' },
  { type: 'Custom / Negotiable', label: 'Custom / Negotiable', periodLabel: '', icon: '💬' },
];

const EMPLOYMENT_TYPES: EmploymentType[] = [
  'Full-time',
  'Part-time',
  'Contract / Freelance',
  'C2C / 1099',
  'Flexible'
];

const PERK_OPTIONS = [
  'Health Insurance',
  'Remote Stipend',
  'Performance Bonus',
  'Equity / Stock Options',
  'Equipment / Hardware Stipend',
  'Paid Time Off (PTO)',
  'Flexible Hours'
];

export const RateEditModal: React.FC<RateEditModalProps> = ({
  candidate,
  isOpen,
  onClose,
  theme,
  userEmail,
  onUpdated
}) => {
  if (!isOpen || !candidate) return null;

  // Compensation fields customized per candidate (no hardcoded defaults)
  const [compensationType, setCompensationType] = useState<CompensationType>(
    candidate.compensationType || (candidate.hourlyRate ? 'Hourly' : candidate.salaryExpectation ? 'Monthly Salary' : 'Monthly Salary')
  );
  const [currency, setCurrency] = useState<string>(candidate.currency || 'USD');
  const [customCurrencyInput, setCustomCurrencyInput] = useState<string>('');
  const [isCustomCurrency, setIsCustomCurrency] = useState<boolean>(
    Boolean(candidate.currency && !COMMON_CURRENCIES.some(c => c.code === candidate.currency))
  );

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
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>(candidate.benefits || []);
  const [seniority, setSeniority] = useState<string>(candidate.seniority || 'Mid');

  // Password Verification State
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeCurrencyCode = isCustomCurrency ? (customCurrencyInput.trim() || 'USD') : currency;
  const activeCurrencyObj = COMMON_CURRENCIES.find(c => c.code === activeCurrencyCode);
  const activeSymbol = activeCurrencyObj?.symbol || activeCurrencyCode;

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits(prev => 
      prev.includes(benefit) ? prev.filter(b => b !== benefit) : [...prev, benefit]
    );
  };

  // Explicit helper conversion - only applied if the user clicks it deliberately, never forced
  const handleOptionalQuickConvert = () => {
    if (hourlyRate && !salaryExpectation) {
      const h = Number(hourlyRate);
      if (!isNaN(h) && h > 0) {
        setSalaryExpectation(String(Math.round(h * 160)));
      }
    } else if (salaryExpectation && !hourlyRate) {
      const s = Number(salaryExpectation);
      if (!isNaN(s) && s > 0) {
        setHourlyRate(String(Math.round((s / 160) * 10) / 10));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password.trim()) {
      setErrorMessage("Please enter authorization password (MIHORAtlnt@1) to save rates to the database.");
      return;
    }

    setIsSaving(true);
    try {
      const updates: Partial<Candidate> = {
        compensationType,
        currency: activeCurrencyCode,
        hourlyRate: hourlyRate.trim() ? Number(hourlyRate) : undefined,
        salaryExpectation: salaryExpectation.trim() ? Number(salaryExpectation) : undefined,
        minSalary: minSalary.trim() ? Number(minSalary) : undefined,
        employmentType: (employmentType || undefined) as any,
        compensationNotes: compensationNotes.trim() || undefined,
        benefits: selectedBenefits.length > 0 ? selectedBenefits : undefined,
        seniority: seniority as any,
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail || "Authorized Recruiter"
      };

      const updatedRecord = await updateCandidateWithBackend(
        candidate.id, 
        updates, 
        password.trim(), 
        userEmail
      );

      if (onUpdated) {
        onUpdated(updatedRecord);
      }
      setIsSaving(false);
      onClose();
    } catch (err: any) {
      console.error("Backend error saving customized rates:", err);
      setErrorMessage(err.message || "Failed to update compensation. Check authorization password.");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`w-full max-w-2xl max-h-[92vh] ${theme.bgCard} ${theme.border} border rounded-3xl shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Modal Header */}
        <div className={`p-5 sm:p-6 border-b ${theme.border} flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-bold ${theme.textPrimary}`}>Customize Compensation Profile</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Database Synced
                </span>
              </div>
              <p className={`text-xs ${theme.textSecondary}`}>
                Personalized salary & rate terms for <span className="font-bold text-slate-900 dark:text-white">{candidate.name}</span> ({candidate.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl hover:bg-slate-500/10 ${theme.textMuted} hover:${theme.textPrimary} transition-colors`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5 custom-scrollbar">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {/* Admin Password Bar */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">
                  Admin Authorization Required
                </span>
              </div>
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
                Authorized key: <span className="font-mono font-bold">MIHORAtlnt@1</span>
              </p>
            </div>
            <div className="relative w-full sm:w-60">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter MIHORAtlnt@1"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                className={`w-full pl-3 pr-8 py-1.5 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 1. Compensation Structure (Varies Person to Person) */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-2`}>
              1. Compensation Model (Person-Specific)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMPENSATION_TYPES.map(item => {
                const isSelected = compensationType === item.type;
                return (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() => setCompensationType(item.type)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                        : `${theme.border} ${theme.bgCard} ${theme.textSecondary} hover:border-slate-400 hover:${theme.textPrimary}`
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs leading-tight truncate">{item.label}</div>
                      <div className="text-[10px] opacity-70">{item.periodLabel || 'Flexible'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Currency Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>
                2. Currency (Varies by Location & Candidate)
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCurrency(!isCustomCurrency)}
                className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                {isCustomCurrency ? 'Select from list' : '+ Enter custom currency'}
              </button>
            </div>

            {!isCustomCurrency ? (
              <div className="flex flex-wrap gap-1.5">
                {COMMON_CURRENCIES.map(curr => (
                  <button
                    type="button"
                    key={curr.code}
                    onClick={() => setCurrency(curr.code)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                      currency === curr.code
                        ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                        : `${theme.border} ${theme.bgCard} ${theme.textSecondary} hover:${theme.textPrimary}`
                    }`}
                  >
                    {curr.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. SAR, CHF, BRL, AED, SGD..."
                  value={customCurrencyInput}
                  onChange={(e) => setCustomCurrencyInput(e.target.value.toUpperCase())}
                  className={`w-full max-w-xs px-3.5 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-xs font-bold focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                <span className="text-xs font-mono text-teal-500 font-bold">
                  Active: {customCurrencyInput || 'USD'}
                </span>
              </div>
            )}
          </div>

          {/* 3. Exact Compensation Values (Independent & Customizable) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Monthly / Main Salary */}
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Target Salary ({activeCurrencyCode})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {activeSymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  max="10000000"
                  placeholder="e.g. 4500"
                  value={salaryExpectation}
                  onChange={(e) => setSalaryExpectation(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Desired monthly / base expectation</p>
            </div>

            {/* Hourly Rate */}
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Hourly Rate ({activeCurrencyCode}/hr)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {activeSymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  placeholder="e.g. 35"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">For contract or hourly billings</p>
            </div>

            {/* Minimum Floor */}
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Minimum Floor ({activeCurrencyCode})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {activeSymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  max="10000000"
                  placeholder="e.g. 3800"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Non-negotiable minimum baseline</p>
            </div>
          </div>

          {/* Optional Conversion Helper */}
          {(hourlyRate && !salaryExpectation) || (salaryExpectation && !hourlyRate) ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10 text-xs">
              <span className={theme.textSecondary}>
                Want to calculate standard 160h/mo equivalent?
              </span>
              <button
                type="button"
                onClick={handleOptionalQuickConvert}
                className="flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculate Match</span>
              </button>
            </div>
          ) : null}

          {/* 4. Employment Type & Seniority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Employment Arrangement
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EMPLOYMENT_TYPES.map(type => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => setEmploymentType(type)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      employmentType === type
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
                        : `${theme.border} ${theme.bgCard} ${theme.textSecondary} hover:${theme.textPrimary}`
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
                Seniority Level
              </label>
              <div className="grid grid-cols-4 gap-1">
                {['Junior', 'Mid', 'Senior', 'Lead/Principal'].map((lvl) => (
                  <button
                    type="button"
                    key={lvl}
                    onClick={() => setSeniority(lvl)}
                    className={`py-1.5 px-1 text-[11px] font-bold rounded-lg border transition-all text-center ${
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
          </div>

          {/* 5. Custom Perks & Benefits (Specific to this person) */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
              Negotiated Benefits & Perks
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PERK_OPTIONS.map(perk => {
                const hasPerk = selectedBenefits.includes(perk);
                return (
                  <button
                    type="button"
                    key={perk}
                    onClick={() => toggleBenefit(perk)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                      hasPerk
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold'
                        : `${theme.border} ${theme.bgCard} ${theme.textSecondary} hover:${theme.textPrimary}`
                    }`}
                  >
                    {hasPerk && <CheckCircle2 className="w-3 h-3" />}
                    <span>{perk}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Custom Compensation Notes */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted} block mb-1.5`}>
              Person-Specific Compensation Notes & Terms
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Open to negotiation based on equity, requires laptop allowance, willing to adjust for 32h/week, 1-month notice period..."
              value={compensationNotes}
              onChange={(e) => setCompensationNotes(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border ${theme.border} ${theme.bgCard} ${theme.textPrimary} text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>

          {/* Live Profile Compensation Summary Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Live Candidate Compensation Card
              </span>
              <span className="text-[10px] font-mono text-slate-500">ID: {candidate.id}</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className={`text-lg font-extrabold ${theme.textPrimary}`}>
                {salaryExpectation && Number(salaryExpectation) > 0
                  ? `${activeSymbol} ${Number(salaryExpectation).toLocaleString()} / mo`
                  : hourlyRate && Number(hourlyRate) > 0
                    ? `${activeSymbol} ${Number(hourlyRate).toLocaleString()} / hr`
                    : 'Custom / Flexible Terms'}
              </span>
              {hourlyRate && salaryExpectation && Number(hourlyRate) > 0 && (
                <span className={`text-xs ${theme.textSecondary}`}>
                  ({activeSymbol} {Number(hourlyRate)}/hr billable)
                </span>
              )}
              {minSalary && Number(minSalary) > 0 && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  • Floor: {activeSymbol} {Number(minSalary).toLocaleString()}
                </span>
              )}
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-700 dark:text-slate-300">
                {activeCurrencyCode}
              </span>
              {employmentType && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {employmentType}
                </span>
              )}
            </div>
            {compensationNotes && (
              <p className="text-[11px] italic text-slate-500 mt-1 line-clamp-2">
                "{compensationNotes}"
              </p>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-500/10 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Saves directly to Firestore & Server Database</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl ${theme.btnSecondary} text-xs font-semibold`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl ${theme.btnPrimary} text-xs font-bold shadow-md`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Customized Rates
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
