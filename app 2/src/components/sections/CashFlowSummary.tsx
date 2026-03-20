import { useAppStore } from '@/store';
import { computeModel, fmtFull, fmtPct } from '@/lib/calculations';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

export function CashFlowSummary() {
  const { vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv } = useAppStore();
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  const hasData = model.equity > 0;
  
  const irrColor = model.irrCarry >= 0.1 
    ? 'text-[hsl(var(--green))]' 
    : model.irrCarry >= 0.05 
    ? 'text-[hsl(var(--amber))]' 
    : model.irrCarry >= 0 
    ? 'text-[hsl(var(--amber))]' 
    : 'text-[hsl(var(--red))]';
  
  // Chart data
  const chartData = model.rows.map(r => ({
    year: `Y${r.year}${r.isLast ? ' (Exit)' : ''}`,
    value: r.cf,
    isLast: r.isLast
  }));
  
  return (
    <div className="space-y-5">
      {/* Key Returns */}
      <div className="flex gap-2.5 flex-wrap">
        <div className="metric-tile metric-tile-highlight">
          <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">IRR (after all fees + carry)</div>
          <div className={`font-mono text-xl font-medium ${irrColor}`}>
            {hasData ? fmtPct(model.irrCarry) : '—'}
          </div>
        </div>
        <div className="metric-tile metric-tile-highlight">
          <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">ROI</div>
          <div className={`font-mono text-xl font-medium ${model.roi >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
            {hasData ? fmtPct(model.roi) : '—'}
          </div>
        </div>
        <div className="metric-tile metric-tile-highlight">
          <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Equity Multiple</div>
          <div className="font-mono text-xl font-medium text-[hsl(var(--text))]">
            {hasData ? model.mult.toFixed(2) + 'x' : '—'}
          </div>
        </div>
      </div>
      
      {/* Cash Flow Chart */}
      {chartData.length > 0 && (
        <div className="maritime-card">
          <div className="maritime-card-head">Annual Cash Flows to Equity</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="year" tick={{ fill: 'hsl(var(--text3))', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fill: 'hsl(var(--text3))', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isLast ? '#c9a84c' : entry.value >= 0 ? '#3dcf8a' : '#e05555'}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Detailed Cash Flow Table */}
      {model.rows.length > 0 && (
        <div className="maritime-card">
          <div className="maritime-card-head flex items-center gap-2">
            Detailed Cash Flow Table
            <span className="text-[10px] text-[hsl(var(--amber))] font-normal normal-case">
              OPEX inflated at {(model.opexInflation * 100).toFixed(1)}%/yr compound
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Year</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Revenue</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">OPEX (inflated)</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Debt Service</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Net CF</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {model.rows.map((r) => (
                  <tr key={r.year} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${r.isLast ? 'bg-[hsl(var(--panel2))] font-semibold' : ''}`}>
                    <td className="py-2 px-2 text-[hsl(var(--text2))]">
                      Year {r.year}{r.isLast ? ' (Exit)' : ''}
                    </td>
                    <td className="py-2 px-2 font-mono text-right text-[hsl(var(--green))]">{fmtFull(r.revenue)}</td>
                    <td className="py-2 px-2 font-mono text-right text-[hsl(var(--red))] whitespace-nowrap">
                      ({fmtFull(r.opex)})
                      {r.year > 1 && (
                        <span className="text-[9px] text-[hsl(var(--amber))] ml-1">
                          +{(model.opexInflation * 100).toFixed(1)}%×{r.year - 1}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 font-mono text-right text-[hsl(var(--red))]">({fmtFull(r.dsTotal)})</td>
                    <td className={`py-2 px-2 font-mono text-right ${r.cf >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
                      {fmtFull(r.cf)}
                    </td>
                    <td className={`py-2 px-2 font-mono text-right ${r.cum >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
                      {fmtFull(r.cum)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
