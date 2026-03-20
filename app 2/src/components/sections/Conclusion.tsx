import { useAppStore } from '@/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { computeModel, fmtM } from '@/lib/calculations';
import { useState, useMemo } from 'react';
import { Plus, Trash2, Sparkles, AlertTriangle, FileText } from 'lucide-react';
import type { RiskItem } from '@/types';

// Classic 8 maritime risks template
const classicRisks: RiskItem[] = [
  { factor: 'T/C Rate Volatility', level: 'MEDIUM', mitigation: 'Long-term charter coverage with quality covenant' },
  { factor: 'DSCR / Debt Service Coverage', level: 'LOW', mitigation: 'Strong debt service coverage with income buffer' },
  { factor: 'OPEX Inflation', level: 'MEDIUM', mitigation: 'Fixed-rate management contract essential' },
  { factor: 'Residual / Exit Value', level: 'MEDIUM', mitigation: 'Conservative depreciation assumption' },
  { factor: 'Survey Cost Overrun', level: 'LOW', mitigation: 'Survey provision amortised from Day 1' },
  { factor: 'Interest Rate Risk', level: 'LOW', mitigation: 'Fixed rate locked for full tenor' },
  { factor: 'Charterer Counterparty', level: 'HIGH', mitigation: 'First-class charterers with parent guarantee' },
  { factor: 'CII / EEXI Regulatory Compliance', level: 'LOW', mitigation: 'Modern vessel build, BWTS fitted' }
];

// Risk level color configurations
const levelColors: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { 
    bg: 'hsl(0, 70%, 20%, 0.35)', 
    text: '#ff6b6b', 
    border: 'hsl(0, 70%, 45%, 0.6)' 
  },
  HIGH: { 
    bg: 'hsl(0, 65%, 55%, 0.15)', 
    text: 'hsl(0, 65%, 55%)', 
    border: 'hsl(0, 65%, 55%, 0.4)' 
  },
  MEDIUM: { 
    bg: 'hsl(35, 85%, 55%, 0.15)', 
    text: 'hsl(35, 85%, 55%)', 
    border: 'hsl(35, 85%, 55%, 0.4)' 
  },
  LOW: { 
    bg: 'hsl(150, 65%, 53%, 0.12)', 
    text: 'hsl(150, 65%, 53%)', 
    border: 'hsl(150, 65%, 53%, 0.35)' 
  }
};

// Generate project-specific risks based on vessel and financial data
function generateProjectRisks(vessel: any, model: any): RiskItem[] {
  const risks: RiskItem[] = [];
  
  // Financial risks based on model
  if (model.dscr < 1.2) {
    risks.push({
      factor: 'DSCR / Debt Service Coverage',
      level: model.dscr < 1 ? 'HIGH' : 'MEDIUM',
      mitigation: model.dscr < 1 ? 'Increase equity contribution or reduce debt' : 'Monitor cash flow closely; maintain reserves'
    });
  }
  
  // Exit/Residual value
  if (model.exitVal > 0 && model.exitVal < model.price * 0.7) {
    risks.push({
      factor: 'Residual / Exit Value Risk',
      level: 'HIGH',
      mitigation: 'Consider earlier exit; monitor second-hand market'
    });
  }
  
  // Survey risks
  if (model.svTotal > model.price * 0.05) {
    risks.push({
      factor: 'Survey Cost Overrun',
      level: 'MEDIUM',
      mitigation: 'Obtain fixed quotes; maintain 15% contingency'
    });
  }
  
  // Vessel-specific risks
  if (vessel.bwts === 'no' || vessel.bwts === 'pending') {
    risks.push({
      factor: 'BWTS Retrofit Requirement',
      level: 'HIGH',
      mitigation: 'Budget $1-2M for BWTS installation; schedule during next DD'
    });
  }
  
  // Age-related risks
  const builtYear = parseInt(vessel.built?.match(/\d{4}/)?.[0] || '2020');
  const vesselAge = new Date().getFullYear() - builtYear;
  if (vesselAge > 15) {
    risks.push({
      factor: 'Vessel Age / Obsolescence',
      level: 'MEDIUM',
      mitigation: 'Enhanced maintenance program; consider earlier exit'
    });
  }
  
  // Margin risk
  if (model.margin < 0) {
    risks.push({
      factor: 'Negative Operating Margin',
      level: 'CRITICAL',
      mitigation: 'Renegotiate charter rate or reduce costs immediately'
    });
  } else if (model.margin < 1000) {
    risks.push({
      factor: 'Thin Operating Margin',
      level: 'HIGH',
      mitigation: 'Monitor market closely; maintain cash reserves'
    });
  }
  
  return risks;
}

export function Conclusion() {
  const { 
    vessel, acquisition, exit, opex, survey, 
    assumptions, charterYears, spv, risks, addRisk, removeRisk 
  } = useAppStore();
  
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  const [newRisk, setNewRisk] = useState<RiskItem>({ factor: '', level: 'MEDIUM', mitigation: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const hasData = model.price > 0 && model.tc > 0;
  const hasVesselData = vessel.name || vessel.type;
  
  // Generate project-specific risk suggestions
  const suggestedRisks = useMemo(() => {
    if (!hasVesselData && !hasData) return [];
    return generateProjectRisks(vessel, model);
  }, [vessel, model, hasVesselData, hasData]);
  
  // Status banner
  let statusMsg = '';
  let statusClass = '';
  if (hasData) {
    const mg = model.tc - model.beDaily;
    if (model.irrCarry >= 0.08 && mg >= 0) {
      statusMsg = `Financially viable. At $${model.tc.toLocaleString()}/day T/C — daily margin +$${Math.round(mg).toLocaleString()}/day above breakeven. IRR after all fees and carry: ${(model.irrCarry * 100).toFixed(1)}% — ${model.mult.toFixed(2)}x equity multiple — net exit ${fmtM(model.netExit)}.`;
      statusClass = 'status-strip-success';
    } else if (model.irrCarry >= 0) {
      statusMsg = `Marginal. IRR after all fees and carry: ${(model.irrCarry * 100).toFixed(1)}%. ${mg < 0 ? '$' + Math.round(Math.abs(mg)).toLocaleString() + '/day below breakeven — equity reserve of ~' + fmtM(Math.abs(model.rows[0]?.cf || 0)) + '/yr required.' : 'Marginally above breakeven. Rate recovery advisable.'}`;
      statusClass = 'status-strip-warning';
    } else {
      statusMsg = `Not self-sustaining. $${Math.round(Math.abs(mg)).toLocaleString()}/day below breakeven at $${model.tc.toLocaleString()}/day. IRR after all fees and carry: ${(model.irrCarry * 100).toFixed(1)}%. Equity reserves of ~${fmtM(Math.abs(model.rows[0]?.cf || 0))}/yr required for Years 1–${model.hold - 1}.`;
      statusClass = 'status-strip-danger';
    }
  }
  
  const handleAddRisk = () => {
    if (newRisk.factor && newRisk.mitigation) {
      addRisk(newRisk);
      setNewRisk({ factor: '', level: 'MEDIUM', mitigation: '' });
    }
  };
  
  const handleLoadClassic = () => {
    classicRisks.forEach(risk => addRisk(risk));
  };
  
  const handleLoadSuggestions = () => {
    suggestedRisks.forEach(risk => addRisk(risk));
    setShowSuggestions(false);
  };
  
  const handleClearAll = () => {
    const count = risks.length;
    for (let idx = 0; idx < count; idx++) {
      removeRisk(0);
    }
  };
  
  const levelCounts = {
    CRITICAL: risks.filter(r => r.level === 'CRITICAL').length,
    HIGH: risks.filter(r => r.level === 'HIGH').length,
    MEDIUM: risks.filter(r => r.level === 'MEDIUM').length,
    LOW: risks.filter(r => r.level === 'LOW').length
  };
  
  const totalRisks = risks.length;
  
  // Filter out already added suggestions
  const availableSuggestions = suggestedRisks.filter(
    sr => !risks.some(r => r.factor === sr.factor)
  );
  
  return (
    <div className="space-y-5">
      {/* Status Banner */}
      {hasData && statusMsg && (
        <div className={`status-strip ${statusClass}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0" />
          <div dangerouslySetInnerHTML={{ __html: statusMsg }} />
        </div>
      )}
      
      {/* Risk & Control Assessment */}
      <div className="maritime-card">
        <div className="maritime-card-head flex items-center justify-between">
          <span>Risk & Control Assessment</span>
          {totalRisks > 0 && (
            <span className="text-[10px] text-[hsl(var(--text3))] font-normal">
              {totalRisks} risk{totalRisks !== 1 ? 's' : ''} identified
            </span>
          )}
        </div>
        
        {/* Project Context */}
        {(hasVesselData || hasData) && (
          <div className="mb-4 p-3 bg-[hsl(var(--panel2))] border border-[hsl(var(--border))] rounded-lg">
            <div className="text-[10px] font-semibold tracking-wide uppercase text-[hsl(var(--gold))] mb-2">
              Project Context
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {vessel.name && (
                <div>
                  <span className="text-[hsl(var(--text3))]">Vessel: </span>
                  <span className="text-[hsl(var(--text))]">{vessel.name}</span>
                </div>
              )}
              {vessel.type && (
                <div>
                  <span className="text-[hsl(var(--text3))]">Type: </span>
                  <span className="text-[hsl(var(--text))]">{vessel.type}</span>
                </div>
              )}
              {model.price > 0 && (
                <div>
                  <span className="text-[hsl(var(--text3))]">Price: </span>
                  <span className="text-[hsl(var(--text))]">{fmtM(model.price)}</span>
                </div>
              )}
              {model.tc > 0 && (
                <div>
                  <span className="text-[hsl(var(--text3))]">T/C Rate: </span>
                  <span className="text-[hsl(var(--text))]">${model.tc.toLocaleString()}/d</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {risks.length === 0 ? (
          /* Empty State */
          <div className="py-8 text-center border border-dashed border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--panel2))]">
            <div className="text-[hsl(var(--text3))] text-sm mb-2">No risks added yet</div>
            <div className="text-[hsl(var(--text3))] text-xs mb-4">
              Choose a template or add custom risks
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button 
                onClick={handleLoadClassic}
                className="gold-btn text-xs"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                Load Classic 8 Risks
              </Button>
              {availableSuggestions.length > 0 && (
                <Button 
                  onClick={handleLoadSuggestions}
                  variant="outline"
                  className="text-xs border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text3))] hover:text-[hsl(var(--gold))] hover:border-[hsl(var(--gold-border))]"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Load Project-Specific ({availableSuggestions.length})
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Risk Table */
          <div className="overflow-x-auto">
            <div className="grid grid-cols-[1fr_80px_2fr_40px] gap-0">
              <div className="text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))] py-1.5 px-2 border-b border-[hsl(var(--border))]">
                Risk Factor
              </div>
              <div className="text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))] py-1.5 px-2 border-b border-[hsl(var(--border))] text-center">
                Level
              </div>
              <div className="text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))] py-1.5 px-2 border-b border-[hsl(var(--border))]">
                Mitigation
              </div>
              <div className="text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))] py-1.5 px-2 border-b border-[hsl(var(--border))] text-center">
                
              </div>
              
              {risks.map((risk, i) => {
                const colors = levelColors[risk.level];
                return (
                  <div key={i} className="contents group">
                    <div className="py-2 px-2 border-b border-white/[0.03] text-[hsl(var(--text2))] text-xs group-hover:bg-white/[0.02]">
                      {risk.factor}
                    </div>
                    <div className="py-2 px-2 border-b border-white/[0.03] text-center group-hover:bg-white/[0.02]">
                      <span 
                        className="inline-block px-2 py-0.5 rounded text-[9.5px] font-bold tracking-[0.06em] border"
                        style={{ 
                          backgroundColor: colors.bg, 
                          color: colors.text, 
                          borderColor: colors.border 
                        }}
                      >
                        {risk.level}
                      </span>
                    </div>
                    <div className="py-2 px-2 border-b border-white/[0.03] text-[hsl(var(--text3))] text-xs group-hover:bg-white/[0.02]">
                      {risk.mitigation}
                    </div>
                    <div className="py-2 px-2 border-b border-white/[0.03] text-center group-hover:bg-white/[0.02]">
                      <button
                        onClick={() => removeRisk(i)}
                        className="p-1 rounded hover:bg-[hsl(var(--red-dim))] text-[hsl(var(--text3))] hover:text-[hsl(var(--red))] transition-colors"
                        title="Remove risk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Suggestions Panel */}
        {showSuggestions && availableSuggestions.length > 0 && (
          <div className="mt-4 p-3 bg-[hsl(var(--panel2))] border border-[hsl(var(--gold-border))] rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-semibold tracking-wide uppercase text-[hsl(var(--gold))]">
                Project-Specific Risk Suggestions
              </div>
              <Button 
                onClick={handleLoadSuggestions}
                className="gold-btn text-xs py-1 px-2"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add All
              </Button>
            </div>
            <div className="space-y-2">
              {availableSuggestions.map((risk, i) => {
                const colors = levelColors[risk.level];
                return (
                  <div key={i} className="flex items-center justify-between py-2 px-3 bg-[hsl(var(--panel))] rounded border border-[hsl(var(--border))]">
                    <div className="flex items-center gap-3">
                      <span 
                        className="px-2 py-0.5 rounded text-[9px] font-bold border"
                        style={{ 
                          backgroundColor: colors.bg, 
                          color: colors.text, 
                          borderColor: colors.border 
                        }}
                      >
                        {risk.level}
                      </span>
                      <span className="text-xs text-[hsl(var(--text))]">{risk.factor}</span>
                    </div>
                    <button
                      onClick={() => addRisk(risk)}
                      className="p-1 rounded hover:bg-[hsl(var(--green-dim))] text-[hsl(var(--text3))] hover:text-[hsl(var(--green))] transition-colors"
                      title="Add this risk"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Summary */}
        {risks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[hsl(45,55%,54%,0.2)] text-[11px] text-[hsl(var(--text3))] flex items-center justify-between">
            <div>
              Risk Summary:{" "}
              <span style={{ color: levelColors.CRITICAL.text }}>{levelCounts.CRITICAL} Critical</span> ·{" "}
              <span style={{ color: levelColors.HIGH.text }}>{levelCounts.HIGH} High</span> ·{" "}
              <span style={{ color: levelColors.MEDIUM.text }}>{levelCounts.MEDIUM} Medium</span> ·{" "}
              <span style={{ color: levelColors.LOW.text }}>{levelCounts.LOW} Low</span>
            </div>
            <button
              onClick={handleClearAll}
              className="text-[10px] text-[hsl(var(--red))] hover:underline"
            >
              Clear All
            </button>
          </div>
        )}
        
        {/* Add Risk */}
        <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
          <div className="grid grid-cols-3 gap-3.5 mb-3">
            <div className="flex flex-col gap-1">
              <Label className="maritime-label">Add Risk Factor</Label>
              <Input
                value={newRisk.factor}
                onChange={(e) => setNewRisk({ ...newRisk, factor: e.target.value })}
                placeholder="e.g. Charterer Default"
                className="maritime-input"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="maritime-label">Severity</Label>
              <Select 
                value={newRisk.level} 
                onValueChange={(v) => setNewRisk({ ...newRisk, level: v as any })}
              >
                <SelectTrigger className="maritime-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[hsl(var(--panel))] border-[hsl(var(--border))]">
                  <SelectItem value="CRITICAL">
                    <span className="text-[#ff6b6b] font-semibold">Critical</span>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <span className="text-[hsl(var(--red))] font-semibold">High</span>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <span className="text-[hsl(var(--amber))] font-semibold">Medium</span>
                  </SelectItem>
                  <SelectItem value="LOW">
                    <span className="text-[hsl(var(--green))] font-semibold">Low</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="maritime-label">Mitigation</Label>
              <Input
                value={newRisk.mitigation}
                onChange={(e) => setNewRisk({ ...newRisk, mitigation: e.target.value })}
                placeholder="Describe the mitigant..."
                className="maritime-input"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              onClick={handleAddRisk}
              disabled={!newRisk.factor || !newRisk.mitigation}
              className="text-xs border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text3))] hover:text-[hsl(var(--text))] hover:border-[hsl(var(--text2))] disabled:opacity-50"
              variant="outline"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add to Matrix
            </Button>
            {availableSuggestions.length > 0 && (
              <Button 
                onClick={() => setShowSuggestions(!showSuggestions)}
                variant="outline"
                className="text-xs border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text3))]"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                {showSuggestions ? 'Hide' : 'View'} Suggestions ({availableSuggestions.length})
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
