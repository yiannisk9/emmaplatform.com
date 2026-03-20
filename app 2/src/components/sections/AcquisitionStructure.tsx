import { useAppStore } from '@/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { computeModel, fmtM } from '@/lib/calculations';

export function AcquisitionStructure() {
  const { vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv, setAcquisition, setExit } = useAppStore();
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  const syncDebt = (eq: number) => {
    setAcquisition({ equityPct: eq, debtPct: Math.max(0, 100 - eq) });
  };
  
  const syncEq = (debt: number) => {
    setAcquisition({ debtPct: debt, equityPct: Math.max(0, 100 - debt) });
  };
  
  return (
    <div className="space-y-5">
      {/* Purchase */}
      <div className="maritime-card">
        <div className="maritime-card-head">Purchase</div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Purchase Price (USD)</Label>
            <div className="relative">
              <Input
                type="number"
                value={acquisition.price || ''}
                onChange={(e) => setAcquisition({ price: parseFloat(e.target.value) || 0 })}
                placeholder="35000000"
                className="maritime-input pl-7"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                $
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Ownership Vehicle</Label>
            <Select 
              value={acquisition.vehicle} 
              onValueChange={(v) => setAcquisition({ vehicle: v as any })}
            >
              <SelectTrigger className="maritime-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--panel))] border-[hsl(var(--border))]">
                <SelectItem value="spv">SPV — Special Purpose Vehicle</SelectItem>
                <SelectItem value="direct">Direct Ownership</SelectItem>
                <SelectItem value="jv">Joint Venture</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Funding Structure */}
      <div className="maritime-card">
        <div className="maritime-card-head">Funding Structure</div>
        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Equity (%)</Label>
            <div className="relative">
              <Input
                type="number"
                value={acquisition.equityPct || ''}
                onChange={(e) => syncDebt(parseFloat(e.target.value) || 0)}
                placeholder="45"
                min={10}
                max={100}
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                %
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Debt (%)</Label>
            <div className="relative">
              <Input
                type="number"
                value={acquisition.debtPct || ''}
                onChange={(e) => syncEq(parseFloat(e.target.value) || 0)}
                placeholder="55"
                min={0}
                max={90}
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text3))] font-mono text-[11px]">
                %
              </span>
            </div>
          </div>
        </div>
        
        {/* Metrics */}
        <div className="flex gap-2.5 mt-3.5 flex-wrap">
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Equity Amount</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{fmtM(model.equity)}</div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Debt Amount</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{fmtM(model.debt)}</div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">LTV Ratio</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
              {model.debtPct > 0 ? (model.debtPct * 100).toFixed(0) + '%' : '—'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Debt Terms */}
      <div className="maritime-card">
        <div className="maritime-card-head">Debt Terms</div>
        <div className="grid grid-cols-3 gap-3.5">
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Interest Rate (%)</Label>
            <div className="relative">
              <Input
                type="number"
                step={0.05}
                value={acquisition.interestRate || ''}
                onChange={(e) => setAcquisition({ interestRate: parseFloat(e.target.value) || 0 })}
                placeholder="7.05"
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                %
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Tenor (years)</Label>
            <div className="relative">
              <Input
                type="number"
                value={acquisition.tenor || ''}
                onChange={(e) => setAcquisition({ tenor: parseFloat(e.target.value) || 0 })}
                placeholder="5"
                min={1}
                max={20}
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                yr
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Balloon (%)</Label>
            <div className="relative">
              <Input
                type="number"
                value={acquisition.balloonPct || ''}
                onChange={(e) => setAcquisition({ balloonPct: parseFloat(e.target.value) || 0 })}
                placeholder="30"
                min={0}
                max={70}
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                %
              </span>
            </div>
          </div>
        </div>
        
        {/* Metrics */}
        <div className="flex gap-2.5 mt-3.5 flex-wrap">
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Balloon Amount</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{fmtM(model.balloon)}</div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Annual Debt Svc (Y1)</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{fmtM(model.dsY1)}</div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Daily Debt Svc (Y1)</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
              {model.dsY1 > 0 ? '$' + Math.round(model.dsY1 / 365).toLocaleString() + '/d' : '—'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Exit Strategy */}
      <div className="maritime-card">
        <div className="maritime-card-head">Exit Strategy</div>
        <div className="grid grid-cols-3 gap-3.5">
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Exit Method</Label>
            <div className="flex gap-1.5 flex-wrap">
              {(['dep', 'scrap', 'manual'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setExit({ mode: m })}
                  className={`toggle-btn ${exit.mode === m ? 'toggle-btn-active' : ''}`}
                >
                  {m === 'dep' ? 'Book Value' : m === 'scrap' ? 'Scrap' : 'Manual'}
                </button>
              ))}
            </div>
          </div>
          
          {exit.mode === 'dep' && (
            <div className="flex flex-col gap-1">
              <Label className="maritime-label">Depreciation Rate (%/yr)</Label>
              <div className="relative">
                <Input
                  type="number"
                  step={0.5}
                  value={exit.depRate || ''}
                  onChange={(e) => setExit({ depRate: parseFloat(e.target.value) || 0 })}
                  placeholder="5"
                  className="maritime-input pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                  %/yr
                </span>
              </div>
              <div className="text-[10px] text-[hsl(var(--text3))]">Applied to purchase price annually</div>
            </div>
          )}
          
          {exit.mode === 'scrap' && (
            <div className="flex flex-col gap-1">
              <Label className="maritime-label">Scrap Price ($/LDT)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={exit.scrapPrice || ''}
                  onChange={(e) => setExit({ scrapPrice: parseFloat(e.target.value) || 0 })}
                  placeholder="350"
                  className="maritime-input pl-7"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                  $
                </span>
              </div>
            </div>
          )}
          
          {exit.mode === 'manual' && (
            <div className="flex flex-col gap-1">
              <Label className="maritime-label">Manual Exit Value</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={exit.manualExit || ''}
                  onChange={(e) => setExit({ manualExit: parseFloat(e.target.value) || 0 })}
                  placeholder="25000000"
                  className="maritime-input pl-7"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                  $
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Metrics */}
        <div className="flex gap-2.5 mt-3.5 flex-wrap">
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Gross Exit Value</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{fmtM(model.exitVal)}</div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Balloon Repayment</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{fmtM(model.balloon)}</div>
          </div>
          <div className="metric-tile metric-tile-highlight">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Net Exit to Equity</div>
            <div className={`font-mono text-lg font-medium ${model.netExit >= 0 ? 'text-[hsl(var(--gold))]' : 'text-[hsl(var(--red))]'}`}>
              {fmtM(model.netExit)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Rationale */}
      <div className="maritime-card">
        <div className="maritime-card-head">Rationale</div>
        <div className="flex flex-col gap-1">
          <Textarea
            value={acquisition.rationale}
            onChange={(e) => setAcquisition({ rationale: e.target.value })}
            placeholder="Leverage choice, risk profile, capital efficiency..."
            className="maritime-input min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
}
