export type PipelineStage = 'Available on Bench' | 'Screening' | 'Client Submitted' | 'Interviewing' | 'Placed / Engaged';

export type CompensationType = 
  | 'Hourly' 
  | 'Monthly Salary' 
  | 'Annual Package' 
  | 'Daily Rate' 
  | 'Project / Contract' 
  | 'Custom / Negotiable';

export type EmploymentType = 
  | 'Full-time' 
  | 'Part-time' 
  | 'Contract / Freelance' 
  | 'C2C / 1099' 
  | 'Flexible';

export interface Scorecard {
  technicalRating?: number;
  communicationClarity?: number;
  englishProficiency?: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
  availabilityDate?: string;
  notes?: string;
}

export interface Candidate {
  id: string;
  name: string;
  role: string;
  skills: string;
  experience: string;
  seniority?: 'Junior' | 'Mid' | 'Senior' | 'Lead/Principal';
  specialization?: string;
  location?: string;
  country?: string;
  city?: string;
  email?: string;
  whatsapp?: string;
  portfolio?: string;
  cv?: string;
  cvFileName?: string;
  cvFileType?: string;
  cvFileData?: string;
  hourlyRate?: number;
  salaryExpectation?: number;
  minSalary?: number;
  compensationType?: CompensationType;
  currency?: string;
  employmentType?: EmploymentType;
  compensationNotes?: string;
  benefits?: string[];
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  pipelineStage?: PipelineStage;
  scorecard?: Scorecard;
  preferredTimezones?: string[];
}

export interface CandidateFilters {
  searchTerm: string;
  selectedRoles: string[];
  selectedSkills: string[];
  selectedExperience: string[];
  selectedSeniority: string[];
  selectedCountries: string[];
  selectedTimezones?: string[];
  selectedPipelineStages?: PipelineStage[];
  minRate?: number;
  maxRate?: number;
}
