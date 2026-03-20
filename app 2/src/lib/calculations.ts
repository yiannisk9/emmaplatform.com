// Financial Calculation Engine for Maritime Investment Platform

import type { 
  VesselData, AcquisitionData, ExitStrategy, OpexData, 
  SurveyData, AssumptionsData, SPVData, CharterYear,
  FinancialModel, DebtSchedule, CashFlowRow, HireRow 
} from '@/types';

// IRR Calculation using Newton-Raphson method
export function calcIRR(cfs: number[]): number {
  if (!cfs.length || cfs[0] >= 0) return 0;
  let r = 0.1;
  for (let i = 0; i < 800; i++) {
    let npv = 0, d = 0;
    for (let t = 0; t < cfs.length; t++) {
      const pw = Math.pow(1 + r, t);
      npv += cfs[t] / pw;
      d -= t * cfs[t] / (pw * (1 + r));
    }
    if (Math.abs(d) < 1e-12) break;
    const nr = r - npv / d;
    if (isNaN(nr) || nr < -0.999 || nr > 20) { r *= 0.5; continue; }
    if (Math.abs(nr - r) < 1e-9) { r = nr; break; }
    r = nr;
  }
  return r;
}

// Format currency values
export function fmtM(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return '—';
  const s = v < 0 ? '-' : '';
  const a = Math.abs(v);
  if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return s + '$' + Math.round(a / 1e3).toLocaleString() + 'K';
  return s + '$' + Math.round(a).toLocaleString();
}

export function fmtFull(v: number | null | undefined): string {
  if (!v && v !== 0) return '—';
  const s = v < 0 ? '-' : '';
  return s + '$' + Math.round(Math.abs(v)).toLocaleString();
}

export function fmtPct(v: number): string {
  return (v * 100).toFixed(1) + '%';
}

// Main financial model computation
export function computeModel(
  vessel: VesselData,
  acquisition: AcquisitionData,
  exit: ExitStrategy,
  opex: OpexData,
  survey: SurveyData,
  assumptions: AssumptionsData,
  charterYears: CharterYear[],
  spv: SPVData
): FinancialModel {
  // === INPUTS ===
  const price = acquisition.price || 0;
  const eqPct = (acquisition.equityPct || 45) / 100;
  const debtPct = (acquisition.debtPct || 55) / 100;
  const ballPct = (acquisition.balloonPct || 30) / 100;
  const ir = (acquisition.interestRate || 7.05) / 100;
  const tenor = acquisition.tenor || 5;
  const hold = assumptions.holdPeriod || 5;
  const rdays = assumptions.revenueDays || 350;
  const odays = assumptions.opexDays || 365;
  const tc = assumptions.tcRate || 0;
  const dep = (exit.depRate || 5) / 100;

  // === CAPITAL STRUCTURE ===
  const equity = price * eqPct;
  const debt = price * debtPct;
  const balloon = debt * ballPct;
  const amort = debt * (1 - ballPct);
  const annPrinc = tenor > 0 ? amort / tenor : 0;

  // === OPEX CALCULATIONS ===
  const flat = opex.flatOverride || 0;
  const opexInflation = (opex.inflation || 2.5) / 100;
  
  let opexDailyY1: number;
  if (flat > 0) {
    opexDailyY1 = flat;
  } else {
    const ann = (opex.crew || 0) + (opex.stores || 0) + (opex.repairs || 0) + 
                (opex.insurance || 0) + (opex.management || 0) + (opex.misc || 0);
    opexDailyY1 = odays > 0 ? ann / odays : ann / 365;
  }
  
  const opexDaily = opexDailyY1;
  const opexAnn = opexDailyY1 * odays;

  // === SURVEY AMORTIZATION ===
  const svTotal = (survey.ssCost || 0) + (survey.isCost || 0) + (survey.otherCapex || 0);
  const svDays = hold * odays;
  const svDaily = svDays > 0 ? svTotal / svDays : 0;
  const svAnn = svDaily * odays;

  const allinDaily = opexDailyY1 + svDaily;
  const allinAnn = allinDaily * odays;

  // === DEBT SCHEDULE ===
  const ds: DebtSchedule[] = [];
  let bal = debt;
  for (let y = 0; y < hold; y++) {
    const interest = bal * ir;
    const principal = y < tenor ? annPrinc : 0;
    ds.push({ interest, principal, total: interest + principal, balance: bal });
    bal = Math.max(0, bal - principal);
  }
  
  const dsY1 = ds[0]?.total || 0;
  const beDaily = allinDaily + (dsY1 / 365);
  const beAnn = allinAnn + dsY1;
  const dscr = dsY1 > 0 ? (tc * rdays - allinAnn) / dsY1 : 0;
  const margin = tc - beDaily;

  // === EXIT VALUE ===
  let exitVal = 0;
  if (exit.mode === 'dep') {
    exitVal = price > 0 ? price * Math.pow(1 - dep, hold) : 0;
  } else if (exit.mode === 'scrap') {
    exitVal = (exit.scrapPrice || 350) * (vessel.ldt || 0);
  } else {
    exitVal = exit.manualExit || 0;
  }

  const netExit = exitVal - balloon;
  const annRev = tc * rdays;
  const opCF = annRev - allinAnn;

  // === FEE RATES ===
  const mgmtFeeRate = (spv.mgmtFee || 1.5) / 100;
  const commFeeRate = (spv.commFee || 1.25) / 100;
  const carryRate = (spv.carry || 20) / 100;

  // === CASH FLOW PROJECTIONS ===
  const cfs: number[] = [-equity];           // Project cash flows (no fees)
  const cfsFee: number[] = [-equity];        // Investor cash flows (with annual fees)
  const rows: CashFlowRow[] = [];
  let cum = 0;
  let totalFees = 0;
  
  for (let y = 0; y < hold; y++) {
    const inflFactor = Math.pow(1 + opexInflation, y);
    const opexYr = opexDailyY1 * inflFactor * odays;
    const allinYr = opexYr + svAnn;
    const mgmtFeeAnn = price * mgmtFeeRate;
    const commFeeAnn = annRev * commFeeRate;
    const annFees = mgmtFeeAnn + commFeeAnn;
    const isLast = y === hold - 1;
    
    // Project CF: Revenue - OPEX - Debt Service + Exit (if last year)
    const cf = annRev - allinYr - ds[y].total + (isLast ? netExit : 0);
    
    // Investor CF: Project CF - Annual Fees
    const cfFee = cf - annFees;
    
    cfs.push(cf);
    cfsFee.push(cfFee);
    totalFees += annFees;
    cum += cf;
    
    rows.push({
      year: y + 1,
      revenue: annRev,
      opex: allinYr,
      opexBase: opexYr,
      surveyAmort: svAnn,
      annFees,
      mgmtFeeAnn,
      commFeeAnn,
      dsTotal: ds[y].total,
      inflFactor,
      cf,
      cfFee,
      cum,
      isLast
    });
  }

  // === IRR CALCULATIONS ===
  const irr = equity > 0 ? calcIRR(cfs) : 0;                    // Project IRR (pre-fee)
  const irrFee = equity > 0 ? calcIRR(cfsFee) : 0;              // Investor IRR (post-fee, pre-carry)
  
  // === TOTAL RETURNS ===
  const totalRet = cfs.slice(1).reduce((a, b) => a + b, 0);     // Total project return
  const totalRetFee = cfsFee.slice(1).reduce((a, b) => a + b, 0); // Total investor return (post-fee)
  
  // === ROI & MULTIPLE (based on post-fee returns for investor perspective) ===
  const roi = equity > 0 ? (totalRetFee - equity) / equity : 0;
  const mult = equity > 0 ? totalRetFee / equity : 0;

  // === CARRY CALCULATION ===
  // Exit profit = Total investor return - Equity invested
  const exitProfit = totalRetFee - equity;
  const carryAmount = exitProfit > 0 ? exitProfit * carryRate : 0;
  
  // === IRR AFTER CARRY ===
  // Subtract carry from the final year's cash flow
  const cfsCarry = [...cfsFee];
  if (cfsCarry.length > 1 && carryAmount > 0) {
    cfsCarry[cfsCarry.length - 1] -= carryAmount;
  }
  const irrCarry = equity > 0 ? calcIRR(cfsCarry) : 0;

  // === NET TO INVESTOR ===
  // Total cash received by investor after all fees and carry
  const netToInvestor = totalRetFee - carryAmount;

  // === CHARTER HIRE ROWS ===
  const hireRows: HireRow[] = [];
  let hireTotalIncome = 0, hireTotalCosts = 0, hireTotalNet = 0, cum10 = 0;
  
  for (let y = 1; y <= hold; y++) {
    const charterYear = charterYears.find(c => c.year === y);
    const hireRate = charterYear?.rate || tc;
    const hireDays = charterYear?.days || rdays;
    const income = hireRate * hireDays;
    const inflFactor = Math.pow(1 + opexInflation, y - 1);
    const opexYr = opexDailyY1 * inflFactor * odays;
    const opexCost = opexYr + svAnn;
    const dsCost = ds[y - 1]?.total || 0;
    const totalCost = opexCost + dsCost;
    const netCF = income - totalCost;
    cum10 += netCF;
    hireRows.push({ year: y, hireRate, hireDays, income, opexCost, dsCost, totalCost, netCF, cum: cum10 });
    hireTotalIncome += income;
    hireTotalCosts += totalCost;
    hireTotalNet += netCF;
  }
  
  const hireRates = hireRows.map(r => r.hireRate).filter(r => r > 0);
  const hireAvgRate = hireRates.length ? hireRates.reduce((a, b) => a + b, 0) / hireRates.length : 0;

  return {
    price, equity, debt, eqPct, debtPct, balloon, annPrinc, ir, tenor, hold,
    rdays, odays, tc, dep, opexDaily, opexAnn, svTotal, svDaily, svAnn,
    allinDaily, allinAnn, ds, dsY1, beDaily, beAnn, dscr, margin,
    exitVal, netExit, annRev, opCF, cfs, rows, irr, irrFee, irrCarry,
    totalRet, roi, mult, opexInflation, mgmtFeeRate, commFeeRate, carryRate,
    exitProfit, carryAmount, netToInvestor,
    hireRows, hireTotalIncome, hireTotalCosts, hireTotalNet, hireAvgRate
  };
}

// Sensitivity analysis
export interface SensitivityPoint {
  tc: number;
  irr: number;
  roi: number;
}

export function computeSensitivity(
  baseTC: number,
  model: FinancialModel
): SensitivityPoint[] {
  const low = Math.max(2000, Math.round(baseTC * 0.5 / 500) * 500);
  const high = Math.round(baseTC * 2 / 500) * 500;
  const step = Math.max(500, Math.round((high - low) / 14 / 500) * 500);
  const tcs: number[] = [];
  
  for (let t = low; t <= high; t += step) tcs.push(t);
  if (!tcs.includes(baseTC)) tcs.push(baseTC);
  tcs.sort((a, b) => a - b);

  return tcs.map(tc => {
    const cfs = [-model.equity];
    for (let y = 0; y < model.hold; y++) {
      const infl = Math.pow(1 + model.opexInflation, y);
      const opYr = model.opexDaily * infl * model.odays;
      const alYr = opYr + model.svAnn;
      let cf = tc * model.rdays - alYr - model.ds[y].total;
      if (y === model.hold - 1) cf += model.netExit;
      cfs.push(cf);
    }
    const irr = model.equity > 0 ? calcIRR(cfs) : 0;
    const tot = cfs.slice(1).reduce((a, b) => a + b, 0);
    const roi = model.equity > 0 ? (tot - model.equity) / model.equity : 0;
    return { tc, irr, roi };
  });
}

// Find T/C rate for target INVESTOR IRR (post-fee, pre-carry)
export function findTCForIRR(targetIRR: number, model: FinancialModel): number | null {
  for (let t = 2000; t <= 80000; t += 200) {
    // Calculate investor cash flows (with annual fees deducted)
    const cfsFee = [-model.equity];
    for (let y = 0; y < model.hold; y++) {
      const infl = Math.pow(1 + model.opexInflation, y);
      const opYr = model.opexDaily * infl * model.odays;
      const alYr = opYr + model.svAnn;
      
      // Project CF: Revenue - OPEX - Debt Service + Exit
      let cf = t * model.rdays - alYr - model.ds[y].total;
      if (y === model.hold - 1) cf += model.netExit;
      
      // Annual fees
      const mgmtFeeAnn = model.price * model.mgmtFeeRate;
      const commFeeAnn = (t * model.rdays) * model.commFeeRate;
      const annFees = mgmtFeeAnn + commFeeAnn;
      
      // Investor CF: Project CF - Fees
      cfsFee.push(cf - annFees);
    }
    
    if (model.equity > 0 && calcIRR(cfsFee) >= targetIRR) return t;
  }
  return null;
}

// Parse month/year for survey dates
export function parseMonthYear(s: string): Date | null {
  if (!s) return null;
  s = s.trim();
  const mon: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
  };
  
  let m = s.match(/([a-z]+)[\s\-/](\d{4})/i);
  if (m) {
    const k = mon[m[1].toLowerCase()];
    if (k !== undefined) return new Date(parseInt(m[2]), k, 1);
  }
  m = s.match(/^(\d{1,2})[\-/](\d{4})$/);
  if (m) return new Date(parseInt(m[2]), parseInt(m[1]) - 1, 1);
  m = s.match(/^(\d{4})[\-/](\d{1,2})$/);
  if (m) return new Date(parseInt(m[1]), parseInt(m[2]) - 1, 1);
  m = s.match(/^(\d{4})$/);
  if (m) return new Date(parseInt(m[1]), 0, 1);
  return null;
}

export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

export function fmtMY(d: Date | null): string {
  return d ? d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—';
}

export function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}
