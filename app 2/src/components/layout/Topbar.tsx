import { useAppStore } from '@/store';
import { computeModel } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { RotateCcw, Download, Printer } from 'lucide-react';

const sectionMeta = [
  '§1 · Vessel Overview',
  '§2 · Acquisition Structure',
  '§6 · Study Assumptions',
  '§3 · OPEX Detail',
  '§4 · Surveys & Capex',
  '§5 · Ownership Costs',
  '§7 · Charter Hire Income',
  '§8 · Cash Flow Summary',
  '§9 · SPV Structure',
  '§10 · Conclusion',
  '§11 · Sensitivity & Final'
];

export function Topbar() {
  const { 
    vessel, acquisition, exit, opex, survey, 
    assumptions, charterYears, spv, currentSection, resetAll 
  } = useAppStore();
  
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  const handleExport = () => {
    const data = useAppStore.getState().exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feasibility_${(vessel.name || 'vessel').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleReset = () => {
    if (confirm('Clear all data and reset the study?')) {
      resetAll();
    }
  };
  
  // Determine status
  let statusClass = 'empty';
  let statusText = 'AWAITING DATA';
  
  if (model.price && model.tc) {
    const margin = model.tc - model.beDaily;
    if (model.irrCarry >= 0.08 && margin >= 0) {
      statusClass = 'viable';
      statusText = `VIABLE — ${(model.irrCarry * 100).toFixed(1)}% IRR`;
    } else if (model.irrCarry >= 0) {
      statusClass = 'marginal';
      statusText = `MARGINAL — ${(model.irrCarry * 100).toFixed(1)}% IRR`;
    } else {
      statusClass = 'risk';
      statusText = `AT RISK — ${(model.irrCarry * 100).toFixed(1)}% IRR`;
    }
  }
  
  return (
    <header className="h-[52px] bg-[hsl(220,25%,7%)] border-b border-[hsl(var(--border))] flex items-center gap-0 flex-shrink-0 z-50">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-full border-r border-[hsl(var(--border))]">
        <div className="w-[30px] h-[30px] border-[1.5px] border-[hsl(var(--gold))] flex items-center justify-center font-serif text-sm font-bold text-[hsl(var(--gold))] tracking-wide">
          M
        </div>
        <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[hsl(var(--text2))]">
          Maritime Investment Platform
        </div>
      </div>
      
      {/* Vessel Info */}
      <div className="px-5 h-full flex flex-col justify-center border-r border-[hsl(var(--border))]">
        <div className="font-serif text-[15px] text-[hsl(var(--gold))] font-semibold">
          {vessel.name || 'New Study'}
        </div>
        <div className="text-[11px] text-[hsl(var(--text3))] tracking-wide">
          {vessel.type || 'Enter vessel details in §1'}
        </div>
      </div>
      
      {/* Section Crumb */}
      <div className="px-4 h-full flex items-center text-[11px] text-[hsl(var(--text3))] tracking-[0.08em] uppercase border-r border-[hsl(var(--border))]">
        {sectionMeta[currentSection]}
      </div>
      
      {/* Status Pill */}
      <div 
        className={`mx-4 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-200 ${
          statusClass === 'viable' 
            ? 'bg-[hsl(var(--green-dim))] text-[hsl(var(--green))] border border-[hsl(var(--green))]' 
            : statusClass === 'marginal'
            ? 'bg-[hsl(var(--amber-dim))] text-[hsl(var(--amber))] border border-[hsl(var(--amber))]'
            : statusClass === 'risk'
            ? 'bg-[hsl(var(--red-dim))] text-[hsl(var(--red))] border border-[hsl(var(--red))]'
            : 'bg-transparent text-[hsl(var(--text3))] border border-[hsl(var(--border))]'
        }`}
      >
        {statusText}
      </div>
      
      {/* Right Actions */}
      <div className="ml-auto flex items-center gap-2 pr-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleReset}
          className="text-[11px] h-7 border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text3))] hover:text-[hsl(var(--text))] hover:border-[hsl(var(--text3))]"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          className="text-[11px] h-7 border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text3))] hover:text-[hsl(var(--text))] hover:border-[hsl(var(--text3))]"
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          Export JSON
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePrint}
          className="text-[11px] h-7 bg-[hsl(var(--gold-dim))] text-[hsl(var(--gold))] border-[hsl(var(--gold-border))] hover:bg-[hsl(var(--gold))] hover:text-[hsl(220,35%,5%)]"
        >
          <Printer className="w-3.5 h-3.5 mr-1" />
          Print PDF
        </Button>
      </div>
    </header>
  );
}
