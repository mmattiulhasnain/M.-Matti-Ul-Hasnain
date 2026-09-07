import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe2, Briefcase, TrendingUp, DollarSign, Award, 
  MapPin, Code2, Users2, Sparkles, Filter, ChevronRight,
  PieChart as PieIcon, BarChart3, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { Candidate } from '../types';
import { ThemeConfig } from '../theme';
import { parseLocation, parseSeniority } from '../utils';

interface TalentAnalyticsProps {
  records: Candidate[];
  theme: ThemeConfig;
  onFilterByCountry?: (country: string) => void;
  onFilterBySkill?: (skill: string) => void;
  onFilterBySeniority?: (seniority: string) => void;
}

const SENIORITY_COLORS = {
  'Junior': '#10B981',        // Emerald
  'Mid': '#3B82F6',           // Blue
  'Senior': '#8B5CF6',         // Purple
  'Lead/Principal': '#F59E0B' // Amber
};

const PALETTE = ['#6366F1', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#06B6D4', '#F43F5E'];

export const TalentAnalyticsDashboard: React.FC<TalentAnalyticsProps> = ({
  records,
  theme,
  onFilterByCountry,
  onFilterBySkill,
  onFilterBySeniority,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'geography' | 'skills' | 'compensation'>('overview');
  const [selectedGeoType, setSelectedGeoType] = useState<'country' | 'city'>('country');

  // --- Aggregate Computations ---

  // 1. Geographic Breakdown
  const geoStats = useMemo(() => {
    const countryMap: Record<string, { count: number; cities: Set<string>; totalRate: number; ratedCount: number }> = {};
    const cityMap: Record<string, { count: number; country: string; totalRate: number; ratedCount: number }> = {};

    records.forEach(r => {
      const { country, city } = parseLocation(r.location);
      const hasRate = typeof r.hourlyRate === 'number' && r.hourlyRate > 0;

      // Country aggregation
      if (!countryMap[country]) {
        countryMap[country] = { count: 0, cities: new Set(), totalRate: 0, ratedCount: 0 };
      }
      countryMap[country].count++;
      countryMap[country].cities.add(city);
      if (hasRate) {
        countryMap[country].totalRate += r.hourlyRate!;
        countryMap[country].ratedCount++;
      }

      // City aggregation
      const cleanCity = city || 'Other';
      if (!cityMap[cleanCity]) {
        cityMap[cleanCity] = { count: 0, country, totalRate: 0, ratedCount: 0 };
      }
      cityMap[cleanCity].count++;
      if (hasRate) {
        cityMap[cleanCity].totalRate += r.hourlyRate!;
        cityMap[cleanCity].ratedCount++;
      }
    });

    const countries = Object.entries(countryMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        citiesCount: data.cities.size,
        avgRate: data.ratedCount > 0 ? Math.round(data.totalRate / data.ratedCount) : null,
        percentage: Math.round((data.count / (records.length || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    const cities = Object.entries(cityMap)
      .map(([name, data]) => ({
        name,
        country: data.country,
        count: data.count,
        avgRate: data.ratedCount > 0 ? Math.round(data.totalRate / data.ratedCount) : null,
        percentage: Math.round((data.count / (records.length || 1)) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { countries, cities };
  }, [records]);

  // 2. Skills & Cloud Frequency
  const skillStats = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(r => {
      if (!r.skills) return;
      const parsed = r.skills
        .split(/[,/&;|]/)
        .map(s => s.trim().replace(/^and\s+/i, ''))
        .filter(s => s.length > 1 && s.length < 30);

      parsed.forEach(skill => {
        // Normalize capitalization for common skills
        let key = skill;
        const lower = skill.toLowerCase();
        if (lower.includes('figma')) key = 'Figma';
        else if (lower.includes('photoshop')) key = 'Photoshop';
        else if (lower.includes('illustrator')) key = 'Illustrator';
        else if (lower.includes('adobe xd') || lower.includes('xd')) key = 'Adobe XD';
        else if (lower.includes('react native')) key = 'React Native';
        else if (lower.includes('react')) key = 'React';
        else if (lower.includes('python')) key = 'Python';
        else if (lower.includes('typescript')) key = 'TypeScript';
        else if (lower.includes('node')) key = 'Node.js';
        else if (lower.includes('intune')) key = 'Microsoft Intune';
        else if (lower.includes('365') || lower.includes('office 365')) key = 'Microsoft 365';
        else if (lower.includes('cisco')) key = 'Cisco Networking';
        else if (lower.includes('azure') || lower.includes('entra')) key = 'Azure / Entra ID';

        counts[key] = (counts[key] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [records]);

  // 3. Seniority Breakdown
  const seniorityStats = useMemo(() => {
    const counts: Record<string, { count: number; totalRate: number; ratedCount: number }> = {
      'Junior': { count: 0, totalRate: 0, ratedCount: 0 },
      'Mid': { count: 0, totalRate: 0, ratedCount: 0 },
      'Senior': { count: 0, totalRate: 0, ratedCount: 0 },
      'Lead/Principal': { count: 0, totalRate: 0, ratedCount: 0 }
    };

    records.forEach(r => {
      const level = r.seniority || parseSeniority(r.experience, r.role);
      const hasRate = typeof r.hourlyRate === 'number' && r.hourlyRate > 0;
      if (counts[level]) {
        counts[level].count++;
        if (hasRate) {
          counts[level].totalRate += r.hourlyRate!;
          counts[level].ratedCount++;
        }
      }
    });

    return Object.entries(counts).map(([name, data]) => ({
      name,
      count: data.count,
      avgRate: data.ratedCount > 0 ? Math.round(data.totalRate / data.ratedCount) : null,
      percentage: Math.round((data.count / (records.length || 1)) * 100)
    }));
  }, [records]);

  // 4. Role Categories
  const roleCategories = useMemo(() => {
    const roles: Record<string, { count: number; totalRate: number; ratedCount: number }> = {
      'UI/UX & Product Design': { count: 0, totalRate: 0, ratedCount: 0 },
      'Software & App Dev': { count: 0, totalRate: 0, ratedCount: 0 },
      'AI / ML & Data': { count: 0, totalRate: 0, ratedCount: 0 },
      'IT Support & Systems': { count: 0, totalRate: 0, ratedCount: 0 },
      'Network & Infrastructure': { count: 0, totalRate: 0, ratedCount: 0 }
    };

    records.forEach(r => {
      const rName = (r.role || '').toLowerCase();
      const hasRate = typeof r.hourlyRate === 'number' && r.hourlyRate > 0;
      let targetCat = 'IT Support & Systems';

      if (rName.includes('design') || rName.includes('ui') || rName.includes('ux')) {
        targetCat = 'UI/UX & Product Design';
      } else if (rName.includes('ai') || rName.includes('ml') || rName.includes('data')) {
        targetCat = 'AI / ML & Data';
      } else if (rName.includes('network') || rName.includes('infrastructure')) {
        targetCat = 'Network & Infrastructure';
      } else if (rName.includes('develop') || rName.includes('frontend') || rName.includes('stack')) {
        targetCat = 'Software & App Dev';
      }

      roles[targetCat].count++;
      if (hasRate) {
        roles[targetCat].totalRate += r.hourlyRate!;
        roles[targetCat].ratedCount++;
      }
    });

    return Object.entries(roles).map(([name, data], idx) => ({
      name,
      count: data.count,
      avgRate: data.ratedCount > 0 ? Math.round(data.totalRate / data.ratedCount) : null,
      color: PALETTE[idx % PALETTE.length]
    })).filter(r => r.count > 0);
  }, [records]);

  // 5. Rate / Compensation Distribution
  const rateStats = useMemo(() => {
    const brackets = [
      { range: '$15 - $25/hr', min: 15, max: 25, count: 0, label: 'Entry / Junior' },
      { range: '$26 - $40/hr', min: 26, max: 40, count: 0, label: 'Mid-Level' },
      { range: '$41 - $60/hr', min: 41, max: 60, count: 0, label: 'Senior' },
      { range: '$61+/hr', min: 61, max: 999, count: 0, label: 'Lead / Specialist' },
    ];

    let totalHourly = 0;
    let totalMonthly = 0;
    let validHourlyCount = 0;
    let validMonthlyCount = 0;

    records.forEach(r => {
      if (typeof r.hourlyRate === 'number' && r.hourlyRate > 0) {
        const rate = r.hourlyRate;
        totalHourly += rate;
        validHourlyCount++;

        const found = brackets.find(b => rate >= b.min && rate <= b.max);
        if (found) found.count++;
      }

      if (typeof r.salaryExpectation === 'number' && r.salaryExpectation > 0) {
        totalMonthly += r.salaryExpectation;
        validMonthlyCount++;
      }
    });

    const avgHourly = validHourlyCount > 0 ? Math.round(totalHourly / validHourlyCount) : null;
    const avgMonthly = validMonthlyCount > 0 ? Math.round(totalMonthly / validMonthlyCount) : null;

    return { brackets, avgHourly, avgMonthly, validHourlyCount, validMonthlyCount };
  }, [records]);

  const customTooltipStyle = {
    backgroundColor: theme.id === 'dark' ? '#162038' : theme.id === 'desert' ? '#fffbf2' : '#ffffff',
    border: `1px solid ${theme.id === 'dark' ? '#334155' : theme.id === 'desert' ? '#d6c7a8' : '#e2e8f0'}`,
    borderRadius: '12px',
    padding: '10px 14px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
    color: theme.id === 'dark' ? '#f1f5f9' : '#0f172a'
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Analytics Navigation Bar */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 rounded-2xl ${theme.bgCard} ${theme.border} border shadow-sm gap-3`}>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 custom-scrollbar">
          {[
            { id: 'overview', label: 'Talent Bench Overview', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'geography', label: 'Demographics & Geography', icon: <Globe2 className="w-4 h-4" /> },
            { id: 'skills', label: 'Skills & Seniority', icon: <Code2 className="w-4 h-4" /> },
            { id: 'compensation', label: 'Salary & Rate Tracking', icon: <DollarSign className="w-4 h-4" /> },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive 
                    ? `${theme.btnPrimary} shadow-sm` 
                    : `${theme.textSecondary} hover:${theme.textPrimary} hover:bg-slate-500/10`
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className={`text-xs ${theme.textMuted} px-3 py-1 flex items-center gap-1.5 shrink-0`}>
          <Sparkles className={`w-3.5 h-3.5 ${theme.textAccent}`} />
          <span>Real-time Talent Intelligence</span>
        </div>
      </div>

      {/* Primary Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${theme.statCardBg} ${theme.statCardBorder} border p-5 rounded-2xl shadow-sm flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.textMuted}`}>Talent Bench Size</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-3xl font-extrabold ${theme.textPrimary}`}>{records.length}</div>
            <div className={`text-xs ${theme.textSecondary} mt-1 font-medium flex items-center gap-1`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Sourced & Verified Profiles
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={`${theme.statCardBg} ${theme.statCardBorder} border p-5 rounded-2xl shadow-sm flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.textMuted}`}>Global Reach</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-3xl font-extrabold ${theme.textPrimary}`}>{geoStats.countries.length}</div>
            <div className={`text-xs ${theme.textSecondary} mt-1 font-medium`}>
              Countries across 4 continents
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${theme.statCardBg} ${theme.statCardBorder} border p-5 rounded-2xl shadow-sm flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.textMuted}`}>Average Hourly Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            {rateStats.avgHourly ? (
              <>
                <div className={`text-3xl font-extrabold ${theme.textPrimary}`}>
                  ${rateStats.avgHourly}<span className="text-sm font-semibold opacity-70">/hr</span>
                </div>
                <div className={`text-xs ${theme.textSecondary} mt-1 font-medium`}>
                  {rateStats.avgMonthly ? `Avg $${rateStats.avgMonthly.toLocaleString()}/mo • ` : ''}
                  {rateStats.validHourlyCount} verified rate{rateStats.validHourlyCount > 1 ? 's' : ''}
                </div>
              </>
            ) : (
              <>
                <div className={`text-3xl font-extrabold ${theme.textPrimary}`}>—</div>
                <div className={`text-xs ${theme.textMuted} mt-1 font-medium`}>
                  Pending real rate upload
                </div>
              </>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`${theme.statCardBg} ${theme.statCardBorder} border p-5 rounded-2xl shadow-sm flex flex-col justify-between`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.textMuted}`}>Seniority Index</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-3xl font-extrabold ${theme.textPrimary}`}>
              {Math.round(((seniorityStats.find(s => s.name === 'Senior')?.count || 0) + (seniorityStats.find(s => s.name === 'Lead/Principal')?.count || 0)) / (records.length || 1) * 100)}%
            </div>
            <div className={`text-xs ${theme.textSecondary} mt-1 font-medium`}>
              Senior & Lead professionals
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Role Specialization Breakdown */}
          <div className={`lg:col-span-7 ${theme.bgCard} ${theme.border} border p-6 rounded-2xl shadow-sm flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-base font-bold ${theme.textPrimary}`}>Role Domain Distribution</h3>
                <p className={`text-xs ${theme.textSecondary}`}>Concentration of talent across technical domains</p>
              </div>
              <div className={`p-2 rounded-xl bg-slate-500/10 ${theme.textAccent}`}>
                <PieIcon className="w-4 h-4" />
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {roleCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={customTooltipStyle}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} candidates (avg $${item.payload.avgRate}/hr)`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-500/20">
              {roleCategories.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between p-2 rounded-xl bg-slate-500/5 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className={`font-semibold truncate ${theme.textPrimary}`}>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-bold ${theme.textPrimary}`}>{cat.count}</span>
                    <span className={`${theme.textMuted} text-[11px]`}>(${cat.avgRate}/hr)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Countries Quick Glance */}
          <div className={`lg:col-span-5 ${theme.bgCard} ${theme.border} border p-6 rounded-2xl shadow-sm flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-base font-bold ${theme.textPrimary}`}>Top Talent Hubs</h3>
                <p className={`text-xs ${theme.textSecondary}`}>Primary candidate concentrations</p>
              </div>
              <button 
                onClick={() => setActiveTab('geography')}
                className={`text-xs font-semibold ${theme.textAccent} hover:underline flex items-center gap-1`}
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 flex-1 justify-center">
              {geoStats.countries.slice(0, 5).map((c, i) => (
                <div 
                  key={c.name}
                  onClick={() => onFilterByCountry && onFilterByCountry(c.name)}
                  className={`p-3 rounded-xl bg-slate-500/5 hover:bg-slate-500/10 cursor-pointer transition-all border border-transparent hover:${theme.border}`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={`font-bold ${theme.textPrimary} flex items-center gap-1.5`}>
                      <span className="w-5 h-5 rounded-full bg-slate-500/20 flex items-center justify-center text-[10px] font-mono">
                        {i + 1}
                      </span>
                      {c.name}
                    </span>
                    <span className={`font-bold ${theme.textAccent}`}>{c.count} candidates ({c.percentage}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-500/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(c.percentage, 8)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>{c.citiesCount} cities</span>
                    <span>Avg ${c.avgRate}/hr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: GEOGRAPHY & DEMOGRAPHICS */}
      {activeTab === 'geography' && (
        <div className="flex flex-col gap-6">
          <div className={`p-6 ${theme.bgCard} ${theme.border} border rounded-2xl shadow-sm`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className={`text-base font-bold ${theme.textPrimary} flex items-center gap-2`}>
                  <Globe2 className="w-5 h-5 text-teal-500" /> Geographic Talent Distribution
                </h3>
                <p className={`text-xs ${theme.textSecondary}`}>
                  Breakdown of candidate density by country and metropolitan hub
                </p>
              </div>

              {/* View Toggle */}
              <div className={`flex items-center p-1 rounded-xl border ${theme.border} bg-slate-500/10`}>
                <button
                  onClick={() => setSelectedGeoType('country')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedGeoType === 'country' ? `${theme.btnPrimary} shadow-sm` : `${theme.textSecondary}`
                  }`}
                >
                  By Country
                </button>
                <button
                  onClick={() => setSelectedGeoType('city')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedGeoType === 'city' ? `${theme.btnPrimary} shadow-sm` : `${theme.textSecondary}`
                  }`}
                >
                  By Major City
                </button>
              </div>
            </div>

            {/* Geographic Bar Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedGeoType === 'country' ? geoStats.countries.slice(0, 10) : geoStats.cities}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: theme.id === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fill: theme.id === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={customTooltipStyle}
                    formatter={(val: any, _: any, item: any) => [
                      `${val} candidates (${item.payload.percentage}%)`,
                      'Talent Count'
                    ]}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#14B8A6" 
                    radius={[6, 6, 0, 0]}
                    onClick={(entry) => onFilterByCountry && onFilterByCountry(entry.name)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Country & City Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(selectedGeoType === 'country' ? geoStats.countries : geoStats.cities).map((item: any) => (
              <motion.div
                key={item.name}
                whileHover={{ y: -2 }}
                onClick={() => onFilterByCountry && onFilterByCountry(item.country || item.name)}
                className={`p-4 rounded-2xl ${theme.bgCard} ${theme.border} border shadow-sm cursor-pointer hover:border-teal-500/50 transition-all flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${theme.textPrimary}`}>{item.name}</h4>
                      {item.country && (
                        <span className={`text-[11px] ${theme.textMuted}`}>{item.country}</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-lg ${theme.badgePrimary} border font-bold`}>
                    {item.count} talent
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-500/10">
                  <span className={theme.textMuted}>Average rate:</span>
                  <span className={`font-bold ${theme.textAccent}`}>
                    {item.avgRate ? `$${item.avgRate}/hr` : '—'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: SKILLS & SENIORITY */}
      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Seniority Distribution */}
          <div className={`lg:col-span-5 ${theme.bgCard} ${theme.border} border p-6 rounded-2xl shadow-sm flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-base font-bold ${theme.textPrimary}`}>Seniority Experience Tiers</h3>
                <p className={`text-xs ${theme.textSecondary}`}>Distribution from Junior to Principal leads</p>
              </div>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={seniorityStats}
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    dataKey="count"
                  >
                    {seniorityStats.map((entry) => (
                      <Cell 
                        key={`cell-${entry.name}`} 
                        fill={SENIORITY_COLORS[entry.name as keyof typeof SENIORITY_COLORS] || '#6366F1'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={customTooltipStyle}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} (${item.payload.percentage}%) - Avg $${item.payload.avgRate}/hr`,
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-2.5 mt-2">
              {seniorityStats.map((tier) => (
                <div 
                  key={tier.name}
                  onClick={() => onFilterBySeniority && onFilterBySeniority(tier.name)}
                  className={`flex items-center justify-between p-3 rounded-xl bg-slate-500/5 hover:bg-slate-500/10 cursor-pointer transition-all border border-transparent hover:${theme.border}`}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: SENIORITY_COLORS[tier.name as keyof typeof SENIORITY_COLORS] || '#6366F1' }} 
                    />
                    <span className={`text-xs font-bold ${theme.textPrimary}`}>{tier.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`font-semibold ${theme.textPrimary}`}>{tier.count} candidates</span>
                    <span className={`px-2 py-0.5 rounded-md ${theme.badgePrimary} border text-[11px] font-bold`}>
                      {tier.avgRate ? `$${tier.avgRate}/hr` : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Skill Cloud & Frequency */}
          <div className={`lg:col-span-7 ${theme.bgCard} ${theme.border} border p-6 rounded-2xl shadow-sm flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-base font-bold ${theme.textPrimary}`}>Most In-Demand Skills</h3>
                <p className={`text-xs ${theme.textSecondary}`}>Technical tools, libraries, and frameworks</p>
              </div>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-500">
                <Code2 className="w-4 h-4" />
              </div>
            </div>

            <div className="h-64 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skillStats.slice(0, 10)}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" tick={{ fill: theme.id === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fill: theme.id === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }} 
                  />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar 
                    dataKey="count" 
                    fill="#6366F1" 
                    radius={[0, 6, 6, 0]}
                    onClick={(entry) => onFilterBySkill && onFilterBySkill(entry.name)}
                    className="cursor-pointer hover:opacity-80"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Interactive Tag Cloud */}
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${theme.textMuted} mb-2 block`}>
                Click skill tag to filter database:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {skillStats.map(s => (
                  <button
                    key={s.name}
                    onClick={() => onFilterBySkill && onFilterBySkill(s.name)}
                    className={`text-xs px-2.5 py-1 rounded-xl ${theme.badgeRole} border font-medium hover:scale-105 transition-all flex items-center gap-1.5`}
                  >
                    <span>{s.name}</span>
                    <span className="opacity-60 text-[10px] font-bold">({s.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: COMPENSATION & RATES */}
      {activeTab === 'compensation' && (
        <div className="flex flex-col gap-6">
          {rateStats.validHourlyCount === 0 && (
            <div className={`p-5 rounded-2xl ${theme.bgCard} border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${theme.textPrimary}`}>No Real Rate Data Uploaded Yet</h4>
                  <p className={`text-xs ${theme.textSecondary} mt-0.5 max-w-2xl`}>
                    Placeholder estimates have been removed to preserve data integrity. Candidates currently have no billing expectations until real rates are set via directory edit (password: <span className="font-mono font-bold text-amber-500">MIHORAtlnt@1</span>) or uploaded via files with rate columns.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Rate Brackets */}
            <div className={`lg:col-span-7 ${theme.bgCard} ${theme.border} border p-6 rounded-2xl shadow-sm flex flex-col`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-base font-bold ${theme.textPrimary}`}>Hourly Rate Distribution</h3>
                  <p className={`text-xs ${theme.textSecondary}`}>
                    {rateStats.validHourlyCount > 0 
                      ? `${rateStats.validHourlyCount} candidates with verified billing tiers ($/hour)`
                      : 'Awaiting verified rate entries ($/hour)'}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rateStats.brackets} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="range" tick={{ fill: theme.id === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: theme.id === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }} />
                    <Tooltip contentStyle={customTooltipStyle} />
                    <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-500/20">
                {rateStats.brackets.map(b => (
                  <div key={b.range} className="p-3 rounded-xl bg-slate-500/5 text-center">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.textMuted}`}>{b.label}</span>
                    <div className={`text-base font-extrabold ${theme.textPrimary} mt-0.5`}>{b.range}</div>
                    <div className={`text-xs font-semibold ${theme.textAccent}`}>{b.count} candidates</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rate Benchmarks by Role */}
            <div className={`lg:col-span-5 ${theme.bgCard} ${theme.border} border p-6 rounded-2xl shadow-sm flex flex-col`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-base font-bold ${theme.textPrimary}`}>Benchmark Rate by Role</h3>
                  <p className={`text-xs ${theme.textSecondary}`}>Average verified market hourly expectation</p>
                </div>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>

              <div className="flex flex-col gap-3 flex-1 justify-center">
                {roleCategories.map(role => (
                  <div key={role.name} className="p-3 rounded-xl bg-slate-500/5 flex items-center justify-between">
                    <div className="truncate max-w-[200px]">
                      <div className={`text-xs font-bold ${theme.textPrimary} truncate`}>{role.name}</div>
                      <div className={`text-[11px] ${theme.textMuted}`}>{role.count} candidates on roster</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-extrabold ${theme.textAccent}`}>
                        {role.avgRate ? `$${role.avgRate}/hr` : '—'}
                      </div>
                      <div className={`text-[10px] ${theme.textMuted}`}>
                        {role.avgRate ? `~$${Math.round(role.avgRate * 160 * 0.9).toLocaleString()}/mo` : 'Rate pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
