import { useAppStore } from '@/store';
import { computeModel, fmtFull } from '@/lib/calculations';

export function OwnershipCosts() {
  const { vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv } = useAppStore();
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  const hasData = model.price > 0 && model.tc > 0;
  
  // Bar chart data
  const barData = [
    { name: 'Base OPEX', value: model.opexDaily, color: '#4a8fe0' },
    { name: 'Survey/d', value: model.svDaily, color: '#7070d0' },
    { name: 'Debt svc', value: model.dsY1 / 365, color: '#6070a0' },
    { name: 'Breakeven', value: model.beDaily, color: '#c9a84c' },
    { name: 'T/C rate', value: model.tc, color: model.tc >= model.beDaily ? '#3dcf8a' : '#e05555' }
  ];
  
  const marginColor = model.margin >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]';
  const dscrColor = model.dscr >= 1.2 ? 'text-[hsl(var(--green))]' : model.dscr >= 1 ? 'text-[hsl(var(--amber))]' : 'text-[hsl(var(--red))]';
  
  return (
    <div className="space-y-5">
      {/* Daily Cost Stack */}
      <div className="maritime-card">
        <div className="maritime-card-head">Daily Cost Stack</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="text-left py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Component</th>
                <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Annual (USD)</th>
                <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Daily (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="py-2 px-2 text-[hsl(var(--text2))]">Base OPEX (Year 1)</td>
                <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">{fmtFull(model.opexAnn)}</td>
                <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">${Math.round(model.opexDaily).toLocaleString()}/d</td>
              </tr>
              <tr className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="py-2 px-2 text-[hsl(var(--text2))]">Survey Amortisation</td>
                <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">{fmtFull(model.svAnn)}</td>
                <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">${model.svDaily.toFixed(2)}/d</td>
              </tr>
              <tr className="bg-[hsl(var(--panel2))] font-semibold border-t border-[hsl(var(--border))]">
                <td className="py-2 px-2 text-[hsl(var(--text))]">All-in OPEX (Year 1)</td>
                <td className="py-2 px-2 font-mono text-right text-[hsl(var(--gold))]">{fmtFull(model.allinAnn)}</td>
                <td className="py-2 px-2 font-mono text-right text-[hsl(var(--gold))]">${Math.round(model.allinDaily).toLocaleString()}/d</td>
              </tr>
              <tr className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="py-2 px-2 text-[hsl(var(--text2))]">Debt Service (Year 1)</td>
                <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">{fmtFull(model.dsY1)}</td>
                <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">
                  {model.dsY1 > 0 ? '$' + Math.round(model.dsY1 / 365).toLocaleString() + '/d' : '—'}
                </td>
              </tr>
              <tr className="bg-[hsl(var(--panel2))] font-semibold border-t border-[hsl(var(--border))]">
                <td className="py-2 px-2 text-[hsl(var(--text))] font-semibold">Total Breakeven T/C</td>
                <td className="py-2 px-2 font-mono text-right text-[hsl(var(--gold))]">
                  {model.beDaily > 0 ? '$' + Math.round(model.beDaily * 365).toLocaleString() : '—'}
                </td>
                <td className="py-2 px-2 font-mono text-right text-[hsl(var(--gold))]">
                  {model.beDaily > 0 ? '$' + Math.round(model.beDaily).toLocaleString() + '/d' : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="flex gap-2.5 flex-wrap">
        <div className="metric-tile">
          <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">T/C Rate</div>
          <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
            {model.tc > 0 ? '$' + model.tc.toLocaleString() + '/d' : '—'}
          </div>
        </div>
        <div className="metric-tile">
          <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Breakeven T/C</div>
          <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
            {model.beDaily > 0 ? '$' + Math.round(model.beDaily).toLocaleString() + '/d' : '—'}
          </div>
        </div>
        <div className="metric-tile">
          <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Daily Margin</div>
          <div className={`font-mono text-lg font-medium ${marginColor}`}>
            {model.beDaily > 0 ? (model.margin >= 0 ? '+' : '') + ' $' + Math.round(model.margin).toLocaleString() + '/d' : '—'}
          </div>
        </div>
        <div className="metric-tile">
          <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">DSCR (Year 1)</div>
          <div className={`font-mono text-lg font-medium ${dscrColor}`}>
            {model.dscr > 0 ? model.dscr.toFixed(2) + 'x' : '—'}
          </div>
        </div>
      </div>
      
      {/* Status Strip */}
      {hasData && (
        <div className={`status-strip ${model.margin >= 0 ? 'status-strip-success' : 'status-strip-danger'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0" />
          <div>
            {model.margin >= 0 ? (
              <>
                <strong>Positive daily margin</strong> — ${model.tc.toLocaleString()}/day is ${Math.round(model.margin).toLocaleString()}/day above breakeven.
              </>
            ) : (
              <>
                <strong>Cash-flow shortfall</strong> — ${Math.round(Math.abs(model.margin)).toLocaleString()}/day below breakeven. 
                Reserve ~{fmtFull(Math.abs(model.rows[0]?.cf || 0))}/yr.
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Cost Stack Chart */}
      {hasData && (
        <div className="maritime-card">
          <div className="maritime-card-head">Cost Stack vs T/C Rate</div>
          <div className="h-32 flex items-end gap-1.5 px-1 mb-2">
            {barData.map((d, i) => {
              const maxV = Math.max(...barData.map(b => b.value), 1);
              const h = Math.max(4, Math.round(d.value / maxV * 110));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="font-mono text-[9px]" style={{ color: d.color }}>
                    ${Math.round(d.value).toLocaleString()}
                  </div>
                  <div 
                    className="w-full rounded-t-sm opacity-85"
                    style={{ height: `${h}px`, backgroundColor: d.color }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5 px-1">
            {barData.map((d, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-[hsl(var(--text3))]">
                {d.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
