import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Download, ChevronDown, Check, X, ArrowUpDown, ExternalLink, 
  FileText, Plus, Loader2, LogOut, Trash2, Sun, Moon, Compass,
  Search, Filter, Users, Code, Cpu, Headphones, Palette, Sparkles,
  Briefcase, MapPin, Mail, Phone, Layers, CheckCircle2, AlertCircle, 
  Info, BarChart3, Globe2, DollarSign, Award, Paperclip, Cloud,
  RefreshCw, FileCheck, Pencil, Lock, ShieldCheck
} from 'lucide-react';
import { auth, loginWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { THEME_CONFIGS, ThemeMode } from './theme';
import { Candidate } from './types';
import { 
  subscribeToCandidates, 
  addCandidateToFirestore, 
  bulkDeleteCandidatesFromFirestore,
  enrichCandidate,
  syncDatabaseWithSeedRecords 
} from './services/candidateService';
import { TalentAnalyticsDashboard } from './components/TalentAnalyticsDashboard';
import { CandidatePipelineDashboard } from './components/CandidatePipelineDashboard';
import { CandidateDocumentModal } from './components/CandidateDocumentModal';
import { RateEditModal } from './components/RateEditModal';
import { CandidateEditModal } from './components/CandidateEditModal';
import { SecurityShieldModal } from './components/SecurityShieldModal';
import { formatPhoneNumber, parseSeniority, parseLocation, isSafeUrl, sanitizeInputText } from './utils';
import { logoBase64 } from './logoBase64';

const ALLOWED_EMAILS = [
  'animeexploredbest@gmail.com',
  'bc240412496mmu@vu.edu.pk',
  'm.mattiulhasnain@gmail.com',
  'muhium.mujeedi@gmail.com',
  'mihora.tech@gmail.com',
  'mmattiulhasnain@gmail.com',
  'mihoratech@gmail.com'
];

// Helper component for multi-select dropdowns
function FilterDropdown({ 
  title, 
  options, 
  selected, 
  toggleOption, 
  clearOptions,
  theme 
}: { 
  title: string, 
  options: string[], 
  selected: string[], 
  toggleOption: (val: string) => void, 
  clearOptions: () => void,
  theme: typeof THEME_CONFIGS['light']
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <motion.button 
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2.5 ${theme.bgCard} ${theme.border} border px-3.5 py-2 rounded-xl text-sm transition-all shadow-sm min-w-[140px] whitespace-nowrap`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className={theme.textMuted}>{title}:</span>
          <span className={`font-semibold truncate ${selected.length > 0 ? theme.textAccent : theme.textPrimary}`}>
            {selected.length === 0 ? 'All' : `${selected.length} Selected`}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <motion.div 
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              className={`p-0.5 rounded-md hover:bg-slate-500/20 ${theme.textMuted} hover:${theme.textPrimary}`}
              onClick={(e) => { e.stopPropagation(); clearOptions(); setIsOpen(false); }}
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </motion.div>
          )}
          <ChevronDown className={`w-4 h-4 ${theme.textMuted} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </motion.button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-64 max-h-72 overflow-y-auto ${theme.bgDropdown} ${theme.border} border rounded-2xl z-50 p-2 custom-scrollbar`}
          >
            {options.map(opt => {
              const isSelected = selected.includes(opt);
              return (
                <motion.div 
                  key={opt} 
                  whileHover={{ x: 2 }}
                  onClick={() => toggleOption(opt)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer text-sm transition-colors ${isSelected ? 'bg-indigo-500/10' : 'hover:bg-slate-500/10'}`}
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${isSelected ? theme.checkboxChecked : theme.checkboxUnchecked}`}>
                    {isSelected && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </motion.div>
                    )}
                  </div>
                  <span className={`truncate select-none font-medium ${isSelected ? theme.textAccent : theme.textPrimary}`} title={opt}>{opt}</span>
                </motion.div>
              );
            })}
            {options.length === 0 && (
              <div className={`p-4 text-center ${theme.textMuted} text-sm font-medium`}>No options found</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Theme Switcher Component
function ThemeSwitcher({ themeMode, setThemeMode, theme }: { themeMode: ThemeMode, setThemeMode: (m: ThemeMode) => void, theme: typeof THEME_CONFIGS['light'] }) {
  const themes: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'desert', label: 'Desert', icon: <Compass className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className={`flex items-center p-1 rounded-xl border ${theme.border} ${theme.bgCard} shadow-inner`}>
      {themes.map(t => {
        const isActive = themeMode === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setThemeMode(t.id)}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all z-10 ${isActive ? theme.textAccent : theme.textMuted}`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {isActive && (
              <motion.div
                layoutId="activeThemePill"
                className={`absolute inset-0 rounded-lg ${theme.badgePrimary} border shadow-sm z-[-1]`}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('talent_db_theme') as ThemeMode) || 'light';
  });

  const theme = THEME_CONFIGS[themeMode] || THEME_CONFIGS.light;

  useEffect(() => {
    localStorage.setItem('talent_db_theme', themeMode);
  }, [themeMode]);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Navigation View Mode: Directory Table vs Talent Analytics vs Pipeline
  const [viewMode, setViewMode] = useState<'table' | 'analytics' | 'pipeline'>('table');

  // Candidate records from Firestore
  const [records, setRecords] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedSeniority, setSelectedSeniority] = useState<string[]>([]);
  const [selectedTimezones, setSelectedTimezones] = useState<string[]>([]);
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDocCandidate, setSelectedDocCandidate] = useState<Candidate | null>(null);
  const [selectedRateCandidate, setSelectedRateCandidate] = useState<Candidate | null>(null);
  const [selectedEditCandidate, setSelectedEditCandidate] = useState<Candidate | null>(null);

  // Add Candidate Form
  const [formData, setFormData] = useState<{
    name: string;
    role: string;
    skills: string;
    experience: string;
    seniority: string;
    specialization: string;
    location: string;
    email: string;
    whatsapp: string;
    portfolio: string;
    cv: string;
    hourlyRate?: number;
    salaryExpectation?: number;
    minSalary?: number;
    currency?: string;
    compensationType?: string;
    employmentType?: string;
    compensationNotes?: string;
    cvFileName: string;
    cvFileType: string;
    cvFileData: string;
  }>({
    name: '',
    role: '',
    skills: '',
    experience: '',
    seniority: 'Mid',
    specialization: '',
    location: '',
    email: '',
    whatsapp: '',
    portfolio: '',
    cv: '',
    hourlyRate: undefined,
    salaryExpectation: undefined,
    minSalary: undefined,
    currency: 'USD',
    compensationType: 'Monthly Salary',
    employmentType: 'Full-time',
    compensationNotes: '',
    cvFileName: '',
    cvFileType: '',
    cvFileData: ''
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);

  // Toast Notification state
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'danger' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'danger' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const handleSyncDatabase = async () => {
    setIsSyncing(true);
    try {
      const count = await syncDatabaseWithSeedRecords();
      showToast(`Database synchronized! All ${count} verified candidates loaded into Firestore and server backend.`, 'success');
    } catch (err: any) {
      console.error("Database sync error:", err);
      const msg = err?.message || 'Failed to update database';
      if (msg.includes('WriteBatch.set()') || msg.includes('undefined')) {
        showToast('Browser cache detected! Please hard-refresh your browser (Ctrl+Shift+R or Cmd+Shift+R) to load the new sync engine.', 'danger');
      } else {
        showToast(`Sync error: ${msg}`, 'danger');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-Time Cloud Firestore Multi-User Synchronization
  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    // Subscribe to Firestore 'candidates' collection with real-time updates
    const unsubscribe = subscribeToCandidates(
      (liveCandidates) => {
        setRecords(liveCandidates);
        setIsLoading(false);
        setIsFirestoreConnected(true);
      },
      (err) => {
        console.error("Firestore sync error, loading backup from server", err);
        setIsFirestoreConnected(false);
        fetch('/api/records')
          .then(res => res.json())
          .then(data => {
            setRecords(data.map(enrichCandidate));
            setIsLoading(false);
          })
          .catch(() => setIsLoading(false));
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Derived filter options
  const uniqueSkills = useMemo(() => {
    const skills = new Set<string>();
    records.forEach(r => {
      if (r.skills) {
        r.skills.split(',').forEach(s => {
          const clean = s.trim().replace(/^and\s+/i, '');
          if (clean) skills.add(clean);
        });
      }
    });
    return Array.from(skills).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [records]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    records.forEach(r => { if (r.role) roles.add(r.role.trim()); });
    return Array.from(roles).filter(Boolean).sort();
  }, [records]);

  const uniqueExperience = useMemo(() => {
    const exps = new Set<string>();
    records.forEach(r => { if (r.experience) exps.add(r.experience.trim()); });
    return Array.from(exps).filter(Boolean).sort();
  }, [records]);
  
  const uniqueTimezones = useMemo(() => {
    const tzs = new Set<string>();
    records.forEach(r => { 
      if (r.preferredTimezones) {
        r.preferredTimezones.forEach(tz => tzs.add(tz));
      }
    });
    return Array.from(tzs).filter(Boolean).sort();
  }, [records]);

  // Filtering Logic
  const filteredRecords = records.filter(record => {
    const matchesSearch = Object.values(record).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const recordSkills = record.skills ? record.skills.toLowerCase() : '';
    const matchesSkills = selectedSkills.length === 0 || selectedSkills.every(skill => 
      recordSkills.includes(skill.toLowerCase())
    );

    const matchesRole = selectedRoles.length === 0 || (record.role && selectedRoles.includes(record.role.trim()));
    const matchesExp = selectedExperience.length === 0 || (record.experience && selectedExperience.includes(record.experience.trim()));
    const matchesSeniority = selectedSeniority.length === 0 || (record.seniority && selectedSeniority.includes(record.seniority));
    const matchesTimezone = selectedTimezones.length === 0 || (record.preferredTimezones && record.preferredTimezones.some(tz => selectedTimezones.includes(tz)));

    return matchesSearch && matchesSkills && matchesRole && matchesExp && matchesSeniority && matchesTimezone;
  });

  // Sorting Logic
  const sortedRecords = useMemo(() => {
    let sortable = [...filteredRecords];
    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        if (sortConfig.key === 'hourlyRate') {
          const aRate = a.hourlyRate || 0;
          const bRate = b.hourlyRate || 0;
          return sortConfig.direction === 'asc' ? aRate - bRate : bRate - aRate;
        }

        const aValue = String((a as any)[sortConfig.key] || '').toLowerCase();
        const bValue = String((b as any)[sortConfig.key] || '').toLowerCase();
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredRecords, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleRow = (id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleAllRows = () => {
    if (selectedRows.size === sortedRecords.length && sortedRecords.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(sortedRecords.map(r => r.id)));
    }
  };

  // Toggle Filters
  const toggleSkill = (skill: string) => setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  const toggleRole = (role: string) => setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  const toggleExperience = (exp: string) => setSelectedExperience(prev => prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]);

  const clearAllFilters = () => {
    setSelectedSkills([]);
    setSelectedRoles([]);
    setSelectedExperience([]);
    setSelectedSeniority([]);
    setSelectedTimezones([]);
    setSearchTerm('');
  };

  // Role summary stats
  const roleStats = useMemo(() => {
    let designers = 0;
    let developers = 0;
    let engineers = 0;
    let itSupport = 0;

    filteredRecords.forEach(r => {
      const role = (r.role || '').toLowerCase();
      if (role.includes('design') || role.includes('ui')) {
        designers++;
      } else if (role.includes('develop')) {
        developers++;
      } else if (role.includes('engineer')) {
        engineers++;
      } else {
        itSupport++;
      }
    });

    return [
      { label: 'Total Sourced', count: filteredRecords.length, icon: <Users className="w-4 h-4 text-indigo-500" />, color: theme.textAccent },
      { label: 'Designers', count: designers, icon: <Palette className="w-4 h-4 text-pink-500" />, color: 'text-pink-500' },
      { label: 'Developers', count: developers, icon: <Code className="w-4 h-4 text-teal-500" />, color: 'text-teal-500' },
      { label: 'Engineers', count: engineers, icon: <Cpu className="w-4 h-4 text-amber-500" />, color: 'text-amber-500' },
      { label: 'IT Support', count: itSupport, icon: <Headphones className="w-4 h-4 text-emerald-500" />, color: 'text-emerald-500' },
    ];
  }, [filteredRecords, theme]);

  // Bulk Delete with Firestore batch sync
  const handleDeleteSelected = async () => {
    if (selectedRows.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedRows.size} record(s) from Cloud Firestore?`)) return;
    
    const count = selectedRows.size;
    setIsLoading(true);
    try {
      await bulkDeleteCandidatesFromFirestore(Array.from(selectedRows));
      setSelectedRows(new Set());
      showToast(`Deleted ${count} candidate(s) from Cloud Firestore.`, 'danger');
    } catch (err) {
      console.error("Failed to delete records", err);
      showToast('Failed to delete selected records.', 'danger');
    }
    setIsLoading(false);
  };

  // Add Candidate to Firestore
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const highestId = records.reduce((max, r) => {
      const match = r.id.match(/ID-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    
    const newId = `ID-${String(highestId + 1).padStart(3, '0')}`;
    const newCandidate: Partial<Candidate> = {
      id: newId,
      name: sanitizeInputText(formData.name, 150),
      role: sanitizeInputText(formData.role, 150),
      skills: sanitizeInputText(formData.skills, 500),
      experience: sanitizeInputText(formData.experience, 100),
      seniority: formData.seniority,
      specialization: sanitizeInputText(formData.specialization, 150),
      location: sanitizeInputText(formData.location, 150),
      email: sanitizeInputText(formData.email, 150),
      whatsapp: sanitizeInputText(formData.whatsapp, 50),
      portfolio: isSafeUrl(formData.portfolio) ? formData.portfolio : '',
      cv: isSafeUrl(formData.cv) ? formData.cv : '',
      currency: formData.currency?.trim() || 'USD',
      compensationType: (formData.compensationType || 'Monthly Salary') as any,
      hourlyRate: typeof formData.hourlyRate === 'number' ? formData.hourlyRate : undefined,
      salaryExpectation: typeof formData.salaryExpectation === 'number' ? formData.salaryExpectation : undefined,
      minSalary: typeof formData.minSalary === 'number' ? formData.minSalary : undefined,
      employmentType: (formData.employmentType || undefined) as any,
      compensationNotes: formData.compensationNotes?.trim() || undefined,
      cvFileName: formData.cvFileName ? sanitizeInputText(formData.cvFileName, 150) : '',
      cvFileType: formData.cvFileType || '',
      cvFileData: formData.cvFileData || ''
    };
    
    try {
      await addCandidateToFirestore(newCandidate, user?.email || undefined);
      setIsAddModalOpen(false);
      setFormData({ 
        name: '', role: '', skills: '', experience: '', seniority: 'Mid',
        specialization: '', location: '', email: '', whatsapp: '', portfolio: '', cv: '',
        hourlyRate: undefined, salaryExpectation: undefined, minSalary: undefined,
        currency: 'USD', compensationType: 'Monthly Salary', employmentType: 'Full-time',
        compensationNotes: '', cvFileName: '', cvFileType: '', cvFileData: ''
      });
      showToast(`Added candidate "${formData.name}" to Cloud Firestore!`, 'success');
    } catch (err) {
      console.error("Failed to add candidate", err);
      showToast('Error saving candidate to Firestore.', 'danger');
    }
  };

  // Export to Excel
  const handleExportCSV = () => {
    const dataToExport = selectedRows.size > 0 
      ? records.filter(r => selectedRows.has(r.id)) 
      : sortedRecords;
      
    if (dataToExport.length === 0) {
      showToast('No records available to export.', 'danger');
      return;
    }

    const exportRows = dataToExport.map(r => ({
      'ID': r.id,
      'Name': r.name,
      'Role': r.role,
      'Seniority': r.seniority || parseSeniority(r.experience, r.role),
      'Compensation Model': r.compensationType || (r.hourlyRate ? 'Hourly' : r.salaryExpectation ? 'Monthly Salary' : 'Flexible'),
      'Currency': r.currency || 'USD',
      'Target Salary': r.salaryExpectation !== undefined ? r.salaryExpectation : '',
      'Hourly Rate': r.hourlyRate !== undefined ? r.hourlyRate : '',
      'Minimum Floor': r.minSalary !== undefined ? r.minSalary : '',
      'Employment Type': r.employmentType || '',
      'Compensation Notes': r.compensationNotes || '',
      'Location': r.location,
      'Country': r.country || parseLocation(r.location).country,
      'City': r.city || parseLocation(r.location).city,
      'Skills': r.skills,
      'Experience': r.experience,
      'Specialization': r.specialization,
      'Email': r.email,
      'WhatsApp': r.whatsapp,
      'Portfolio': r.portfolio,
      'CV URL': r.cv,
      'Cloud Document': r.cvFileName || (r.cvFileData ? 'Attached' : 'None')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Talent Roster');
    XLSX.writeFile(workbook, `mihora_talent_database_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast(`Exported ${exportRows.length} candidates to Excel.`, 'success');
  };

  const handleExportJSON = () => {
    const dataToExport = records;
    if (dataToExport.length === 0) {
      showToast('No records available to backup.', 'danger');
      return;
    }
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mihora_talent_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Backed up ${dataToExport.length} candidates to JSON.`, 'success');
  };

  // Analytics drill-down actions
  const handleFilterByCountryFromAnalytics = (country: string) => {
    setSearchTerm(country);
    setViewMode('table');
    showToast(`Filtered by country: ${country}`, 'info');
  };

  const handleFilterBySkillFromAnalytics = (skill: string) => {
    toggleSkill(skill);
    setViewMode('table');
    showToast(`Filtered by skill: ${skill}`, 'info');
  };

  const handleFilterBySeniorityFromAnalytics = (seniority: string) => {
    setSelectedSeniority(prev => prev.includes(seniority) ? prev.filter(s => s !== seniority) : [...prev, seniority]);
    setViewMode('table');
    showToast(`Filtered by seniority: ${seniority}`, 'info');
  };

  // Loading Screen
  if (authLoading || (isLoading && user && records.length === 0)) {
    return (
      <div className={`h-screen w-screen ${theme.bgMain} flex flex-col items-center justify-center font-sans transition-colors duration-500`}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        >
          <Loader2 className={`w-10 h-10 ${theme.textAccent}`} />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className={`mt-4 text-sm font-medium ${theme.textSecondary}`}
        >
          Connecting to Cloud Firestore & Talent Roster...
        </motion.p>
      </div>
    );
  }

  // Unauthenticated Screen
  if (!user) {
    return (
      <div className={`min-h-screen w-full ${theme.bgMain} relative flex items-center justify-center font-sans ${theme.textPrimary} overflow-hidden transition-colors duration-500`}>
        {/* Animated Background Orbs */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br ${theme.ambientOrb1} rounded-full blur-3xl pointer-events-none`}
        />
        <motion.div 
          animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-br ${theme.ambientOrb2} rounded-full blur-3xl pointer-events-none`}
        />

        <div className="absolute top-6 right-6 z-20">
          <ThemeSwitcher themeMode={themeMode} setThemeMode={setThemeMode} theme={theme} />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 25, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`relative z-10 ${theme.bgCard} ${theme.border} border p-8 sm:p-12 rounded-3xl max-w-md w-full mx-4 shadow-2xl flex flex-col items-center text-center`}
        >
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl mb-6 overflow-hidden border-2 ${theme.border}`}
          >
            <img src={logoBase64} alt="MIHORA Tech Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`text-3xl font-extrabold tracking-tight ${theme.textPrimary} mb-3`}
          >
            MIHORA Tech Talent Database
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`${theme.textSecondary} mb-8 text-sm leading-relaxed`}
          >
            Sign in securely to access candidate profiles and interactive talent analytics.
          </motion.p>
          
          <motion.button 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={loginWithGoogle}
            className={`w-full flex items-center justify-center gap-3 ${theme.bgCard} ${theme.border} border ${theme.textPrimary} hover:bg-slate-500/10 px-6 py-4 rounded-2xl font-semibold transition-all shadow-md hover:shadow-lg`}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Email Access Check (Authorized Roster)
  const isAllowed = Boolean(user.email && ALLOWED_EMAILS.includes(user.email.toLowerCase()));
  if (!isAllowed) {
    return (
      <div className={`min-h-screen w-full ${theme.bgMain} relative flex flex-col items-center justify-center font-sans ${theme.textPrimary} p-4 transition-colors duration-500`}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${theme.bgCard} ${theme.border} border p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center text-center`}
        >
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shadow-lg mb-6 border border-red-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className={`text-2xl font-bold tracking-tight ${theme.textPrimary} mb-2`}>Access Restricted</h1>
          <p className={`${theme.textSecondary} mb-6 text-sm leading-relaxed`}>
            Your account (<span className="font-semibold">{user.email}</span>) is pending authorization for the MIHORA Tech Talent Database.
          </p>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className={`w-full flex items-center justify-center gap-2 ${theme.btnSecondary} px-6 py-3 rounded-xl font-semibold transition-all shadow-sm`}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const hasActiveFilters = selectedSkills.length > 0 || selectedRoles.length > 0 || selectedExperience.length > 0 || selectedSeniority.length > 0 || selectedTimezones.length > 0 || searchTerm !== '';

  return (
    <div className={`min-h-screen w-full ${theme.bgMain} relative flex flex-col font-sans transition-colors duration-500 overflow-x-hidden`}>
      {/* Background Animated Ambient Orbs */}
      <motion.div 
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className={`fixed -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br ${theme.ambientOrb1} rounded-full blur-3xl pointer-events-none z-0`}
      />
      <motion.div 
        animate={{ opacity: [0.2, 0.35, 0.2], scale: [1, 1.15, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className={`fixed -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br ${theme.ambientOrb2} rounded-full blur-3xl pointer-events-none z-0`}
      />

      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {/* Header */}
        <header className={`flex flex-col lg:flex-row items-center justify-between px-4 sm:px-8 py-3.5 ${theme.bgHeader} ${theme.border} border-b sticky top-0 z-40 gap-4 transition-colors duration-300 backdrop-blur-md`}>
          <div className="flex items-center justify-between w-full lg:w-auto gap-4">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 12, scale: 1.05 }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shrink-0 overflow-hidden border-2 ${theme.border}`}
              >
                <img src={logoBase64} alt="MIHORA Tech Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className={`text-xl font-bold tracking-tight ${theme.textPrimary}`}>MIHORA Tech Talent Database</h1>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Real-Time Sync
                  </span>
                </div>
                <p className={`text-xs ${theme.textSecondary} hidden sm:block`}>
                  Multi-user candidate intelligence with document storage
                </p>
              </div>
            </div>

            {/* View Switcher Pill: Table vs Analytics vs Pipeline */}
            <div className={`flex items-center p-1 rounded-xl border ${theme.border} ${theme.bgCard} shadow-inner`}>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? `${theme.btnPrimary} shadow-sm` : `${theme.textSecondary} hover:${theme.textPrimary}`
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Directory</span>
              </button>
              <button
                onClick={() => setViewMode('pipeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'pipeline' ? `${theme.btnPrimary} shadow-sm` : `${theme.textSecondary} hover:${theme.textPrimary}`
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Pipeline</span>
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'analytics' ? `${theme.btnPrimary} shadow-sm` : `${theme.textSecondary} hover:${theme.textPrimary}`
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics</span>
                <span className="w-2 h-2 rounded-full bg-teal-400" />
              </button>
            </div>

            {/* Mobile Theme Switcher */}
            <div className="lg:hidden">
              <ThemeSwitcher themeMode={themeMode} setThemeMode={setThemeMode} theme={theme} />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
            {/* Desktop Theme Switcher */}
            <div className="hidden lg:block">
              <ThemeSwitcher themeMode={themeMode} setThemeMode={setThemeMode} theme={theme} />
            </div>

            <div className={`h-6 w-px ${theme.divider} mx-1 hidden lg:block`}></div>

            {/* Delete button */}
            <AnimatePresence>
              {selectedRows.size > 0 && (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
                  title="Delete Selected"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedRows.size})</span>
                </motion.button>
              )}
            </AnimatePresence>

            {/* Sync Database with Seed Records button */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSyncDatabase}
              disabled={isSyncing}
              className={`flex items-center gap-2 ${theme.btnSecondary} px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap`}
              title="Sync Firestore and backend with latest verified candidate dataset"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
              <span className="hidden sm:inline">Sync DB</span>
            </motion.button>

            {/* Security Shield status & audit button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSecurityModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shadow-sm"
              title="Zero-Trust ABAC, Rate-Limiting & Payload Sanitization Shield"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Security Shield</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </motion.button>

            {/* Export CSV button */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportCSV}
              className={`flex items-center gap-2 ${theme.btnSecondary} px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap`}
              title="Export to Excel"
            >
              <Download className="w-4 h-4" /> 
              <span className="hidden sm:inline">Export</span>
            </motion.button>
            
            {/* Backup JSON button */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportJSON}
              className={`flex items-center gap-2 ${theme.btnSecondary} px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap`}
              title="Backup JSON"
            >
              <Download className="w-4 h-4" /> 
              <span className="hidden sm:inline">Backup</span>
            </motion.button>

            {/* Add Record button */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddModalOpen(true)}
              className={`flex items-center gap-2 ${theme.btnPrimary} px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap`}
            >
              <Plus className="w-4 h-4" /> Add Candidate
            </motion.button>

            <div className={`h-6 w-px ${theme.divider} mx-1 hidden sm:block`}></div>

            {/* Filters (only visible when in table mode) */}
            {viewMode === 'table' && (
              <>
                <FilterDropdown title="Role" options={uniqueRoles} selected={selectedRoles} toggleOption={toggleRole} clearOptions={() => setSelectedRoles([])} theme={theme} />
                <FilterDropdown title="Seniority" options={['Junior', 'Mid', 'Senior', 'Lead/Principal']} selected={selectedSeniority} toggleOption={(s) => setSelectedSeniority(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])} clearOptions={() => setSelectedSeniority([])} theme={theme} />
                <FilterDropdown title="Skills" options={uniqueSkills} selected={selectedSkills} toggleOption={toggleSkill} clearOptions={() => setSelectedSkills([])} theme={theme} />
                <FilterDropdown title="Timezones" options={uniqueTimezones} selected={selectedTimezones} toggleOption={(tz) => setSelectedTimezones(prev => prev.includes(tz) ? prev.filter(x => x !== tz) : [...prev, tz])} clearOptions={() => setSelectedTimezones([])} theme={theme} />
                
                {/* Search Box */}
                <div className="relative flex-1 sm:flex-none">
                  <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${theme.textMuted}`} />
                  <input
                    type="text"
                    placeholder="Search candidate, location, skill..."
                    className={`pl-10 pr-8 py-2 ${theme.bgInput} rounded-xl text-sm transition-all w-full sm:w-48 lg:w-56 shadow-sm`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')} 
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.textPrimary}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </>
            )}

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${theme.textSecondary} hidden xl:inline truncate max-w-[120px]`} title={user.email || ''}>
                {user.displayName || user.email?.split('@')[0]}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                title="Sign Out"
                className={`p-2 rounded-xl ${theme.bgCard} ${theme.border} border ${theme.textMuted} hover:${theme.textPrimary} transition-colors shadow-sm`}
              >
                <LogOut className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-col p-4 sm:p-8 flex-1">
          {viewMode === 'analytics' ? (
            <TalentAnalyticsDashboard 
              records={records}
              theme={theme}
              onFilterByCountry={handleFilterByCountryFromAnalytics}
              onFilterBySkill={handleFilterBySkillFromAnalytics}
              onFilterBySeniority={handleFilterBySeniorityFromAnalytics}
            />
          ) : viewMode === 'pipeline' ? (
            <CandidatePipelineDashboard 
              records={records}
              theme={theme}
              onEditCandidate={(candidate) => {
                setSelectedEditCandidate(candidate);
              }}
            />
          ) : (
            /* VIEW: CANDIDATE DIRECTORY TABLE */
            <>
              {/* Summary Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6 shrink-0">
                {roleStats.map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className={`${theme.statCardBg} ${theme.statCardBorder} border p-4 rounded-2xl transition-all flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.textMuted}`}>{stat.label}</span>
                      <div className={`p-1.5 rounded-lg bg-slate-500/10`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-extrabold tracking-tight ${stat.color}`}>{stat.count}</span>
                      <span className={`text-xs ${theme.textMuted} font-medium`}>candidates</span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Active Filter Chips Bar */}
              <AnimatePresence>
                {hasActiveFilters && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className={`flex flex-wrap items-center gap-2 p-3 ${theme.bgCard} ${theme.border} border rounded-2xl text-xs overflow-hidden`}
                  >
                    <span className={`font-semibold ${theme.textMuted} flex items-center gap-1.5 pl-1`}>
                      <Filter className="w-3.5 h-3.5" /> Active Filters:
                    </span>

                    {searchTerm && (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${theme.badgePrimary} border font-medium`}>
                        Search: "{searchTerm}"
                        <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setSearchTerm('')} />
                      </span>
                    )}

                    {selectedRoles.map(role => (
                      <span key={role} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${theme.badgeRole} border font-medium`}>
                        Role: {role}
                        <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => toggleRole(role)} />
                      </span>
                    ))}

                    {selectedSeniority.map(s => (
                      <span key={s} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${theme.badgePrimary} border font-medium`}>
                        Seniority: {s}
                        <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setSelectedSeniority(prev => prev.filter(x => x !== s))} />
                      </span>
                    ))}

                    {selectedSkills.map(skill => (
                      <span key={skill} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${theme.badgeRole} border font-medium`}>
                        Skill: {skill}
                        <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => toggleSkill(skill)} />
                      </span>
                    ))}

                    {selectedTimezones.map(tz => (
                      <span key={tz} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${theme.badgePrimary} border font-medium`}>
                        Timezone: {tz}
                        <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setSelectedTimezones(prev => prev.filter(x => x !== tz))} />
                      </span>
                    ))}

                    <button 
                      onClick={clearAllFilters}
                      className={`ml-auto font-semibold ${theme.textAccent} hover:underline px-2 py-0.5`}
                    >
                      Clear All
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Table Container */}
              <section className={`flex flex-col relative ${theme.bgCard} ${theme.border} border rounded-2xl shadow-xl overflow-hidden flex-1`}>
                <div className="w-full overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className={`${theme.bgTableHead} text-[11px] font-bold uppercase tracking-wider ${theme.border} border-b select-none`}>
                      <tr>
                        <th className="p-4 w-12">
                          <div 
                            onClick={toggleAllRows}
                            className={`w-4 h-4 rounded-md border flex items-center justify-center cursor-pointer transition-all ${selectedRows.size > 0 && selectedRows.size === sortedRecords.length ? theme.checkboxChecked : theme.checkboxUnchecked}`}
                          >
                            {selectedRows.size > 0 && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                <Check className="w-3 h-3 stroke-[3]" />
                              </motion.div>
                            )}
                          </div>
                        </th>
                        <th className={`p-4 font-bold whitespace-nowrap cursor-pointer hover:${theme.textPrimary} group transition-colors`} onClick={() => requestSort('id')}>
                          <div className="flex items-center gap-1.5">
                            ID 
                            <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig?.key === 'id' ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
                          </div>
                        </th>
                        <th className={`p-4 font-bold whitespace-nowrap cursor-pointer hover:${theme.textPrimary} group transition-colors`} onClick={() => requestSort('name')}>
                          <div className="flex items-center gap-1.5">
                            Candidate 
                            <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig?.key === 'name' ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
                          </div>
                        </th>
                        <th className={`p-4 font-bold whitespace-nowrap cursor-pointer hover:${theme.textPrimary} group transition-colors`} onClick={() => requestSort('role')}>
                          <div className="flex items-center gap-1.5">
                            Role & Seniority
                            <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig?.key === 'role' ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
                          </div>
                        </th>
                        <th className={`p-4 font-bold whitespace-nowrap cursor-pointer hover:${theme.textPrimary} group transition-colors`} onClick={() => requestSort('hourlyRate')}>
                          <div className="flex items-center gap-1.5">
                            Rate / Salary
                            <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig?.key === 'hourlyRate' ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
                          </div>
                        </th>
                        <th className={`p-4 font-bold whitespace-nowrap cursor-pointer hover:${theme.textPrimary} group transition-colors`} onClick={() => requestSort('location')}>
                          <div className="flex items-center gap-1.5">
                            Location 
                            <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortConfig?.key === 'location' ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
                          </div>
                        </th>
                        <th className="p-4 font-bold whitespace-nowrap">Contact & Skills</th>
                        <th className="p-4 font-bold whitespace-nowrap text-right">Actions & Docs</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme.divider}`}>
                      <AnimatePresence mode="popLayout">
                        {sortedRecords.map((record) => {
                          const isSelected = selectedRows.has(record.id);
                          const seniorityTier = record.seniority || parseSeniority(record.experience, record.role);
                          const hasCloudDoc = Boolean(record.cvFileData);

                          return (
                            <motion.tr 
                              key={record.id} 
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ duration: 0.2 }}
                              className={`transition-colors ${isSelected ? theme.bgTableRowSelected : theme.bgTableRowHover}`}
                            >
                              <td className="p-4">
                                <div 
                                  onClick={() => toggleRow(record.id)}
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center cursor-pointer transition-all ${isSelected ? theme.checkboxChecked : theme.checkboxUnchecked}`}
                                >
                                  {isSelected && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </motion.div>
                                  )}
                                </div>
                              </td>
                              <td className={`p-4 font-mono text-xs font-bold ${theme.textAccent}`}>{record.id}</td>
                              <td className="p-4">
                                <div className={`font-semibold ${theme.textPrimary}`}>{record.name}</div>
                                {record.specialization && (
                                  <div className={`${theme.textMuted} text-xs mt-0.5 truncate max-w-[200px]`} title={record.specialization}>
                                    {record.specialization}
                                  </div>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1">
                                  <span className={`inline-block px-2.5 py-0.5 ${theme.badgeRole} text-[11px] font-semibold rounded-lg border w-fit`}>
                                    {record.role || 'Unspecified'}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <span className={`font-semibold ${
                                      seniorityTier === 'Lead/Principal' ? 'text-amber-500' :
                                      seniorityTier === 'Senior' ? 'text-purple-500' :
                                      seniorityTier === 'Mid' ? 'text-blue-500' : 'text-emerald-500'
                                    }`}>
                                      {seniorityTier}
                                    </span>
                                    <span className={theme.textMuted}>• {record.experience || '1 yr'}</span>
                                  </div>
                                </div>
                              </td>
                              {/* Rate & Salary Expectations Column (Customized Per Candidate) */}
                              <td className="p-4">
                                <button
                                  onClick={() => setSelectedRateCandidate(record)}
                                  className="group flex flex-col items-start text-left p-1.5 -m-1.5 rounded-xl hover:bg-slate-500/10 transition-colors"
                                  title="Click to customize candidate compensation (Stored in Database)"
                                >
                                  {(() => {
                                    const curr = record.currency || 'USD';
                                    const sym = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr === 'PKR' ? '₨' : curr === 'CAD' ? 'CA$' : curr === 'AUD' ? 'AU$' : curr === 'INR' ? '₹' : curr;
                                    const hasSalary = record.salaryExpectation !== undefined && record.salaryExpectation !== null && record.salaryExpectation > 0;
                                    const hasHourly = record.hourlyRate !== undefined && record.hourlyRate !== null && record.hourlyRate > 0;
                                    const hasMin = record.minSalary !== undefined && record.minSalary !== null && record.minSalary > 0;
                                    const type = record.compensationType;

                                    if (!hasSalary && !hasHourly && !record.compensationNotes && !type) {
                                      return (
                                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                          <span className="text-sm font-semibold">—</span>
                                          <span className="text-[10px] opacity-0 group-hover:opacity-100 text-teal-500 font-semibold px-2 py-0.5 rounded-lg bg-teal-500/10 border border-teal-500/20">
                                            + Customize
                                          </span>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="flex flex-col gap-0.5">
                                        <div className={`text-xs font-extrabold ${theme.textAccent} flex items-center gap-1 flex-wrap`}>
                                          {hasSalary ? (
                                            <span>
                                              {sym}{record.salaryExpectation?.toLocaleString()}{type === 'Annual Package' ? '/yr' : type === 'Daily Rate' ? '/day' : '/mo'}
                                            </span>
                                          ) : hasHourly ? (
                                            <span>
                                              {sym}{record.hourlyRate}/hr
                                            </span>
                                          ) : (
                                            <span>{type || 'Custom'}</span>
                                          )}
                                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-500/10 font-mono font-bold text-slate-500 dark:text-slate-400">
                                            {curr}
                                          </span>
                                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-teal-400">✎</span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                                          {hasSalary && hasHourly && (
                                            <span>{sym}{record.hourlyRate}/hr</span>
                                          )}
                                          {hasMin && (
                                            <span className="text-amber-500 font-semibold">Min {sym}{record.minSalary?.toLocaleString()}</span>
                                          )}
                                          {record.employmentType && (
                                            <span className="text-indigo-400 font-medium">{record.employmentType}</span>
                                          )}
                                        </div>

                                        {record.compensationNotes && (
                                          <div className="text-[10px] italic text-slate-400 dark:text-slate-500 truncate max-w-[170px]" title={record.compensationNotes}>
                                            {record.compensationNotes}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </button>
                              </td>
                              <td className={`p-4 ${theme.textSecondary} text-sm font-medium`}>
                                {record.location ? (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                    {record.location}
                                  </span>
                                ) : '—'}
                              </td>
                              <td className="p-4">
                                <div className="flex flex-col gap-1 text-xs">
                                  {record.email && (
                                    <span className={`flex items-center gap-1 ${theme.textSecondary} truncate max-w-[170px]`} title={record.email}>
                                      <Mail className="w-3 h-3 opacity-60 shrink-0" />
                                      {record.email}
                                    </span>
                                  )}
                                  {record.whatsapp && (
                                    <span className={`flex items-center gap-1 font-mono text-[11px] ${theme.textSecondary}`}>
                                      <Phone className="w-3 h-3 opacity-60 shrink-0" />
                                      {formatPhoneNumber(record.whatsapp, record.location)}
                                    </span>
                                  )}
                                  {record.skills && (
                                    <div className="flex flex-wrap gap-1 mt-1 max-w-[220px]">
                                      {record.skills.split(',').slice(0, 3).map((s: string) => (
                                        <span key={s} className={`text-[10px] px-1.5 py-0.5 rounded ${theme.badgePrimary} border font-medium truncate max-w-[100px]`}>
                                          {s.trim()}
                                        </span>
                                      ))}
                                      {record.skills.split(',').length > 3 && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${theme.bgMain} ${theme.textMuted} font-medium`}>
                                          +{record.skills.split(',').length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>
                              {/* Action & Documents Column */}
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Protected Edit Candidate Button */}
                                  <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setSelectedEditCandidate(record)}
                                    className={`p-2 rounded-xl border ${theme.bgCard} ${theme.border} text-amber-500 hover:bg-amber-500/10 transition-all shadow-sm flex items-center justify-center`}
                                    title="Edit Candidate (Backend Password Protected)"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </motion.button>

                                  {/* Cloud Document Inspector / Upload Button */}
                                  <motion.button 
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setSelectedDocCandidate(record)}
                                    className={`p-2 rounded-xl border transition-all shadow-sm flex items-center gap-1 ${
                                      hasCloudDoc 
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                                        : record.cv 
                                        ? `${theme.bgCard} ${theme.border} ${theme.textAccent}` 
                                        : `${theme.bgCard} ${theme.border} ${theme.textMuted} hover:${theme.textPrimary}`
                                    }`}
                                    title={hasCloudDoc ? `Cloud Resume Attached: ${record.cvFileName || 'Resume.pdf'}` : "Manage Resume & Documents"}
                                  >
                                    {hasCloudDoc ? <FileCheck className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                                  </motion.button>

                                  {/* External Portfolio */}
                                  {record.portfolio && isSafeUrl(record.portfolio) && (
                                    <motion.a 
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      href={record.portfolio} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className={`p-2 ${theme.bgCard} ${theme.border} border rounded-xl text-teal-500 hover:opacity-80 transition-all shadow-sm`} 
                                      title="View Portfolio"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </motion.a>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>

                      {sortedRecords.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-16 text-center">
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex flex-col items-center justify-center max-w-sm mx-auto"
                            >
                              <div className={`w-14 h-14 ${theme.bgMain} rounded-2xl flex items-center justify-center mb-4 ${theme.textMuted}`}>
                                <Search className="w-7 h-7" />
                              </div>
                              <h3 className={`text-base font-bold ${theme.textPrimary} mb-1`}>No candidates found</h3>
                              <p className={`text-xs ${theme.textMuted} mb-4 text-center leading-relaxed`}>
                                We couldn't find any candidate matching your current search or filter criteria.
                              </p>
                              {hasActiveFilters && (
                                <button 
                                  onClick={clearAllFilters}
                                  className={`px-4 py-2 ${theme.btnSecondary} rounded-xl text-xs font-semibold`}
                                >
                                  Reset Filters
                                </button>
                              )}
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className={`px-6 sm:px-10 py-4 ${theme.bgCard} ${theme.border} border-t flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 transition-colors duration-300`}>
          <div className={`flex items-center gap-6 text-xs ${theme.textMuted} w-full justify-between sm:w-auto sm:justify-start`}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className={`font-medium ${theme.textSecondary}`}>
                {sortedRecords.length} Sourced Profiles {selectedRows.size > 0 && <span className={`font-bold ${theme.textAccent}`}>({selectedRows.size} Selected)</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-teal-500" />
              <span className="hidden sm:inline">Google Cloud Firestore Multi-User Sync</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'table' ? 'analytics' : 'table')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border ${theme.border} ${theme.bgCard} ${theme.textPrimary} hover:bg-slate-500/10 transition-colors flex items-center gap-2`}
            >
              {viewMode === 'table' ? <BarChart3 className="w-3.5 h-3.5 text-teal-500" /> : <Layers className="w-3.5 h-3.5 text-indigo-500" />}
              <span>{viewMode === 'table' ? 'Open Analytics View' : 'Open Directory Table'}</span>
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportCSV}
              className={`flex items-center justify-center gap-2 ${theme.btnExport} px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-widest shrink-0`}
            >
              <Download className="w-4 h-4" />
              Excel Roster
            </motion.button>
          </div>
        </footer>
      </div>

      {/* Cloud Document Attachment Modal */}
      <CandidateDocumentModal
        candidate={selectedDocCandidate}
        isOpen={Boolean(selectedDocCandidate)}
        onClose={() => setSelectedDocCandidate(null)}
        theme={theme}
        userEmail={user?.email || undefined}
        onCandidateUpdated={(updated) => {
          setSelectedDocCandidate(updated);
          showToast(`Document synced for ${updated.name}!`, 'success');
        }}
      />

      {/* Rate & Salary Expectation Modal */}
      <RateEditModal
        candidate={selectedRateCandidate}
        isOpen={Boolean(selectedRateCandidate)}
        onClose={() => setSelectedRateCandidate(null)}
        theme={theme}
        userEmail={user?.email || undefined}
        onUpdated={(updated) => {
          showToast(`Updated rates for ${updated.name}!`, 'success');
        }}
      />

      {/* Full Candidate Profile Edit Modal (Protected by Backend Password MIHORAtlnt@1) */}
      <CandidateEditModal
        candidate={selectedEditCandidate}
        isOpen={Boolean(selectedEditCandidate)}
        onClose={() => setSelectedEditCandidate(null)}
        theme={theme}
        userEmail={user?.email || undefined}
        onCandidateUpdated={(updated) => {
          setSelectedEditCandidate(null);
          showToast(`Candidate ${updated.name} updated and persisted via backend!`, 'success');
        }}
        onSuccessToast={(msg) => showToast(msg, 'success')}
      />

      {/* Security Shield Audit & Posture Modal */}
      <SecurityShieldModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        theme={theme}
        userEmail={user?.email || undefined}
        isFirestoreConnected={isFirestoreConnected}
      />

      {/* Add New Record Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className={`fixed inset-0 ${theme.bgModalOverlay}`}
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`relative z-10 ${theme.bgModal} ${theme.border} border rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]`}
            >
              <div className={`p-5 ${theme.border} border-b flex justify-between items-center ${theme.bgCard}`}>
                <h2 className={`text-lg font-extrabold ${theme.textPrimary} flex items-center gap-2.5`}>
                  <div className={`p-2 rounded-xl ${theme.badgePrimary} border`}>
                    <Plus className={`w-5 h-5 ${theme.textAccent}`} />
                  </div>
                  Add Candidate to Cloud Firestore
                </h2>
                <motion.button 
                  whileHover={{ rotate: 90 }}
                  onClick={() => setIsAddModalOpen(false)} 
                  className={`p-1.5 rounded-xl ${theme.textMuted} hover:${theme.textPrimary} hover:bg-slate-500/10 transition-colors`}
                >
                  <X className="w-5 h-5"/>
                </motion.button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form id="add-form" onSubmit={handleAddRecord} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Full Name *</label>
                    <input 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className={`w-full ${theme.bgInput} rounded-xl px-4 py-2.5 text-sm transition-all`} 
                      placeholder="e.g. Sarah Jenkins" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Role</label>
                    <select 
                      value={formData.role} 
                      onChange={e => setFormData({...formData, role: e.target.value})} 
                      className={`w-full ${theme.bgInput} rounded-xl px-4 py-2.5 text-sm transition-all appearance-none cursor-pointer`}
                      required
                    >
                      <option value="">Select a role...</option>
                      {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                      <option value="UI/UX Designer">UI/UX Designer</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Full Stack Developer">Full Stack Developer</option>
                      <option value="AI / ML Engineer">AI / ML Engineer</option>
                      <option value="IT Support Specialist">IT Support Specialist</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Seniority Level</label>
                    <select 
                      value={formData.seniority} 
                      onChange={e => setFormData({...formData, seniority: e.target.value})} 
                      className={`w-full ${theme.bgInput} rounded-xl px-4 py-2.5 text-sm transition-all appearance-none cursor-pointer`}
                    >
                      <option value="Junior">Junior (0-2 years)</option>
                      <option value="Mid">Mid-Level (2-5 years)</option>
                      <option value="Senior">Senior (5-8 years)</option>
                      <option value="Lead/Principal">Lead/Principal (8+ years)</option>
                    </select>
                  </div>

                  {/* Customizable Compensation Section */}
                  <div className="sm:col-span-2 p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        Customized Compensation & Rates (Database Stored)
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Person-specific, no defaults forced</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Compensation Model</label>
                        <select
                          value={formData.compensationType}
                          onChange={e => setFormData({ ...formData, compensationType: e.target.value })}
                          className={`w-full ${theme.bgInput} rounded-xl px-3 py-2 text-xs font-semibold appearance-none cursor-pointer`}
                        >
                          <option value="Monthly Salary">📅 Monthly Salary</option>
                          <option value="Hourly">🕒 Hourly Rate</option>
                          <option value="Annual Package">🏛️ Annual Package</option>
                          <option value="Daily Rate">☀️ Daily Rate</option>
                          <option value="Project / Contract">🤝 Project / Contract</option>
                          <option value="Custom / Negotiable">💬 Custom / Negotiable</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Currency</label>
                        <input
                          type="text"
                          value={formData.currency}
                          onChange={e => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                          placeholder="USD, EUR, GBP, PKR, CAD..."
                          className={`w-full ${theme.bgInput} rounded-xl px-3 py-2 text-xs font-bold font-mono`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Target Salary ({formData.currency})</label>
                        <input
                          type="number"
                          min="1"
                          max="10000000"
                          value={formData.salaryExpectation ?? ''}
                          onChange={e => setFormData({ ...formData, salaryExpectation: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className={`w-full ${theme.bgInput} rounded-xl px-3 py-2 text-sm font-bold`}
                          placeholder="e.g. 4500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Hourly Rate ({formData.currency})</label>
                        <input
                          type="number"
                          min="1"
                          max="5000"
                          value={formData.hourlyRate ?? ''}
                          onChange={e => setFormData({ ...formData, hourlyRate: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className={`w-full ${theme.bgInput} rounded-xl px-3 py-2 text-sm font-bold`}
                          placeholder="e.g. 35"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Minimum Floor ({formData.currency})</label>
                        <input
                          type="number"
                          min="1"
                          max="10000000"
                          value={formData.minSalary ?? ''}
                          onChange={e => setFormData({ ...formData, minSalary: e.target.value === '' ? undefined : Number(e.target.value) })}
                          className={`w-full ${theme.bgInput} rounded-xl px-3 py-2 text-sm font-bold`}
                          placeholder="e.g. 3800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Employment Arrangement</label>
                        <select
                          value={formData.employmentType}
                          onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
                          className={`w-full ${theme.bgInput} rounded-xl px-3 py-2 text-xs font-semibold appearance-none cursor-pointer`}
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract / Freelance">Contract / Freelance</option>
                          <option value="C2C / 1099">C2C / 1099</option>
                          <option value="Flexible">Flexible</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Compensation Notes</label>
                        <input
                          type="text"
                          value={formData.compensationNotes}
                          onChange={e => setFormData({ ...formData, compensationNotes: e.target.value })}
                          placeholder="e.g. Open to equity, negotiable..."
                          className={`w-full ${theme.bgInput} rounded-xl px-3 py-2 text-xs font-medium`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Skills</label>
                    <input 
                      value={formData.skills} 
                      onChange={e => setFormData({...formData, skills: e.target.value})} 
                      className={`w-full ${theme.bgInput} rounded-xl px-4 py-2.5 text-sm transition-all`} 
                      placeholder="Comma separated (e.g. React, TypeScript, Figma, Python)" 
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Specialization / Summary</label>
                    <input 
                      value={formData.specialization} 
                      onChange={e => setFormData({...formData, specialization: e.target.value})} 
                      className={`w-full ${theme.bgInput} rounded-xl px-4 py-2.5 text-sm transition-all`} 
                      placeholder="Brief headline of primary expertise" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className={`w-full ${theme.bgInput} rounded-xl px-4 py-2.5 text-sm transition-all`} 
                      placeholder="candidate@example.com" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>WhatsApp / Phone</label>
                    <input 
                      value={formData.whatsapp} 
                      onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                      className={`w-full ${theme.bgInput} rounded-xl px-4 py-2.5 text-sm transition-all`} 
                      placeholder="+1 234 567 890" 
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Location (City, Country)</label>
                    <input 
                      value={formData.location} 
                      onChange={e => setFormData({...formData, location: e.target.value})} 
                      className={`w-full ${theme.bgInput} rounded-xl px-4 py-2.5 text-sm transition-all`} 
                      placeholder="e.g. Lahore, Pakistan or London, UK" 
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Portfolio URL</label>
                    <input 
                      type="url" 
                      value={formData.portfolio} 
                      onChange={e => setFormData({...formData, portfolio: e.target.value})} 
                      className={`w-full ${theme.bgInput} rounded-xl px-4 py-2.5 text-sm transition-all`} 
                      placeholder="https://" 
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-extrabold`}>Resume / CV Link</label>
                    <input 
                      type="url" 
                      value={formData.cv} 
                      onChange={e => setFormData({...formData, cv: e.target.value})} 
                      className={`w-full ${theme.bgInput} rounded-xl px-4 py-2.5 text-sm transition-all`} 
                      placeholder="https://" 
                    />
                  </div>
                </form>
              </div>

              <div className={`p-5 ${theme.border} border-t flex justify-end gap-3 ${theme.bgCard}`}>
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)} 
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold ${theme.textSecondary} hover:${theme.textPrimary} hover:bg-slate-500/10 transition-colors`}
                >
                  Cancel
                </button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  form="add-form" 
                  className={`px-6 py-2.5 ${theme.btnPrimary} font-bold rounded-xl text-xs transition-colors shadow-lg flex items-center gap-2`}
                >
                  <Cloud className="w-4 h-4" /> Save Candidate
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[120] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl ${theme.bgCard} ${theme.border} border font-medium text-sm text-slate-800`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {toast.type === 'danger' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-500 shrink-0" />}
            <span className={theme.textPrimary}>{toast.message}</span>
            <button onClick={() => setToast(null)} className={`ml-2 ${theme.textMuted} hover:${theme.textPrimary}`}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
