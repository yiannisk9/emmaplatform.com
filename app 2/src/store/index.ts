// Zustand Store for Maritime Investment Platform

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  VesselData, AcquisitionData, ExitStrategy, OpexData, 
  SurveyData, AssumptionsData, SPVData, CharterYear, 
  RiskItem, ConclusionData 
} from '@/types';

interface AppState {
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

const defaultVessel: VesselData = {
  name: '',
  type: '',
  dwt: 0,
  draft: 0,
  built: '',
  flag: '',
  class: '',
  dims: '',
  engine: '',
  bhp: '',
  cranes: '',
  holds: '',
  grain: 0,
  bale: 0,
  tpc: 0,
  ldt: 0,
  gens: '',
  bwts: '',
  lastDD: '',
  notes: ''
};

const defaultAcquisition: AcquisitionData = {
  price: 0,
  vehicle: 'spv',
  equityPct: 45,
  debtPct: 55,
  interestRate: 7.05,
  tenor: 5,
  balloonPct: 30,
  rationale: ''
};

const defaultExit: ExitStrategy = {
  mode: 'dep',
  depRate: 5,
  scrapPrice: 350,
  manualExit: 0
};

const defaultOpex: OpexData = {
  crew: 1200000,
  stores: 350000,
  repairs: 300000,
  insurance: 350000,
  management: 150000,
  misc: 40000,
  inflation: 2.5,
  flatOverride: 0,
  notes: ''
};

const defaultSurvey: SurveyData = {
  ssCost: 1100000,
  isCost: 650000,
  otherCapex: 0
};

const defaultAssumptions: AssumptionsData = {
  tcRate: 12500,
  revenueDays: 350,
  opexDays: 365,
  holdPeriod: 5
};

const defaultSPV: SPVData = {
  minInvestment: 500000,
  mgmtFee: 1.5,
  commFee: 1.25,
  carry: 20
};

const defaultConclusion: ConclusionData = {
  recommendation: '',
  analyst: '',
  statement: ''
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      vessel: { ...defaultVessel },
      acquisition: { ...defaultAcquisition },
      exit: { ...defaultExit },
      opex: { ...defaultOpex },
      survey: { ...defaultSurvey },
      assumptions: { ...defaultAssumptions },
      charterYears: [],
      spv: { ...defaultSPV },
      risks: [],
      conclusion: { ...defaultConclusion },
      currentSection: 0,

      setVessel: (data) => set((state) => ({ vessel: { ...state.vessel, ...data } })),
      
      setAcquisition: (data) => set((state) => ({ 
        acquisition: { ...state.acquisition, ...data } 
      })),
      
      setExit: (data) => set((state) => ({ exit: { ...state.exit, ...data } })),
      
      setOpex: (data) => set((state) => ({ opex: { ...state.opex, ...data } })),
      
      setSurvey: (data) => set((state) => ({ survey: { ...state.survey, ...data } })),
      
      setAssumptions: (data) => set((state) => ({ 
        assumptions: { ...state.assumptions, ...data } 
      })),
      
      setCharterYear: (year, data) => set((state) => {
        const existing = state.charterYears.find(c => c.year === year);
        if (existing) {
          return {
            charterYears: state.charterYears.map(c => 
              c.year === year ? { ...c, ...data } : c
            )
          };
        }
        return {
          charterYears: [...state.charterYears, { year, rate: 0, days: 0, ...data }]
        };
      }),
      
      setSPV: (data) => set((state) => ({ spv: { ...state.spv, ...data } })),
      
      addRisk: (risk) => set((state) => ({ 
        risks: [...state.risks, risk] 
      })),
      
      removeRisk: (index) => set((state) => ({ 
        risks: state.risks.filter((_, i) => i !== index) 
      })),
      
      setConclusion: (data) => set((state) => ({ 
        conclusion: { ...state.conclusion, ...data } 
      })),
      
      setCurrentSection: (section) => set({ currentSection: section }),
      
      resetAll: () => set({
        vessel: { ...defaultVessel },
        acquisition: { ...defaultAcquisition },
        exit: { ...defaultExit },
        opex: { ...defaultOpex },
        survey: { ...defaultSurvey },
        assumptions: { ...defaultAssumptions },
        charterYears: [],
        spv: { ...defaultSPV },
        risks: [],
        conclusion: { ...defaultConclusion },
        currentSection: 0
      }),
      
      exportData: () => {
        const state = get();
        return {
          vessel: state.vessel,
          acquisition: state.acquisition,
          exit: state.exit,
          opex: state.opex,
          survey: state.survey,
          assumptions: state.assumptions,
          charterYears: state.charterYears,
          spv: state.spv,
          risks: state.risks,
          conclusion: state.conclusion
        };
      },
      
      importData: (data) => {
        const d = data as any;
        set({
          vessel: d.vessel || defaultVessel,
          acquisition: d.acquisition || defaultAcquisition,
          exit: d.exit || defaultExit,
          opex: d.opex || defaultOpex,
          survey: d.survey || defaultSurvey,
          assumptions: d.assumptions || defaultAssumptions,
          charterYears: d.charterYears || [],
          spv: d.spv || defaultSPV,
          risks: d.risks || [],
          conclusion: d.conclusion || defaultConclusion
        });
      }
    }),
    {
      name: 'maritime-investment-platform',
      partialize: (state) => ({
        vessel: state.vessel,
        acquisition: state.acquisition,
        exit: state.exit,
        opex: state.opex,
        survey: state.survey,
        assumptions: state.assumptions,
        charterYears: state.charterYears,
        spv: state.spv,
        risks: state.risks,
        conclusion: state.conclusion
      })
    }
  )
);
