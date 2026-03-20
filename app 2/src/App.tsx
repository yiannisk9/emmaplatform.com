import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/layout/Dashboard';
import { VesselOverview } from '@/components/sections/VesselOverview';
import { AcquisitionStructure } from '@/components/sections/AcquisitionStructure';
import { StudyAssumptions } from '@/components/sections/StudyAssumptions';
import { OpexDetail } from '@/components/sections/OpexDetail';
import { SurveysCapex } from '@/components/sections/SurveysCapex';
import { OwnershipCosts } from '@/components/sections/OwnershipCosts';
import { CharterHireIncome } from '@/components/sections/CharterHireIncome';
import { CashFlowSummary } from '@/components/sections/CashFlowSummary';
import { SPVStructure } from '@/components/sections/SPVStructure';
import { Conclusion } from '@/components/sections/Conclusion';
import { SensitivityAnalysis } from '@/components/sections/SensitivityAnalysis';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const sections = [
  { id: 0, title: 'Vessel Overview', eyebrow: '§1 · Technical Particulars', desc: 'Full vessel particulars, survey status, and technical notes. Use the Smart Paste panel to auto-fill from any broker recap.', component: VesselOverview },
  { id: 1, title: 'Acquisition Structure', eyebrow: '§2 · Funding Structure', desc: 'Purchase price, equity/debt split, balloon, and loan terms', component: AcquisitionStructure },
  { id: 2, title: 'Study Assumptions', eyebrow: '§3 · Operating Parameters', desc: 'Charter rate, hold period, revenue days, and key study parameters', component: StudyAssumptions },
  { id: 3, title: 'OPEX Detail', eyebrow: '§4 · Cost Structure', desc: 'Itemised annual OPEX and inflation escalation', component: OpexDetail },
  { id: 4, title: 'Surveys & Capex', eyebrow: '§5 · Planned Expenditure', desc: 'Dry docking, special surveys, and capital items — amortised daily over the hold period', component: SurveysCapex },
  { id: 5, title: 'Ownership Costs', eyebrow: '§6 · Cost Stack', desc: 'Complete daily cost stack, breakeven T/C rate, and margin analysis', component: OwnershipCosts },
  { id: 6, title: 'Charter Hire Income', eyebrow: '§7 · Charter Hire Income', desc: 'Year-by-year hire rates — enter market-specific rates for each year or apply a flat rate across all years', component: CharterHireIncome },
  { id: 7, title: 'Cash Flow Summary', eyebrow: '§8 · Equity Returns', desc: 'Year-by-year cash flows to equity with compounding OPEX inflation applied', component: CashFlowSummary },
  { id: 8, title: 'SPV Structure', eyebrow: '§9 · Investor View', desc: 'Fee structure, waterfall, carry, and investor return profile', component: SPVStructure },
  { id: 9, title: 'Conclusion', eyebrow: '§10 · Final Determination', desc: 'Auto-generated status, risk assessment, and final determination', component: Conclusion },
  { id: 10, title: 'Sensitivity & Final', eyebrow: '§11 · Sensitivity & Final Determination', desc: 'T/C rate sensitivity with IRR / ROI — and the final investment determination', component: SensitivityAnalysis }
];

function App() {
  const { currentSection, setCurrentSection } = useAppStore();
  
  const currentSectionData = sections.find(s => s.id === currentSection) || sections[0];
  const SectionComponent = currentSectionData.component;
  
  const goNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };
  
  const goPrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };
  
  return (
    <div className="h-screen flex flex-col bg-[hsl(220,35%,5%)] overflow-hidden">
      <Topbar />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto scrollbar-thin p-7 pb-20">
            {/* Section Header */}
            <div className="mb-7">
              <div className="section-eyebrow">{currentSectionData.eyebrow}</div>
              <h1 className="section-title">{currentSectionData.title}</h1>
              <p className="section-desc">{currentSectionData.desc}</p>
            </div>
            
            {/* Section Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <SectionComponent />
            </div>
            
            {/* Page Navigation */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[hsl(var(--border))]">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={currentSection === 0}
                className="text-xs border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text3))] hover:text-[hsl(var(--text))] hover:border-[hsl(var(--text2))] disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {currentSection > 0 ? sections[currentSection - 1].title : ''}
              </Button>
              
              <Button
                variant="outline"
                onClick={goNext}
                disabled={currentSection === sections.length - 1}
                className="text-xs bg-[hsl(var(--gold-dim))] text-[hsl(var(--gold))] border-[hsl(var(--gold-border))] hover:bg-[hsl(var(--gold))] hover:text-[hsl(220,35%,5%)] disabled:opacity-50"
              >
                {currentSection < sections.length - 1 ? sections[currentSection + 1].title : ''}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </main>
        
        <Dashboard />
      </div>
    </div>
  );
}

export default App;
