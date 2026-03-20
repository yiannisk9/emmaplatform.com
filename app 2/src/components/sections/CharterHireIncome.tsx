import { useAppStore } from '@/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { computeModel, fmtFull, fmtM } from '@/lib/calculations';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export function CharterHireIncome() {
  const { 
    vessel, acquisition, exit, opex, survey, 
    assumptions, charterYears, spv, setCharterYear 
  } = useAppStore();
  
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  const applyFlatRate = (rate: number) => {
    for (let y = 1; y <= model.hold; y++) {
      setCharterYear(y, { year: y, rate, days: assumptions.revenueDays });
    }
  };
  
  const clearAll = () => {
    for (let y = 1; y <= model.hold; y++) {
      setCharterYear(y, { year: y, rate: 0, days: 0 });
    }
  };
  
  const getCharterYear = (year: number) => {
    return charterYears.find(c => c.year === year) || { year, rate: 0, days: 0 };
  };
  
  // Chart data
  const chartData = model.hireRows.map(r => ({
    year: `Y${r.year}`,
    income: r.income,
    costs: r.totalCost,
    net: r.netCF
  }));
  
  return (
    <div className="space-y-5">
      {/* Year-by-Year Inputs */}
      <div className="maritime-card">
        <div className="maritime-card-head">Year-by-Year Charter Hire Rate</div>
        <div className="text-xs text-[hsl(var(--text3))] mb-3.5">
          One row per year. Defaults to the base T/C rate from §3 if left blank. Override any year individually.
        </div>
        
        {/* Flat Rate Apply */}
        <div className="flex items-end gap-2.5 mb-4 flex-wrap">
          <div className="w-[200px]">
            <Label className="maritime-label">Apply flat rate to all years</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="e.g. 12500"
                id="flat-rate-input"
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                $/d
              </span>
            </div>
          </div>
          <Button 
            onClick={() => {
              const val = parseFloat((document.getElementById('flat-rate-input') as HTMLInputElement)?.value);
              if (val) applyFlatRate(val);
            }}
            className="gold-btn text-xs"
          >
            Apply to All
          </Button>
          <Button 
            variant="outline"
            onClick={clearAll}
            className="text-xs border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text3))]"
          >
            Clear All
          </Button>
        </div>
        
        {/* Year Inputs */}
        <div className="space-y-2">
          {Array.from({ length: model.hold }, (_, i) => {
            const year = i + 1;
            const cy = getCharterYear(year);
            const hireRow = model.hireRows.find(r => r.year === year);
            const income = hireRow?.income || 0;
            
            return (
              <div 
                key={year} 
                className="grid grid-cols-[70px_1fr_1fr_1fr] gap-2.5 items-end bg-[hsl(var(--panel2))] border border-[hsl(var(--border))] rounded-lg p-3"
              >
                <div>
                  <div className="text-[9px] font-bold tracking-wide uppercase text-[hsl(var(--gold))] mb-0.5">
                    Year {year}
                  </div>
                  <div className="text-[10px] text-[hsl(var(--text3))]">of {model.hold}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="maritime-label">Daily Hire Rate</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={cy.rate || ''}
                      onChange={(e) => setCharterYear(year, { year, rate: parseFloat(e.target.value) || 0, days: cy.days || assumptions.revenueDays })}
                      placeholder={assumptions.tcRate.toString()}
                      className="maritime-input pr-8 bg-[hsl(var(--panel3))]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                      $/d
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="maritime-label">Days on Hire</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={cy.days || ''}
                      onChange={(e) => setCharterYear(year, { year, rate: cy.rate || assumptions.tcRate, days: parseFloat(e.target.value) || 0 })}
                      placeholder={assumptions.revenueDays.toString()}
                      className="maritime-input pr-6 bg-[hsl(var(--panel3))]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                      d
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-[hsl(var(--text3))] mb-0.5">Annual Income</div>
                  <div className={`font-mono text-[15px] font-medium ${income > 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--text3))]'}`}>
                    {income > 0 ? fmtM(income) : '—'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Annual Charter Hire Revenue Table */}
      {model.hireRows.length > 0 && (
        <div className="maritime-card">
          <div className="maritime-card-head">Annual Charter Hire Revenue</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Year</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Daily Hire Rate</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Days on Hire</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Annual Hire Income</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">OPEX + Debt Service</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Net Cash Flow</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {model.hireRows.map((r) => (
                  <tr key={r.year} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2 px-2 text-[hsl(var(--text2))]">Year {r.year}</td>
                    <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">
                      {r.hireRate > 0 ? '$' + r.hireRate.toLocaleString() + '/d' : '—'}
                    </td>
                    <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">{r.hireDays}</td>
                    <td className={`py-2 px-2 font-mono text-right ${r.income > 0 ? 'text-[hsl(var(--green))]' : ''}`}>
                      {r.income > 0 ? fmtFull(r.income) : '—'}
                    </td>
                    <td className="py-2 px-2 font-mono text-right text-[hsl(var(--red))]">({fmtFull(r.totalCost)})</td>
                    <td className={`py-2 px-2 font-mono text-right ${r.netCF >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
                      {fmtFull(r.netCF)}
                    </td>
                    <td className={`py-2 px-2 font-mono text-right ${r.cum >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
                      {fmtFull(r.cum)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-[hsl(var(--panel2))] font-semibold border-t border-[hsl(var(--border))]">
                  <td className="py-2 px-2 text-[hsl(var(--text))]">Total</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--gold))]">
                    avg ${Math.round(model.hireAvgRate).toLocaleString()}/d
                  </td>
                  <td className="py-2 px-2" />
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--green))]">{fmtFull(model.hireTotalIncome)}</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--red))]">({fmtFull(model.hireTotalCosts)})</td>
                  <td className={`py-2 px-2 font-mono text-right ${model.hireTotalNet >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
                    {fmtFull(model.hireTotalNet)}
                  </td>
                  <td className={`py-2 px-2 font-mono text-right ${model.hireRows[model.hireRows.length - 1]?.cum >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
                    {fmtFull(model.hireRows[model.hireRows.length - 1]?.cum || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Summary Metrics */}
      <div className="flex gap-2.5 flex-wrap">
        <div className="metric-tile">
          <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Avg Daily Hire Rate</div>
          <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
            {model.hireAvgRate > 0 ? '$' + Math.round(model.hireAvgRate).toLocaleString() + '/d' : '—'}
          </div>
        </div>
        <div className="metric-tile metric-tile-highlight">
          <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Total Hire Income</div>
          <div className="font-mono text-lg font-medium text-[hsl(var(--gold))]">{fmtM(model.hireTotalIncome)}</div>
        </div>
        <div className="metric-tile">
          <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Total OPEX + Debt</div>
          <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{fmtM(model.hireTotalCosts)}</div>
        </div>
        <div className="metric-tile metric-tile-highlight">
          <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Total Net CF (ex. exit)</div>
          <div className={`font-mono text-lg font-medium ${model.hireTotalNet >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
            {fmtM(model.hireTotalNet)}
          </div>
        </div>
      </div>
      
      {/* Chart */}
      {chartData.length > 0 && (
        <div className="maritime-card">
          <div className="maritime-card-head">Income vs Cost — Year by Year</div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <XAxis dataKey="year" tick={{ fill: 'hsl(var(--text3))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--text3))', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                <Bar dataKey="income" fill="#3dcf8a" name="Charter hire income" opacity={0.85} />
                <Bar dataKey="costs" fill="#4a8fe0" name="OPEX + debt service" opacity={0.85} />
                <Bar dataKey="net" fill="#c9a84c" name="Net cash flow" opacity={0.9} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 text-[11px] text-[hsl(var(--text3))] flex-wrap mt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#3dcf8a]" />
              Charter hire income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#4a8fe0]" />
              OPEX + debt service
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#c9a84c]" />
              Net cash flow
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
