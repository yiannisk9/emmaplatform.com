import { useAppStore } from '@/store';
import { Check } from 'lucide-react';

interface NavItem {
  id: number;
  num: string;
  label: string;
  group?: string;
}

const navItems: NavItem[] = [
  { id: 0, num: '§1', label: 'Vessel Overview', group: 'Vessel & Structure' },
  { id: 1, num: '§2', label: 'Acquisition' },
  { id: 2, num: '§6', label: 'Assumptions', group: 'Costs' },
  { id: 3, num: '§3', label: 'OPEX Detail' },
  { id: 4, num: '§4', label: 'Surveys & Capex' },
  { id: 5, num: '§5', label: 'Ownership Costs' },
  { id: 6, num: '§7', label: 'Charter Hire Income', group: 'Analysis' },
  { id: 7, num: '§8', label: 'Cash Flow Summary' },
  { id: 8, num: '§9', label: 'SPV Structure', group: 'Investor View' },
  { id: 9, num: '§10', label: 'Conclusion' },
  { id: 10, num: '§11', label: 'Sensitivity & Final' }
];

export function Sidebar() {
  const { 
    currentSection, setCurrentSection, vessel, acquisition, 
    opex, survey, assumptions, resetAll 
  } = useAppStore();
  
  const handleNavClick = (id: number) => {
    setCurrentSection(id);
  };
  
  const isSectionComplete = (id: number): boolean => {
    switch (id) {
      case 0: return !!vessel.name;
      case 1: return acquisition.price > 0;
      case 2: return assumptions.tcRate > 0;
      case 3: return opex.crew > 0;
      case 4: return survey.ssCost > 0;
      case 5: return true; // Calculated section
      case 6: return assumptions.tcRate > 0;
      case 7: return true; // Calculated section
      case 8: return true; // SPV section
      case 9: return true; // Conclusion
      case 10: return true; // Sensitivity
      default: return false;
    }
  };
  
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
  
  let lastGroup = '';
  
  return (
    <nav className="w-[220px] flex-shrink-0 bg-[hsl(220,25%,7%)] border-r border-[hsl(var(--border))] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
        {navItems.map((item) => {
          const showGroup = item.group && item.group !== lastGroup;
          if (showGroup) lastGroup = item.group || '';
          
          return (
            <div key={item.id}>
              {showGroup && (
                <div className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-[hsl(var(--text3))] px-4 pt-3.5 pb-1.5">
                  {item.group}
                </div>
              )}
              <button
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-2 px-4 py-2 cursor-pointer transition-all duration-200 text-left border-l-2 relative ${
                  currentSection === item.id
                    ? 'bg-[hsl(var(--gold-dim))] text-[hsl(var(--gold))] border-l-[hsl(var(--gold))]'
                    : 'text-[hsl(var(--text2))] border-l-transparent hover:bg-white/[0.03] hover:text-[hsl(var(--text))]'
                }`}
              >
                <span className={`font-mono text-[9px] font-medium min-w-[24px] ${
                  currentSection === item.id ? 'text-[hsl(var(--gold))]' : 'text-[hsl(var(--text3))]'
                }`}>
                  {item.num}
                </span>
                <span className="text-[12.5px]">{item.label}</span>
                {isSectionComplete(item.id) && (
                  <Check className={`w-3 h-3 ml-auto ${
                    currentSection === item.id ? 'text-[hsl(var(--gold))]' : 'text-[hsl(var(--green))]'
                  }`} />
                )}
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Footer Actions */}
      <div className="p-3 border-t border-[hsl(var(--border))] flex gap-1.5 flex-wrap">
        <button 
          onClick={handleReset}
          className="flex-1 px-2 py-1.5 rounded-md border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text3))] text-[11px] text-center transition-all duration-200 hover:text-[hsl(var(--text))] hover:border-[hsl(var(--text2))]"
        >
          Clear
        </button>
        <button 
          onClick={handleExport}
          className="flex-1 px-2 py-1.5 rounded-md border border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text3))] text-[11px] text-center transition-all duration-200 hover:text-[hsl(var(--text))] hover:border-[hsl(var(--text2))]"
        >
          Save
        </button>
        <button 
          onClick={handlePrint}
          className="flex-1 px-2 py-1.5 rounded-md bg-[hsl(var(--gold-dim))] text-[hsl(var(--gold))] border border-[hsl(var(--gold-border))] text-[11px] text-center transition-all duration-200 hover:bg-[hsl(var(--gold))] hover:text-[hsl(220,35%,5%)]"
        >
          PDF
        </button>
      </div>
    </nav>
  );
}
