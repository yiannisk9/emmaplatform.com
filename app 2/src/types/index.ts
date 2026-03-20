// Maritime Investment Platform - Type Definitions

export interface VesselData {
  name: string;
  type: string;
  dwt: number;
  draft: number;
  built: string;
  flag: string;
  class: string;
  dims: string;
  engine: string;
  bhp: string;
  cranes: string;
  holds: string;
  grain: number;
  bale: number;
  tpc: number;
  ldt: number;
  gens: string;
  bwts: 'yes' | 'no' | 'pending' | '';
  lastDD: string;
  notes: string;
}

export interface AcquisitionData {
  price: number;
  vehicle: 'spv' | 'direct' | 'jv';
  equityPct: number;
  debtPct: number;
  interestRate: number;
  tenor: number;
  balloonPct: number;
  rationale: string;
}

export interface ExitStrategy {
  mode: 'dep' | 'scrap' | 'manual';
  depRate: number;
  scrapPrice: number;
  manualExit: number;
}

export interface OpexData {
  crew: number;
  stores: number;
  repairs: number;
  insurance: number;
  management: number;
  misc: number;
  inflation: number;
  flatOverride: number;
  notes: string;
}

export interface SurveyData {
  ssCost: number;
  isCost: number;
  otherCapex: number;
}

export interface AssumptionsData {
  tcRate: number;
  revenueDays: number;
  opexDays: number;
  holdPeriod: number;
}

export interface CharterYear {
  year: number;
  rate: number;
  days: number;
}

export interface SPVData {
  minInvestment: number;
  mgmtFee: number;
  commFee: number;
  carry: number;
}

export interface RiskItem {
  factor: string;
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  mitigation: string;
}

export interface ConclusionData {
  recommendation: 'proceed' | 'conditional' | 'decline' | '';
  analyst: string;
  statement: string;
}

// Calculated/derived data
export interface DebtSchedule {
  interest: number;
  principal: number;
  total: number;
  balance: number;
}

export interface CashFlowRow {
  year: number;
  revenue: number;
  opex: number;
  opexBase: number;
  surveyAmort: number;
  annFees: number;
  mgmtFeeAnn: number;
  commFeeAnn: number;
  dsTotal: number;
  inflFactor: number;
  cf: number;
  cfFee: number;
  cum: number;
  isLast: boolean;
}

export interface HireRow {
  year: number;
  hireRate: number;
  hireDays: number;
  income: number;
  opexCost: number;
  dsCost: number;
  totalCost: number;
  netCF: number;
  cum: number;
}

export interface FinancialModel {
  // Inputs
  price: number;
  equity: number;
  debt: number;
  eqPct: number;
  debtPct: number;
  balloon: number;
  annPrinc: number;
  ir: number;
  tenor: number;
  hold: number;
  rdays: number;
  odays: number;
  tc: number;
  dep: number;
  
  // OPEX
  opexDaily: number;
  opexAnn: number;
  opexInflation: number;
  
  // Survey
  svTotal: number;
  svDaily: number;
  svAnn: number;
  
  // Totals
  allinDaily: number;
  allinAnn: number;
  
  // Debt
  ds: DebtSchedule[];
  dsY1: number;
  
  // Breakeven
  beDaily: number;
  beAnn: number;
  dscr: number;
  margin: number;
  
  // Exit
  exitVal: number;
  netExit: number;
  
  // Revenue
  annRev: number;
  opCF: number;
  
  // Cash flows
  cfs: number[];
  rows: CashFlowRow[];
  
  // Returns
  irr: number;
  irrFee: number;
  irrCarry: number;
  totalRet: number;
  roi: number;
  mult: number;
  
  // Fees
  mgmtFeeRate: number;
  commFeeRate: number;
  carryRate: number;
  exitProfit: number;
  carryAmount: number;
  netToInvestor: number;
  
  // Hire
  hireRows: HireRow[];
  hireTotalIncome: number;
  hireTotalCosts: number;
  hireTotalNet: number;
  hireAvgRate: number;
}

export interface AppState {
  // Form data
  vessel: VesselData;
  acquisition: AcquisitionData;
  exit: ExitStrategy;
  opex: OpexData;
  survey: SurveyData;
  assumptions: AssumptionsData;
  charterYears: CharterYear[];
  spv: SPVData;
  risks: RiskItem[];
  conclusion: ConclusionData;
  
  // UI state
  currentSection: number;
  
  // Actions
  setVessel: (data: Partial<VesselData>) => void;
  setAcquisition: (data: Partial<AcquisitionData>) => void;
  setExit: (data: Partial<ExitStrategy>) => void;
  setOpex: (data: Partial<OpexData>) => void;
  setSurvey: (data: Partial<SurveyData>) => void;
  setAssumptions: (data: Partial<AssumptionsData>) => void;
  setCharterYear: (year: number, data: Partial<CharterYear>) => void;
  setSPV: (data: Partial<SPVData>) => void;
  addRisk: (risk: RiskItem) => void;
  removeRisk: (index: number) => void;
  setConclusion: (data: Partial<ConclusionData>) => void;
  setCurrentSection: (section: number) => void;
  resetAll: () => void;
  exportData: () => object;
  importData: (data: object) => void;
}
