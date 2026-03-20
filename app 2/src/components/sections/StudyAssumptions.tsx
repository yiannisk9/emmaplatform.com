import { useAppStore } from '@/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { computeModel, fmtM } from '@/lib/calculations';

export function StudyAssumptions() {
  const { vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv, setAssumptions } = useAppStore();
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  const opCF = model.annRev - model.allinAnn;
  
  return (
    <div className="space-y-5">
      <div className="maritime-card">
        <div className="maritime-card-head">Operating Parameters</div>
        <div className="grid grid-cols-4 gap-3.5">
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">T/C Charter Rate</Label>
            <div className="relative">
              <Input
                type="number"
                value={assumptions.tcRate || ''}
                onChange={(e) => setAssumptions({ tcRate: parseFloat(e.target.value) || 0 })}
                placeholder="12500"
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                $/d
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Revenue Days / Year</Label>
            <div className="relative">
              <Input
                type="number"
                value={assumptions.revenueDays || ''}
                onChange={(e) => setAssumptions({ revenueDays: parseFloat(e.target.value) || 0 })}
                placeholder="350"
                className="maritime-input pr-6"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                d
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">OPEX Days / Year</Label>
            <div className="relative">
              <Input
                type="number"
                value={assumptions.opexDays || ''}
                onChange={(e) => setAssumptions({ opexDays: parseFloat(e.target.value) || 0 })}
                placeholder="365"
                className="maritime-input pr-6"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                d
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Hold Period</Label>
            <div className="relative">
              <Input
                type="number"
                value={assumptions.holdPeriod || ''}
                onChange={(e) => setAssumptions({ holdPeriod: parseFloat(e.target.value) || 0 })}
                placeholder="5"
                min={1}
                max={20}
                className="maritime-input pr-6"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                yr
              </span>
            </div>
          </div>
        </div>
        
        {/* Metrics */}
        <div className="flex gap-2.5 mt-3.5 flex-wrap">
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Annual Revenue</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
              {model.annRev > 0 ? fmtM(model.annRev) : '—'}
            </div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Op CF pre-debt (rev − OPEX)</div>
            <div className={`font-mono text-lg font-medium ${opCF >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
              {model.annRev > 0 && model.allinAnn > 0 ? fmtM(opCF) : model.annRev > 0 ? '(enter OPEX)' : '—'}
            </div>
            {model.allinAnn > 0 && (
              <div className="text-[10px] text-[hsl(var(--text3))] mt-0.5">
                {fmtM(model.annRev)} − {fmtM(model.allinAnn)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
