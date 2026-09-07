import { Candidate } from './types';

export const stripUndefined = (obj: any): any => {
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.filter(item => item !== undefined).map(stripUndefined);
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = stripUndefined(obj[key]);
    }
  }
  return newObj;
};

export const parseSeniority = (experienceStr: string = '', roleStr: string = ''): 'Junior' | 'Mid' | 'Senior' | 'Lead/Principal' => {
  const exp = experienceStr.toLowerCase();
  const role = roleStr.toLowerCase();

  if (role.includes('lead') || role.includes('principal') || role.includes('head') || role.includes('manager')) {
    return 'Lead/Principal';
  }

  // Check for numbers
  const match = exp.match(/(\d+(\.\d+)?)/);
  if (match) {
    const years = parseFloat(match[1]);
    if (years >= 8) return 'Lead/Principal';
    if (years >= 4) return 'Senior';
    if (years >= 2) return 'Mid';
    return 'Junior';
  }

  if (exp.includes('month') || exp.includes('intern')) return 'Junior';
  if (exp.includes('senior') || exp.includes('sr')) return 'Senior';

  return 'Mid';
};

export const parseLocation = (locStr: string = ''): { city: string; country: string } => {
  if (!locStr) return { city: 'Remote / Unspecified', country: 'Global' };

  const raw = locStr.trim();
  const parts = raw.split(',').map(p => p.trim());

  if (parts.length >= 2) {
    return { city: parts[0], country: parts[1] };
  }

  // Single word heuristics
  const l = raw.toLowerCase();
  if (l.includes('pakistan') || l.includes('lahore') || l.includes('islamabad') || l.includes('karachi') || l.includes('rawalpindi') || l.includes('sahiwal') || l.includes('sargodha') || l.includes('multan') || l.includes('gilgit') || l.includes('rahim yar khan')) {
    return { city: raw, country: 'Pakistan' };
  }
  if (l.includes('bangladesh') || l.includes('dhaka')) {
    return { city: raw, country: 'Bangladesh' };
  }
  if (l.includes('nigeria') || l.includes('lagos') || l.includes('abuja')) {
    return { city: raw, country: 'Nigeria' };
  }
  if (l.includes('uk') || l.includes('london') || l.includes('leeds') || l.includes('derby') || l.includes('luton')) {
    return { city: raw, country: 'United Kingdom' };
  }
  if (l.includes('egypt') || l.includes('cairo') || l.includes('toukh')) {
    return { city: raw, country: 'Egypt' };
  }
  if (l.includes('brazil')) return { city: raw, country: 'Brazil' };
  if (l.includes('france')) return { city: raw, country: 'France' };
  if (l.includes('finland') || l.includes('helsinki')) return { city: raw, country: 'Finland' };
  if (l.includes('ireland') || l.includes('dublin')) return { city: raw, country: 'Ireland' };
  if (l.includes('oman') || l.includes('muscat')) return { city: raw, country: 'Oman' };
  if (l.includes('geneva') || l.includes('switzerland')) return { city: 'Geneva', country: 'Switzerland' };
  if (l.includes('argentina')) return { city: raw, country: 'Argentina' };
  if (l.includes('netherlands') || l.includes('amsterdam')) return { city: raw, country: 'Netherlands' };
  if (l.includes('south africa')) return { city: raw, country: 'South Africa' };
  if (l.includes('tunisia') || l.includes('tunis')) return { city: raw, country: 'Tunisia' };
  if (l.includes('australia') || l.includes('elizabeth vale')) return { city: raw, country: 'Australia' };
  if (l.includes('antwerp') || l.includes('belgium')) return { city: 'Antwerp', country: 'Belgium' };

  return { city: raw, country: raw };
};

export const getDefaultRate = (candidate: Partial<Candidate>): { hourlyRate?: number; salaryExpectation?: number } => {
  return {
    hourlyRate: candidate.hourlyRate,
    salaryExpectation: candidate.salaryExpectation
  };
};

export const formatPhoneNumber = (phone: string, location: string = '') => {
  if (!phone) return '';
  let clean = phone.replace(/[^\d+]/g, '');
  const loc = location.toLowerCase();
  
  if (clean.startsWith('0')) {
    if (loc.includes('pakistan') || loc.includes('lahore') || loc.includes('islamabad') || loc.includes('karachi') || loc.includes('sahiwal')) {
      clean = '+92' + clean.substring(1);
    } else if (loc.includes('bangladesh') || loc.includes('dhaka')) {
      clean = '+880' + clean.substring(1);
    } else if (loc.includes('nigeria') || loc.includes('abuja') || loc.includes('lagos')) {
      clean = '+234' + clean.substring(1);
    } else if (loc.includes('india') || loc.includes('delhi') || loc.includes('mumbai')) {
      clean = '+91' + clean.substring(1);
    }
  } else if (!clean.startsWith('+') && clean.length >= 10) {
     clean = '+' + clean;
  }
  
  const match = clean.match(/^(\+\d{1,3})(\d{3,4})(\d{4,7})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]}`;
  } else if (clean.length > 5 && clean.startsWith('+')) {
      return clean.replace(/(\+\d{1,3})(\d+)/, '$1 $2');
  }
  
  return phone;
};

export const isSafeUrl = (url?: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const sanitizeInputText = (val: any, maxLength = 2000): string => {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .slice(0, maxLength);
};
