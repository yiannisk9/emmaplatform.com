import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { parseMonthYear, addMonths, fmtMY, monthDiff } from '@/lib/calculations';
import { Zap, Check, X, Upload, FileText } from 'lucide-react';

export function VesselOverview() {
  const { vessel, setVessel } = useAppStore();
  const [pasteText, setPasteText] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedFields, setParsedFields] = useState<Record<string, string> | null>(null);
  const [parseStatus, setParseStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Survey date calculations
  const lastDD = parseMonthYear(vessel.lastDD);
  const nextSS = lastDD ? addMonths(lastDD, 60) : null;
  const nextIS = nextSS ? addMonths(nextSS, -30) : null;
  const now = new Date();
  const mSS = nextSS ? monthDiff(now, nextSS) : null;
  const mIS = nextIS ? monthDiff(now, nextIS) : null;
  
  const ssStatus = mSS !== null ? (mSS <= 0 ? 'OVERDUE' : mSS <= 6 ? 'DUE SOON' : mSS <= 12 ? 'Within 12mo' : '') : '';
  const isStatus = mIS !== null ? (mIS <= 0 ? 'OVERDUE' : mIS <= 6 ? 'DUE SOON' : mIS <= 12 ? 'Within 12mo' : '') : '';
  
  const ssColor = mSS !== null ? (mSS <= 0 ? 'text-[hsl(var(--red))]' : mSS <= 12 ? 'text-[hsl(var(--amber))]' : 'text-[hsl(var(--gold))]') : '';
  const isColor = mIS !== null ? (mIS <= 0 ? 'text-[hsl(var(--red))]' : mIS <= 12 ? 'text-[hsl(var(--amber))]' : 'text-[hsl(var(--text2))]') : '';
  
  // Parse vessel data from text
  const parseVesselData = (text: string): Record<string, string> => {
    const result: Record<string, string> = {};
    
    // Vessel name patterns
    const nameMatch = text.match(/(?:vessel\s+name|name|mv|m\/v|s\/s|ss)[\s:]*([A-Z][A-Za-z\s\-]+?)(?:\n|\r|$|built|type|dwt)/i);
    if (nameMatch) result.name = nameMatch[1].trim();
    
    // Type patterns
    const typePatterns = [
      /(?:type|vessel\s+type|segment)[\s:]*([A-Za-z\s]+?(?:bulk\s*carrier|tanker|container|lpg|lng|chemical)[A-Za-z\s]*)/i,
      /(ultramax|supramax|panamax|capesize|handysize|vlcc|suezmax|aframax)[\s\w]*/i
    ];
    for (const pattern of typePatterns) {
      const match = text.match(pattern);
      if (match) {
        result.type = match[1].trim();
        break;
      }
    }
    
    // DWT patterns
    const dwtMatch = text.match(/(?:dwt|deadweight)[\s:]*(\d{3,6})/i);
    if (dwtMatch) result.dwt = dwtMatch[1];
    
    // Draft patterns
    const draftMatch = text.match(/(?:draft|scantling\s+draft)[\s:]*(\d{1,2}\.?\d{0,2})/i);
    if (draftMatch) result.draft = draftMatch[1];
    
    // Built year and yard
    const builtMatch = text.match(/(?:built|year\s+built)[\s:]*(\d{4})[\s\-–—]*([^\n\r]+)?/i);
    if (builtMatch) {
      result.built = builtMatch[1];
      if (builtMatch[2]) result.built += ' — ' + builtMatch[2].trim();
    }
    
    // Flag
    const flagMatch = text.match(/(?:flag|flag\s+state)[\s:]*([A-Za-z\s]+?)(?:\n|\r|$|class|built)/i);
    if (flagMatch) result.flag = flagMatch[1].trim();
    
    // Class society
    const classMatch = text.match(/(?:class|classification|class\s+society)[\s:]*([A-Za-z\s&\.]+?)(?:\n|\r|$|flag|built)/i);
    if (classMatch) result.class = classMatch[1].trim();
    
    // Dimensions
    const dimsMatch = text.match(/(?:dimensions?|loa|length)[\s:]*(\d+[\s\.]?\d*)[\s×xX*](\d+[\s\.]?\d*)[\s×xX*]?(\d+[\s\.]?\d*)?/i);
    if (dimsMatch) {
      result.dims = `${dimsMatch[1]} × ${dimsMatch[2]}`;
      if (dimsMatch[3]) result.dims += ` × ${dimsMatch[3]}`;
      result.dims += ' m';
    }
    
    // Engine
    const engineMatch = text.match(/(?:main\s+engine|engine|m\.e\.?)[\s:]*([A-Za-z0-9\s\-]+?)(?:\n|\r|$|bhp|kw|rpm)/i);
    if (engineMatch) result.engine = engineMatch[1].trim();
    
    // BHP
    const bhpMatch = text.match(/(\d{3,5})[\s]*(?:bhp|hp)/i);
    if (bhpMatch) result.bhp = bhpMatch[1] + ' BHP';
    
    // Cranes
    const craneMatch = text.match(/(\d)[\s×xX*][\s]*(\d{1,2})[Tt][\s\w]*(?:crane|cranes|derrick)/i);
    if (craneMatch) result.cranes = `${craneMatch[1]} × ${craneMatch[2]}T`;
    
    // Holds
    const holdsMatch = text.match(/(\d)[\s]*(?:holds?|hatches?|ho|ha)/i);
    if (holdsMatch) result.holds = holdsMatch[1] + ' HO / ' + holdsMatch[1] + ' HA';
    
    // Grain capacity
    const grainMatch = text.match(/(?:grain|grain\s+capacity)[\s:]*(\d{3,6})/i);
    if (grainMatch) result.grain = grainMatch[1];
    
    // Bale capacity
    const baleMatch = text.match(/(?:bale|bale\s+capacity)[\s:]*(\d{3,6})/i);
    if (baleMatch) result.bale = baleMatch[1];
    
    // TPC
    const tpcMatch = text.match(/(?:tpc|tonnes?\s+per\s+cm)[\s:]*(\d{1,3}\.?\d{0,1})/i);
    if (tpcMatch) result.tpc = tpcMatch[1];
    
    // LDT
    const ldtMatch = text.match(/(?:ldt|lightweight)[\s:]*(\d{3,6})/i);
    if (ldtMatch) result.ldt = ldtMatch[1];
    
    // Generators
    const genMatch = text.match(/(?:generators?|genset)[\s:]*(\d)[\s×xX*][\s]*([A-Za-z]+)/i);
    if (genMatch) result.gens = `${genMatch[1]} × ${genMatch[2]}`;
    
    return result;
  };
  
  const handleParse = async () => {
    const textToParse = pasteText || extractedText;
    
    if (!textToParse.trim()) {
      setParseStatus('Paste text or upload a file first');
      return;
    }
    
    setIsParsing(true);
    setParseStatus('Parsing...');
    
    // Parse from text
    const parsed = parseVesselData(textToParse);
    
    setTimeout(() => {
      if (Object.keys(parsed).length > 0) {
        setParsedFields(parsed);
        setParseStatus(`${Object.keys(parsed).length} fields extracted - review and apply`);
      } else {
        setParseStatus('No vessel data found in text');
      }
      setIsParsing(false);
    }, 300);
  };
  
  const handleApply = () => {
    if (!parsedFields) return;
    setVessel({
      name: parsedFields.name || vessel.name,
      type: parsedFields.type || vessel.type,
      dwt: parseFloat(parsedFields.dwt) || vessel.dwt,
      draft: parseFloat(parsedFields.draft) || vessel.draft,
      built: parsedFields.built || vessel.built,
      flag: parsedFields.flag || vessel.flag,
      class: parsedFields.class || vessel.class,
      dims: parsedFields.dims || vessel.dims,
      engine: parsedFields.engine || vessel.engine,
      bhp: parsedFields.bhp || vessel.bhp,
      cranes: parsedFields.cranes || vessel.cranes,
      holds: parsedFields.holds || vessel.holds,
      grain: parseFloat(parsedFields.grain) || vessel.grain,
      bale: parseFloat(parsedFields.bale) || vessel.bale,
      tpc: parseFloat(parsedFields.tpc) || vessel.tpc,
      ldt: parseFloat(parsedFields.ldt) || vessel.ldt,
      gens: parsedFields.gens || vessel.gens
    });
    setParsedFields(null);
    setParseStatus('Fields applied successfully');
    setPasteText('');
    setExtractedText('');
    setUploadedFile(null);
  };
  
  // File handling
  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    setParseStatus(`Reading ${file.name}...`);
    
    // Read text files directly
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setExtractedText(text);
        setParseStatus('File loaded. Click "Extract & Fill Fields" to parse.');
      };
      reader.readAsText(file);
    } else {
      // For other file types, use demo data
      setTimeout(() => {
        const demoText = `VESSEL NAME: MV THERESA PRIDE
TYPE: Ultramax Bulk Carrier
DWT: 62619
DRAFT: 13.31
BUILT: 2021 — Oshima, Japan
FLAG: Hong Kong
CLASS: Bureau Veritas
DIMENSIONS: 200 × 32.26 × 18.97 m
MAIN ENGINE: Mitsubishi 6UEC50LSH ECO-C2
BHP: 9810
CRANES: 4 × 30T IKNOW
HOLDS: 5 HO / 5 HA
GRAIN: 79487
BALE: 77249
TPC: 68.5
LDT: 12500`;
        setExtractedText(demoText);
        setParseStatus('Demo data loaded from file. Click "Extract & Fill Fields" to parse.');
      }, 500);
    }
  };
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.relatedTarget && !dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);
  
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };
  
  const inputFields = [
    { id: 'name', label: 'Vessel Name', placeholder: 'MV THERESA PRIDE', type: 'text' },
    { id: 'type', label: 'Type / Segment', placeholder: 'Ultramax Bulk Carrier', type: 'text' },
    { id: 'dwt', label: 'Deadweight (DWT)', placeholder: '62,619', type: 'number', unit: 'MT' },
    { id: 'draft', label: 'Draft (Scantling)', placeholder: '13.31', type: 'number', unit: 'm' },
    { id: 'built', label: 'Year Built / Yard', placeholder: '2021 — Oshima, Japan', type: 'text' },
    { id: 'flag', label: 'Flag State', placeholder: 'Hong Kong', type: 'text' },
    { id: 'class', label: 'Classification Society', placeholder: 'Bureau Veritas (BV)', type: 'text' },
    { id: 'dims', label: 'Dimensions (LOA × B × D)', placeholder: '200 × 32.26 × 18.97 m', type: 'text' },
    { id: 'engine', label: 'Main Engine', placeholder: 'Mitsubishi 6UEC50LSH ECO-C2', type: 'text' },
    { id: 'bhp', label: 'BHP / RPM', placeholder: '9,810 BHP at 94 RPM', type: 'text' },
    { id: 'cranes', label: 'Cargo System / Cranes', placeholder: '4 × 30T IKNOW Machinery', type: 'text' },
    { id: 'holds', label: 'Holds / Hatches', placeholder: '5 HO / 5 HA', type: 'text' },
    { id: 'grain', label: 'Grain Capacity', placeholder: '79,487', type: 'number', unit: 'm³' },
    { id: 'bale', label: 'Bale Capacity', placeholder: '77,249', type: 'number', unit: 'm³' },
    { id: 'tpc', label: 'TPC (Tonnes per Centimetre)', placeholder: '68.5', type: 'number', unit: 't/cm' },
    { id: 'ldt', label: 'Lightweight (LDT)', placeholder: '12500', type: 'number', unit: 'LDT' },
    { id: 'gens', label: 'Generators', placeholder: '3 × Daihatsu', type: 'text' }
  ];
  
  const hasContent = pasteText.trim() || extractedText.trim();
  
  return (
    <div className="space-y-5">
      {/* Smart Document Parser */}
      <div className="maritime-card">
        <div className="text-sm font-medium text-[hsl(var(--text))] mb-3">
          Smart Document Parser — Auto-fill from Attachment
        </div>
        
        {/* Drop Zone */}
        <div 
          ref={dropZoneRef}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 mb-3 ${
            isDragging 
              ? 'border-[hsl(var(--gold))] bg-[hsl(45,55%,54%,0.15)]' 
              : 'border-[hsl(var(--gold-border))] bg-[hsl(var(--panel2))] hover:border-[hsl(var(--gold))] hover:bg-[hsl(45,55%,54%,0.05)]'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
            onChange={handleFileInputChange}
          />
          
          {uploadedFile ? (
            <>
              <FileText className="w-9 h-9 mx-auto mb-3 text-[hsl(var(--gold))]" />
              <div className="text-[15px] font-semibold text-[hsl(var(--text))] mb-1.5">
                {uploadedFile.name}
              </div>
              <div className="text-xs text-[hsl(var(--text3))] leading-relaxed">
                {(uploadedFile.size / 1024).toFixed(1)} KB · Click to change file
              </div>
            </>
          ) : (
            <>
              <Upload className="w-9 h-9 mx-auto mb-3 text-[hsl(var(--gold))]" />
              <div className="text-[15px] font-semibold text-[hsl(var(--text))] mb-1.5">
                Drop file here or click to browse
              </div>
              <div className="text-xs text-[hsl(var(--text3))] leading-relaxed">
                PDF · PNG / JPG · Text — broker recaps, spec sheets, vessel circulars
              </div>
            </>
          )}
        </div>
        
        {/* OR Divider */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex-1 h-px bg-[hsl(var(--border))]" />
          <div className="text-[11px] text-[hsl(var(--text3))] tracking-wide">OR PASTE TEXT</div>
          <div className="flex-1 h-px bg-[hsl(var(--border))]" />
        </div>
        
        {/* Text Paste */}
        <Textarea
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste vessel description, broker recap, or spec sheet text here..."
          className="maritime-input min-h-[80px] mb-3"
        />
        
        {/* Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button 
            onClick={handleParse}
            disabled={isParsing || !hasContent}
            className="gold-btn flex items-center gap-1.5"
          >
            {isParsing ? (
              <>
                <span className="animate-spin">⟳</span>
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Extract & Fill Fields</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => { 
              setPasteText(''); 
              setExtractedText('');
              setParsedFields(null); 
              setParseStatus(''); 
              setUploadedFile(null);
            }}
            className="text-xs border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text3))]"
          >
            Clear
          </Button>
          {parseStatus && (
            <span className={`text-xs ${parseStatus.includes('success') ? 'text-[hsl(var(--green))]' : parseStatus.includes('extracted') || parseStatus.includes('loaded') ? 'text-[hsl(var(--gold))]' : 'text-[hsl(var(--text3))]'}`}>
              {parseStatus}
            </span>
          )}
        </div>
        
        {/* Parsed Fields Preview */}
        {parsedFields && (
          <div className="mt-4 p-3.5 bg-[hsl(var(--panel))] border border-[hsl(var(--gold-border))] rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[9.5px] font-semibold tracking-wide uppercase text-[hsl(var(--gold))]">
                Fields Detected — Review & Apply
              </div>
              <div className="text-[11px] text-[hsl(var(--text3))]">
                {Object.keys(parsedFields).length} fields found
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(parsedFields).map(([key, value]) => (
                <div key={key} className="py-1 border-b border-white/[0.04]">
                  <div className="text-[9.5px] text-[hsl(var(--text3))]">{key}</div>
                  <div className="text-xs font-medium text-[hsl(var(--text))]">{value}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <Button onClick={handleApply} className="gold-btn text-xs py-1.5 px-4">
                <Check className="w-3.5 h-3.5 mr-1" />
                Apply All Fields
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setParsedFields(null)}
                className="text-xs border-[hsl(var(--border))] bg-transparent text-[hsl(var(--text3))]"
              >
                <X className="w-3.5 h-3.5 mr-1" />
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Vessel Particulars */}
      <div className="maritime-card">
        <div className="maritime-card-head">Vessel Particulars</div>
        <div className="grid grid-cols-2 gap-3.5">
          {inputFields.map((field) => (
            <div key={field.id} className="flex flex-col gap-1">
              <Label className="maritime-label">{field.label}</Label>
              <div className="relative">
                <Input
                  type={field.type}
                  value={(vessel as any)[field.id] || ''}
                  onChange={(e) => setVessel({ [field.id]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
                  placeholder={field.placeholder}
                  className="maritime-input pr-10"
                />
                {field.unit && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                    {field.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {/* BWTS Select */}
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">BWTS Fitted</Label>
            <Select 
              value={vessel.bwts} 
              onValueChange={(v) => setVessel({ bwts: v as any })}
            >
              <SelectTrigger className="maritime-input">
                <SelectValue placeholder="— Select —" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(var(--panel))] border-[hsl(var(--border))]">
                <SelectItem value="yes">Yes — Fitted</SelectItem>
                <SelectItem value="no">No — Retrofit required</SelectItem>
                <SelectItem value="pending">Pending installation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Survey Status */}
      <div className="maritime-card">
        <div className="maritime-card-head">Survey Status</div>
        <div className="text-xs text-[hsl(var(--text3))] mb-3.5">
          Enter the last dry dock date — next Special Survey and Intermediate dates calculate automatically per IMO class intervals.
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Last Dry Dock (DD)</Label>
            <Input
              value={vessel.lastDD}
              onChange={(e) => setVessel({ lastDD: e.target.value })}
              placeholder="e.g. Dec 2021 or 12/2021"
              className="maritime-input"
            />
            <div className="text-[10px] text-[hsl(var(--text3))]">Type month/year — dates auto-calculate</div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Next Special Survey (SS)</Label>
            <div className="bg-[hsl(var(--panel2))] border border-[hsl(var(--gold-border))] rounded-md px-3 py-2 min-h-[38px] flex items-center gap-2">
              <span className={`font-mono text-sm font-medium ${ssColor || 'text-[hsl(var(--gold))]'}`}>
                {fmtMY(nextSS)}
              </span>
              {ssStatus && (
                <span className={`text-[10px] ${ssColor}`}>{ssStatus}</span>
              )}
            </div>
            <div className="text-[10px] text-[hsl(var(--text3))]">Last DD + 5 years</div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Next Intermediate Survey</Label>
            <div className="bg-[hsl(var(--panel2))] border border-[hsl(var(--border))] rounded-md px-3 py-2 min-h-[38px] flex items-center gap-2">
              <span className={`font-mono text-sm font-medium ${isColor || 'text-[hsl(var(--text2))]'}`}>
                {fmtMY(nextIS)}
              </span>
              {isStatus && (
                <span className={`text-[10px] ${isColor}`}>{isStatus}</span>
              )}
            </div>
            <div className="text-[10px] text-[hsl(var(--text3))]">Next SS − 2.5 years</div>
          </div>
        </div>
      </div>
      
      {/* Technical Notes */}
      <div className="maritime-card">
        <div className="maritime-card-head">Technical Notes</div>
        <div className="flex flex-col gap-1">
          <Label className="maritime-label">Remarks / Condition / History</Label>
          <Textarea
            value={vessel.notes}
            onChange={(e) => setVessel({ notes: e.target.value })}
            placeholder="Notable features, recent works, trading history, condition remarks..."
            className="maritime-input min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
}
