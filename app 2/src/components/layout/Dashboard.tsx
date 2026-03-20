import { useAppStore } from '@/store';
import { computeModel, fmtM } from '@/lib/calculations';

function fmtPct(v: number): string {
  return (v * 100).toFixed(1) + '%';
}

export function Dashboard() {
  const { vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv } = useAppStore();
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  const hasData = model.price > 0 && model.tc > 0;
  
  // Status color
  const irrColor = model.irrCarry >= 0.1 
    ? 'hsl(var(--green))' 
    : model.irrCarry >= 0.05 
    ? 'hsl(var(--amber))' 
    : model.irrCarry >= 0 
    ? 'hsl(var(--amber))' 
    : 'hsl(var(--red))';
  
  const marginColor = model.margin >= 0 ? 'hsl(var(--green))' : 'hsl(var(--red))';
  const dscrColor = model.dscr >= 1 ? 'hsl(var(--green))' : 'hsl(var(--red))';
  const netExitColor = model.netExit >= 0 ? 'hsl(var(--gold))' : 'hsl(var(--red))';
  
  // Cash flow chart data
  const cfData = model.rows.map(r => ({
    year: `Y${r.year}`,
    value: r.cf,
    isLast: r.isLast
  }));
  
  // Mini sensitivity data
  const sensData = hasData ? [
    model.tc * 0.7,
    model.tc * 0.85,
    model.tc,
    model.tc * 1.15,
    model.tc * 1.3
  ].map(tc => {
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
    return { tc, irr };
  }) : [];
  
  function calcIRR(cfs: number[]): number {
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
  
  // Status message
  let statusMsg = '';
  let statusClass = '';
  if (hasData) {
    const mg = model.tc - model.beDaily;
    if (model.irrCarry >= 0.08 && mg >= 0) {
      statusMsg = `Viable — +$${Math.round(mg).toLocaleString()}/d`;
      statusClass = 'text-[hsl(var(--green))] bg-[hsl(var(--green-dim))] border-[hsl(150,65%,53%,0.3)]';
    } else if (model.irrCarry >= 0) {
      statusMsg = 'Marginal — near breakeven';
      statusClass = 'text-[hsl(var(--amber))] bg-[hsl(var(--amber-dim))] border-[hsl(35,85%,55%,0.3)]';
    } else {
      statusMsg = `At risk — $${Math.round(Math.abs(mg)).toLocaleString()}/d below BE`;
      statusClass = 'text-[hsl(var(--red))] bg-[hsl(var(--red-dim))] border-[hsl(0,65%,55%,0.3)]';
    }
  }
  
  return (
    <aside className="w-[280px] flex-shrink-0 bg-[hsl(220,25%,7%)] border-l border-[hsl(var(--border))] overflow-y-auto scrollbar-thin py-4">
      {/* Status */}
      {hasData && statusMsg && (
        <div className={`mx-3.5 mb-2.5 rounded-lg p-2.5 text-xs border ${statusClass}`}>
          {statusMsg}
        </div>
      )}
      
      {/* Key Returns */}
      <div className="px-3.5 pb-3.5">
        <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-[hsl(var(--text3))] px-3.5 py-2">
          Key Returns
        </div>
        
        {/* IRR */}
        <div className="flex gap-1.5 mb-1.5">
          <div className="flex-[2] bg-[hsl(var(--gold-dim))] border border-[hsl(var(--gold-border))] rounded-lg p-2.5">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide">IRR (after all fees + carry)</div>
            <div className="font-mono text-lg font-medium" style={{ color: irrColor }}>
              {hasData ? fmtPct(model.irrCarry) : '—'}
            </div>
          </div>
        </div>
        
        {/* ROI & Multiple */}
        <div className="flex gap-1.5 mb-1.5">
          <div className="flex-1 bg-[hsl(var(--panel))] border border-[hsl(var(--border))] rounded-lg p-2.5">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide">ROI</div>
            <div className={`font-mono text-base font-medium ${model.roi >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
              {hasData ? fmtPct(model.roi) : '—'}
            </div>
          </div>
          <div className="flex-1 bg-[hsl(var(--panel))] border border-[hsl(var(--border))] rounded-lg p-2.5">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide">Multiple</div>
            <div className="font-mono text-base font-medium text-[hsl(var(--text))]">
              {hasData ? model.mult.toFixed(2) + 'x' : '—'}
            </div>
          </div>
        </div>
        
        {/* Net Exit */}
        <div className="flex gap-1.5">
          <div className="flex-1 bg-[hsl(var(--panel))] border border-[hsl(var(--border))] rounded-lg p-2.5">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide">Net Exit (after balloon)</div>
            <div className="font-mono text-base font-medium" style={{ color: netExitColor }}>
              {hasData ? fmtM(model.netExit) : '—'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Cost & Breakeven */}
      <div className="px-3.5 pb-3.5">
        <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-[hsl(var(--text3))] px-3.5 py-2">
          Cost & Breakeven
        </div>
        
        <div className="flex gap-1.5 mb-1.5">
          <div className="flex-1 bg-[hsl(var(--panel))] border border-[hsl(var(--border))] rounded-lg p-2.5">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide">Breakeven T/C</div>
            <div className="font-mono text-base font-medium text-[hsl(var(--text))]">
              {hasData ? `$${Math.round(model.beDaily).toLocaleString()}/d` : '—'}
            </div>
          </div>
          <div className="flex-1 bg-[hsl(var(--panel))] border border-[hsl(var(--border))] rounded-lg p-2.5">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide">Daily Margin</div>
            <div className="font-mono text-base font-medium" style={{ color: marginColor }}>
              {hasData ? `${model.margin >= 0 ? '+' : ''}$${Math.round(model.margin).toLocaleString()}/d` : '—'}
            </div>
          </div>
        </div>
        
        <div className="flex gap-1.5">
          <div className="flex-1 bg-[hsl(var(--panel))] border border-[hsl(var(--border))] rounded-lg p-2.5">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide">DSCR (Y1)</div>
            <div className="font-mono text-base font-medium" style={{ color: dscrColor }}>
              {hasData ? model.dscr.toFixed(2) + 'x' : '—'}
            </div>
          </div>
          <div className="flex-1 bg-[hsl(var(--panel))] border border-[hsl(var(--border))] rounded-lg p-2.5">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide">Equity</div>
            <div className="font-mono text-base font-medium text-[hsl(var(--gold))]">
              {hasData ? fmtM(model.equity) : '—'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Cash Flow Bars */}
      {hasData && cfData.length > 0 && (
        <div className="px-3.5 pb-3.5">
          <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-[hsl(var(--text3))] px-3.5 py-2">
            Cash Flow Bars
          </div>
          <div className="h-20 flex items-end gap-1 px-3.5">
            {cfData.map((d, i) => {
              const maxCF = Math.max(...cfData.map(x => Math.abs(x.value)), 1);
              const h = Math.max(2, Math.round(Math.abs(d.value) / maxCF * 70));
              const color = d.isLast ? '#c9a84c' : d.value >= 0 ? '#3dcf8a' : '#e05555';
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div 
                    className="w-full rounded-t-sm opacity-85" 
                    style={{ height: `${h}px`, backgroundColor: color }}
                  />
                  <div className="text-[8px] text-[hsl(var(--text3))]">{d.year}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* T/C Sensitivity */}
      {hasData && sensData.length > 0 && (
        <div className="px-3.5">
          <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-[hsl(var(--text3))] px-3.5 py-2">
            T/C Sensitivity
          </div>
          <div className="px-3.5">
            {sensData.map((d, i) => {
              const isBase = Math.abs(d.tc - model.tc) < 1;
              const color = d.irr >= 0.1 ? 'hsl(var(--green))' : d.irr >= 0 ? 'hsl(var(--amber))' : 'hsl(var(--red))';
              return (
                <div 
                  key={i} 
                  className="flex justify-between items-center py-1 border-b border-[hsl(var(--border))] last:border-b-0"
                >
                  <span className={`font-mono text-[10px] ${isBase ? 'text-[hsl(var(--gold2))] font-bold' : 'text-[hsl(var(--text2))]'}`}>
                    ${Math.round(d.tc).toLocaleString()}/d
                  </span>
                  <span className="font-mono text-[10px] font-medium" style={{ color }}>
                    {(d.irr * 100).toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
