import { useAppStore } from '@/store';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { computeModel, computeSensitivity, findTCForIRR } from '@/lib/calculations';
import { useState } from 'react';
import { Sparkles } from 'lucide-react';

export function SensitivityAnalysis() {
  const { vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv, conclusion, setConclusion } = useAppStore();
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  const hasData = model.price > 0 && model.tc > 0;
  
  const sensitivityData = hasData ? computeSensitivity(model.tc, model) : [];
  const maxAbs = Math.max(...sensitivityData.map(r => Math.abs(r.irr)), 0.01);
  
  const tc8 = hasData ? findTCForIRR(0.08, model) : null;
  const tc15 = hasData ? findTCForIRR(0.15, model) : null;
  
  const handleGenerateConclusion = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      const mg = model.tc - model.beDaily;
      const rec = conclusion.recommendation || (model.irrCarry >= 0.08 && mg >= 0 ? 'PROCEED' : model.irrCarry >= 0 ? 'CONDITIONAL' : 'DO NOT PROCEED');
      
      const generated = `Based on the comprehensive financial analysis of ${vessel.name || 'the vessel'}, this investment presents a ${model.irrCarry >= 0.08 ? 'compelling opportunity' : model.irrCarry >= 0 ? 'marginal opportunity requiring careful monitoring' : 'challenging investment proposition'}.

Key financial metrics demonstrate ${model.irrCarry >= 0.08 ? 'strong' : 'adequate'} returns with an IRR of ${(model.irrCarry * 100).toFixed(1)}% after all fees and carry, representing a ${model.mult.toFixed(2)}x equity multiple over the ${model.hold}-year hold period. The daily margin of ${mg >= 0 ? '+' : ''}$${Math.round(mg).toLocaleString()}/day ${mg >= 0 ? 'provides comfortable coverage' : 'requires close monitoring'} against the breakeven T/C rate of $${Math.round(model.beDaily).toLocaleString()}/day.

The capital structure employs ${(model.debtPct * 100).toFixed(0)}% debt financing at ${(model.ir * 100).toFixed(2)}% fixed interest, with a ${(model.balloon / model.debt * 100).toFixed(0)}% balloon payment due at Year ${model.tenor}. DSCR of ${model.dscr.toFixed(2)}x ${model.dscr >= 1.2 ? 'indicates strong debt service coverage' : model.dscr >= 1 ? 'provides adequate coverage' : 'warrants attention'}.

Recommendation: ${rec}.`;
      
      setConclusion({ statement: generated });
      setIsGenerating(false);
    }, 1500);
  };
  
  return (
    <div className="space-y-5">
      {/* T/C Rate Sensitivity */}
      {hasData && sensitivityData.length > 0 && (
        <div className="maritime-card">
          <div className="maritime-card-head">T/C Rate Sensitivity (±50% of Base Rate)</div>
          <div className="space-y-1">
            {/* Header */}
            <div className="grid grid-cols-[100px_1fr_60px_60px] gap-2 py-1.5 border-b border-[hsl(var(--border))] text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">
              <div>T/C Rate</div>
              <div>IRR Visual</div>
              <div className="text-right">IRR</div>
              <div className="text-right">ROI</div>
            </div>
            
            {/* Rows */}
            {sensitivityData.map((r, i) => {
              const isBase = Math.abs(r.tc - model.tc) < 1;
              const iPct = r.irr * 100;
              const rPct = r.roi * 100;
              const color = iPct >= 10 ? '#3dcf8a' : iPct >= 0 ? '#f0a030' : '#e05555';
              const rColor = rPct >= 0 ? '#3dcf8a' : '#e05555';
              const barWidth = Math.round(Math.abs(r.irr) / maxAbs * 100);
              
              return (
                <div key={i} className="grid grid-cols-[100px_1fr_60px_60px] gap-2 py-1.5 items-center border-b border-white/[0.03]">
                  <div className={`font-mono text-[11px] ${isBase ? 'text-[hsl(var(--gold2))] font-bold' : 'text-[hsl(var(--text2))]'}`}>
                    ${r.tc.toLocaleString()}/d{isBase ? ' ◀' : ''}
                  </div>
                  <div className="bg-[hsl(var(--panel2))] rounded-sm h-2.5 overflow-hidden">
                    <div 
                      className="h-full rounded-sm transition-all duration-400"
                      style={{ width: `${barWidth}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="font-mono text-[11px] text-right font-medium" style={{ color }}>
                    {iPct.toFixed(1)}%
                  </div>
                  <div className="font-mono text-[11px] text-right font-medium" style={{ color: rColor }}>
                    {rPct.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Breakeven Metrics */}
      {hasData && (
        <div className="flex gap-2.5 flex-wrap">
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">OPEX-only breakeven</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
              ${Math.round(model.allinDaily).toLocaleString()}/d
            </div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Full breakeven (incl. debt)</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
              ${Math.round(model.beDaily).toLocaleString()}/d
            </div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">T/C for 8% Investor IRR</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
              {tc8 ? `$${tc8.toLocaleString()}/d` : '>$80k/d'}
            </div>
            <div className="text-[9px] text-[hsl(var(--text3))]">Post-fee, pre-carry</div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">T/C for 15% Investor IRR</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
              {tc15 ? `$${tc15.toLocaleString()}/d` : '>$80k/d'}
            </div>
            <div className="text-[9px] text-[hsl(var(--text3))]">Post-fee, pre-carry</div>
          </div>
        </div>
      )}
      
      {/* Final Determination */}
      <div className="maritime-card border-[hsl(var(--gold-border))]">
        <div className="maritime-card-head">Final Determination</div>
        
        {/* Recommendation Toggle */}
        <div className="grid grid-cols-2 gap-3.5 mb-3.5">
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Recommendation</Label>
            <div className="flex gap-1.5 flex-wrap">
              {(['proceed', 'conditional', 'decline'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setConclusion({ recommendation: r })}
                  className={`toggle-btn ${conclusion.recommendation === r ? 'toggle-btn-active' : ''} ${r === 'proceed' && conclusion.recommendation === r ? 'bg-[hsl(var(--green-dim))] text-[hsl(var(--green))] border-[hsl(150,65%,53%,0.4)]' : ''} ${r === 'decline' && conclusion.recommendation === r ? 'bg-[hsl(var(--red-dim))] text-[hsl(var(--red))] border-[hsl(0,65%,55%,0.4)]' : ''}`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Prepared By / Analyst</Label>
            <Input
              value={conclusion.analyst}
              onChange={(e) => setConclusion({ analyst: e.target.value })}
              placeholder="Name, Title, Date"
              className="maritime-input"
            />
          </div>
        </div>
        
        {/* Conclusion Statement */}
        <div className="flex flex-col gap-1 mb-3.5">
          <Label className="maritime-label">Conclusion Statement</Label>
          <Textarea
            value={conclusion.statement}
            onChange={(e) => setConclusion({ statement: e.target.value })}
            placeholder="Write your conclusion here — or use Generate to draft a CFO-style statement from the project data."
            rows={7}
            className="maritime-input"
          />
        </div>
        
        {/* Generate Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button 
            onClick={handleGenerateConclusion}
            disabled={isGenerating || !hasData}
            className="gold-btn flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin">⟳</span>
                <span>Drafting...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate CFO Conclusion</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
