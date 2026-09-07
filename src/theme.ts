export type ThemeMode = 'light' | 'dark' | 'desert';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  iconName: string;
  // Backgrounds
  bgMain: string;
  bgCard: string;
  bgCardHeader: string;
  bgHeader: string;
  bgTableHead: string;
  bgTableRowHover: string;
  bgTableRowSelected: string;
  bgModal: string;
  bgModalOverlay: string;
  bgDropdown: string;
  bgInput: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  
  // Borders & Dividers
  border: string;
  borderLight: string;
  divider: string;
  
  // Accent Badges / Buttons
  badgePrimary: string;
  badgeRole: string;
  btnPrimary: string;
  btnSecondary: string;
  btnExport: string;
  
  // Checkbox
  checkboxChecked: string;
  checkboxUnchecked: string;

  // Ambient effects
  ambientOrb1: string;
  ambientOrb2: string;
  dotPattern: string;
  statCardBg: string;
  statCardBorder: string;
  tableBorder: string;
}

export const THEME_CONFIGS: Record<ThemeMode, ThemeConfig> = {
  light: {
    id: 'light',
    name: 'Light',
    iconName: 'Sun',
    bgMain: 'bg-slate-50 text-slate-900',
    bgCard: 'bg-white',
    bgCardHeader: 'bg-white',
    bgHeader: 'bg-white/90 border-slate-200/80 backdrop-blur-md shadow-sm',
    bgTableHead: 'bg-slate-100/80 text-slate-700',
    bgTableRowHover: 'hover:bg-indigo-50/30',
    bgTableRowSelected: 'bg-indigo-50/70',
    bgModal: 'bg-white border-slate-200/80 shadow-2xl shadow-indigo-900/10',
    bgModalOverlay: 'bg-slate-900/60 backdrop-blur-sm',
    bgDropdown: 'bg-white border-slate-200/80 shadow-xl shadow-slate-200/60',
    bgInput: 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
    
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textMuted: 'text-slate-400',
    textAccent: 'text-indigo-600',
    
    border: 'border-slate-200/80',
    borderLight: 'border-slate-100',
    divider: 'bg-slate-200',
    
    badgePrimary: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    badgeRole: 'bg-teal-50 text-teal-700 border-teal-200/60',
    btnPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20',
    btnSecondary: 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border-slate-200',
    btnExport: 'bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25',
    
    checkboxChecked: 'bg-indigo-600 border-indigo-600 text-white',
    checkboxUnchecked: 'border-slate-300 hover:border-slate-400 bg-white',

    ambientOrb1: 'from-indigo-200/40 via-purple-200/30 to-teal-200/20',
    ambientOrb2: 'from-teal-200/30 via-indigo-200/20 to-blue-200/30',
    dotPattern: 'rgba(148, 163, 184, 0.15)',
    statCardBg: 'bg-white/90 border-slate-200/80 shadow-sm hover:shadow-md',
    statCardBorder: 'border-slate-200/80',
    tableBorder: 'border-slate-200/80'
  },

  dark: {
    id: 'dark',
    name: 'Dark',
    iconName: 'Moon',
    bgMain: 'bg-[#0a0f1d] text-slate-100',
    bgCard: 'bg-[#11192e]',
    bgCardHeader: 'bg-[#11192e]',
    bgHeader: 'bg-[#0d1427]/90 border-slate-800/80 backdrop-blur-md shadow-lg shadow-black/40',
    bgTableHead: 'bg-[#18223c] text-slate-300',
    bgTableRowHover: 'hover:bg-slate-800/50',
    bgTableRowSelected: 'bg-cyan-950/50',
    bgModal: 'bg-[#11192e] border-slate-800/90 shadow-2xl shadow-black/80',
    bgModalOverlay: 'bg-black/80 backdrop-blur-sm',
    bgDropdown: 'bg-[#162038] border-slate-700/80 shadow-2xl shadow-black/70',
    bgInput: 'bg-[#162038] border-slate-700 text-slate-100 placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20',
    
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    textMuted: 'text-slate-500',
    textAccent: 'text-cyan-400',
    
    border: 'border-slate-800/80',
    borderLight: 'border-slate-800/50',
    divider: 'bg-slate-800',
    
    badgePrimary: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    badgeRole: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    btnPrimary: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/20',
    btnSecondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700',
    btnExport: 'bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/25',
    
    checkboxChecked: 'bg-cyan-400 border-cyan-400 text-slate-950',
    checkboxUnchecked: 'border-slate-600 hover:border-slate-400 bg-[#162038]',

    ambientOrb1: 'from-cyan-600/15 via-indigo-600/15 to-purple-600/10',
    ambientOrb2: 'from-blue-600/15 via-teal-600/10 to-indigo-600/15',
    dotPattern: 'rgba(51, 65, 85, 0.25)',
    statCardBg: 'bg-[#11192e]/90 border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700',
    statCardBorder: 'border-slate-800/80',
    tableBorder: 'border-slate-800/80'
  },

  desert: {
    id: 'desert',
    name: 'Desert',
    iconName: 'Compass',
    bgMain: 'bg-[#f7f0e3] text-stone-900',
    bgCard: 'bg-[#fffdf9]',
    bgCardHeader: 'bg-[#fffdf9]',
    bgHeader: 'bg-[#f3e7d3]/90 border-amber-900/15 backdrop-blur-md shadow-sm',
    bgTableHead: 'bg-[#ebdcb3]/70 text-stone-800',
    bgTableRowHover: 'hover:bg-amber-100/50',
    bgTableRowSelected: 'bg-amber-200/50',
    bgModal: 'bg-[#fffdf9] border-amber-900/20 shadow-2xl shadow-amber-950/15',
    bgModalOverlay: 'bg-stone-900/65 backdrop-blur-sm',
    bgDropdown: 'bg-[#fffbf2] border-amber-900/20 shadow-xl shadow-amber-950/10',
    bgInput: 'bg-[#fffbf2] border-stone-300/90 text-stone-900 placeholder-stone-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20',
    
    textPrimary: 'text-stone-900',
    textSecondary: 'text-stone-600',
    textMuted: 'text-stone-500',
    textAccent: 'text-amber-700',
    
    border: 'border-stone-300/80',
    borderLight: 'border-stone-200',
    divider: 'bg-stone-300/70',
    
    badgePrimary: 'bg-amber-500/15 text-amber-900 border-amber-300/80',
    badgeRole: 'bg-orange-500/15 text-orange-900 border-orange-300/80',
    btnPrimary: 'bg-amber-700 hover:bg-amber-800 text-amber-50 shadow-md shadow-amber-700/20',
    btnSecondary: 'bg-[#ebdcb3] hover:bg-[#e0d0a5] text-stone-800 border-stone-300/80',
    btnExport: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:to-orange-800 text-amber-50 font-bold shadow-lg shadow-amber-700/25',
    
    checkboxChecked: 'bg-amber-700 border-amber-700 text-amber-50',
    checkboxUnchecked: 'border-stone-400 hover:border-stone-600 bg-[#fffbf2]',

    ambientOrb1: 'from-amber-300/25 via-orange-300/20 to-yellow-200/20',
    ambientOrb2: 'from-orange-300/20 via-amber-300/25 to-stone-300/20',
    dotPattern: 'rgba(180, 140, 90, 0.18)',
    statCardBg: 'bg-[#fffdf9]/90 border-stone-300/80 shadow-sm hover:shadow-md',
    statCardBorder: 'border-stone-300/80',
    tableBorder: 'border-stone-300/80'
  }
};
