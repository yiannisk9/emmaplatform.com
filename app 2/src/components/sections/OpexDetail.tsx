import { useAppStore } from '@/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { computeModel, fmtM } from '@/lib/calculations';

const opexFields = [
  { id: 'crew', label: 'Crew & Manning', placeholder: '1200000' },
  { id: 'stores', label: 'Stores & Supplies', placeholder: '350000' },
  { id: 'repairs', label: 'Repairs & Maintenance', placeholder: '300000' },
  { id: 'insurance', label: 'P&I / H&M Insurance', placeholder: '350000' },
  { id: 'management', label: 'Management Fee', placeholder: '150000' },
  { id: 'misc', label: 'Misc / Sundries', placeholder: '40000' }
];

export function OpexDetail() {
  const { vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv, setOpex } = useAppStore();
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  const inputMode = opex.flatOverride > 0 ? 'Flat override' : model.opexAnn > 0 ? 'Itemised' : 'Not entered';
  
  return (
    <div className="space-y-5">
      {/* OPEX Line Items */}
      <div className="maritime-card">
        <div className="maritime-card-head">OPEX Line Items (Annual USD)</div>
        <div className="grid grid-cols-3 gap-3.5">
          {opexFields.map((field) => (
            <div key={field.id} className="flex flex-col gap-1">
              <Label className="maritime-label">{field.label}</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={(opex as any)[field.id] || ''}
                  onChange={(e) => setOpex({ [field.id]: parseFloat(e.target.value) || 0 })}
                  placeholder={field.placeholder}
                  className="maritime-input pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                  $/yr
                </span>
              </div>
            </div>
          ))}
        </div>
        
        <hr className="border-[hsl(var(--border))] my-4" />
        
        {/* Metrics */}
        <div className="flex gap-2.5 flex-wrap">
          <div className="metric-tile metric-tile-highlight">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Total Annual OPEX</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--gold))]">{fmtM(model.opexAnn)}</div>
          </div>
          <div className="metric-tile metric-tile-highlight">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Daily OPEX</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--gold))]">
              {model.opexAnn > 0 ? '$' + Math.round(model.opexDaily).toLocaleString() + '/d' : '—'}
            </div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Input Mode</div>
            <div className="font-mono text-sm font-medium text-[hsl(var(--text))]">{inputMode}</div>
          </div>
        </div>
      </div>
      
      {/* OPEX Escalation & Override */}
      <div className="maritime-card">
        <div className="maritime-card-head">OPEX Escalation & Override</div>
        <div className="grid grid-cols-3 gap-3.5">
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Annual OPEX Inflation (%/yr)</Label>
            <div className="relative">
              <Input
                type="number"
                step={0.5}
                min={0}
                max={10}
                value={opex.inflation || ''}
                onChange={(e) => setOpex({ inflation: parseFloat(e.target.value) || 0 })}
                placeholder="2.5"
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                %/yr
              </span>
            </div>
            <div className="text-[10px] text-[hsl(var(--text3))]">Compounding annually. Industry standard 2–3%.</div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Flat Daily OPEX Override</Label>
            <div className="relative">
              <Input
                type="number"
                value={opex.flatOverride || ''}
                onChange={(e) => setOpex({ flatOverride: parseFloat(e.target.value) || 0 })}
                placeholder="Leave blank to use breakdown"
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                $/d
              </span>
            </div>
            <div className="text-[10px] text-[hsl(var(--text3))]">Overrides itemised breakdown if filled.</div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">OPEX Notes / Basis</Label>
            <Textarea
              value={opex.notes}
              onChange={(e) => setOpex({ notes: e.target.value })}
              placeholder="Manning scale, management company, P&I club..."
              rows={2}
              className="maritime-input min-h-[60px]"
            />
          </div>
        </div>
      </div>
      
      {/* OPEX Projection */}
      {model.opexDaily > 0 && model.hold > 0 && (
        <div className="maritime-card">
          <div className="maritime-card-head flex items-center gap-2">
            OPEX Projection — Year by Year
            <span className="text-[10px] text-[hsl(var(--amber))] font-normal normal-case">
              Base ${Math.round(model.opexDaily).toLocaleString()}/d × {(model.opexInflation * 100).toFixed(1)}%/yr compound
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Year</th>
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Base OPEX/day</th>
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Inflation Factor</th>
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Inflated OPEX/day</th>
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Annual OPEX</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: model.hold }, (_, i) => {
                  const infl = Math.pow(1 + model.opexInflation, i);
                  const daily = model.opexDaily * infl;
                  const ann = daily * model.odays;
                  return (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-2 px-2 text-[hsl(var(--text2))]">Year {i + 1}</td>
                      <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">${Math.round(model.opexDaily).toLocaleString()}/d</td>
                      <td className={`py-2 px-2 font-mono text-right ${i > 0 ? 'text-[hsl(var(--amber))]' : ''}`}>
                        {i === 0 ? '× 1.000' : `× ${infl.toFixed(3)} (+${(model.opexInflation * 100).toFixed(1)}%/yr)`}
                      </td>
                      <td className="py-2 px-2 font-mono text-right text-[hsl(var(--gold))]">${Math.round(daily).toLocaleString()}/d</td>
                      <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">${Math.round(ann).toLocaleString()}</td>
                    </tr>
                  );
                })}
                <tr className="bg-[hsl(var(--panel2))] font-semibold border-t border-[hsl(var(--border))]">
                  <td className="py-2 px-2 text-[hsl(var(--text))]">{model.hold}-yr total</td>
                  <td className="py-2 px-2" />
                  <td className="py-2 px-2" />
                  <td className="py-2 px-2" />
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--gold))]">
                    ${Math.round(
                      Array.from({ length: model.hold }, (_, i) => 
                        model.opexDaily * Math.pow(1 + model.opexInflation, i) * model.odays
                      ).reduce((a, b) => a + b, 0)
                    ).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
