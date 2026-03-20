import { useAppStore } from '@/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { computeModel, fmtM } from '@/lib/calculations';

export function SurveysCapex() {
  const { vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv, setSurvey } = useAppStore();
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  return (
    <div className="space-y-5">
      <div className="maritime-card">
        <div className="maritime-card-head">Survey Schedule & Costs</div>
        <div className="grid grid-cols-3 gap-3.5">
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Special Survey (SS) Cost</Label>
            <div className="relative">
              <Input
                type="number"
                value={survey.ssCost || ''}
                onChange={(e) => setSurvey({ ssCost: parseFloat(e.target.value) || 0 })}
                placeholder="1100000"
                className="maritime-input pl-7"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                $
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Intermediate Survey (IS) Cost</Label>
            <div className="relative">
              <Input
                type="number"
                value={survey.isCost || ''}
                onChange={(e) => setSurvey({ isCost: parseFloat(e.target.value) || 0 })}
                placeholder="650000"
                className="maritime-input pl-7"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                $
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Other Capex</Label>
            <div className="relative">
              <Input
                type="number"
                value={survey.otherCapex || ''}
                onChange={(e) => setSurvey({ otherCapex: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="maritime-input pl-7"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                $
              </span>
            </div>
          </div>
        </div>
        
        {/* Metrics */}
        <div className="flex gap-2.5 mt-3.5 flex-wrap">
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Total Survey Budget</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{fmtM(model.svTotal)}</div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Hold Period</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
              {model.hold > 0 ? `${model.hold} yr (${Math.round(model.hold * model.odays)} days)` : '—'}
            </div>
          </div>
          <div className="metric-tile metric-tile-highlight">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Annual Provision</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--gold))]">{fmtM(model.svAnn)}</div>
          </div>
          <div className="metric-tile metric-tile-highlight">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Daily Amortisation</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--gold))]">
              {model.svDaily > 0 ? '$' + model.svDaily.toFixed(2) + '/d' : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
