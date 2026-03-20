import { useAppStore } from '@/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { computeModel, fmtFull, fmtM, fmtPct } from '@/lib/calculations';

export function SPVStructure() {
  const { vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv, setSPV } = useAppStore();
  const model = computeModel(vessel, acquisition, exit, opex, survey, assumptions, charterYears, spv);
  
  const hasData = model.equity > 0;
  const r0 = model.rows[0] || {};
  
  const mgmtY1 = model.price * model.mgmtFeeRate;
  const commY1 = model.annRev * model.commFeeRate;
  const annFY1 = mgmtY1 + commY1;
  const ndi = model.annRev - (r0.opex || model.allinAnn) - model.dsY1 - annFY1;
  const y1Yield = model.equity > 0 ? (ndi / model.equity * 100) : 0;
  
  const irrCol = (r: number) => r >= 0.1 ? 'text-[hsl(var(--green))]' : r >= 0.05 ? 'text-[hsl(var(--amber))]' : r >= 0 ? 'text-[hsl(var(--amber))]' : 'text-[hsl(var(--red))]';
  
  return (
    <div className="space-y-5">
      {/* Capital Structure */}
      <div className="maritime-card">
        <div className="maritime-card-head">Capital Structure</div>
        <div className="flex flex-col gap-1">
          <Label className="maritime-label">Minimum Investment per Investor (USD)</Label>
          <div className="relative">
            <Input
              type="number"
              value={spv.minInvestment || ''}
              onChange={(e) => setSPV({ minInvestment: parseFloat(e.target.value) || 0 })}
              placeholder="500000"
              className="maritime-input pl-7"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
              $
            </span>
          </div>
          <div className="text-[10px] text-[hsl(var(--text3))]">
            Minimum ticket size — used to calculate how many investors are needed to fill the equity
          </div>
        </div>
        
        <div className="flex gap-2.5 mt-3.5 flex-wrap">
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Total Equity to Raise</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{fmtM(model.equity)}</div>
          </div>
          <div className="metric-tile">
            <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Investors Needed at Min Ticket</div>
            <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
              {spv.minInvestment > 0 && model.equity > 0 ? Math.ceil(model.equity / spv.minInvestment) + ' units' : '—'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Fee Structure */}
      <div className="maritime-card">
        <div className="maritime-card-head">Fee Structure</div>
        <div className="grid grid-cols-3 gap-3.5">
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Management Fee</Label>
            <div className="relative">
              <Input
                type="number"
                step={0.25}
                value={spv.mgmtFee || ''}
                onChange={(e) => setSPV({ mgmtFee: parseFloat(e.target.value) || 0 })}
                placeholder="1.5"
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                %
              </span>
            </div>
            <div className="text-[10px] text-[hsl(var(--text3))]">Annual % of vessel purchase price</div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Charter Brokerage</Label>
            <div className="relative">
              <Input
                type="number"
                step={0.25}
                value={spv.commFee || ''}
                onChange={(e) => setSPV({ commFee: parseFloat(e.target.value) || 0 })}
                placeholder="1.25"
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                %
              </span>
            </div>
            <div className="text-[10px] text-[hsl(var(--text3))]">Brokerage on annual charter hire income</div>
          </div>
          
          <div className="flex flex-col gap-1">
            <Label className="maritime-label">Incentive / Carry (%)</Label>
            <div className="relative">
              <Input
                type="number"
                step={1}
                value={spv.carry || ''}
                onChange={(e) => setSPV({ carry: parseFloat(e.target.value) || 0 })}
                placeholder="20"
                className="maritime-input pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[hsl(var(--text3))] font-mono">
                %
              </span>
            </div>
            <div className="text-[10px] text-[hsl(var(--text3))]">% of exit profit above equity returned</div>
          </div>
        </div>
      </div>
      
      {/* Fee Waterfall */}
      {hasData && (
        <div className="maritime-card">
          <div className="maritime-card-head">Fee Waterfall (Year 1)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-white/[0.03]">
                  <td className="py-2 px-2 text-[hsl(var(--text2))]">Gross Charter Income</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--green))]">{fmtFull(model.annRev)}</td>
                </tr>
                <tr className="border-b border-white/[0.03]">
                  <td className="py-2 px-2 text-[hsl(var(--text2))]">Less: All-in OPEX (Year 1, inflated)</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--red))]">({fmtFull(r0.opex || model.allinAnn)})</td>
                </tr>
                <tr className="border-b border-white/[0.03]">
                  <td className="py-2 px-2 text-[hsl(var(--text2))]">Less: Debt Service (Year 1)</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--red))]">({fmtFull(model.dsY1)})</td>
                </tr>
                <tr className="border-b border-white/[0.03]">
                  <td className="py-2 px-2 text-[hsl(var(--text2))]">Less: Management Fee ({(model.mgmtFeeRate * 100).toFixed(2)}% of vessel price)</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--red))]">({fmtFull(mgmtY1)})</td>
                </tr>
                <tr className="border-b border-white/[0.03]">
                  <td className="py-2 px-2 text-[hsl(var(--text2))]">Less: Charter Brokerage ({(model.commFeeRate * 100).toFixed(2)}% of gross)</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--red))]">({fmtFull(commY1)})</td>
                </tr>
                <tr className="bg-[hsl(var(--panel2))] font-semibold border-t border-[hsl(var(--border))]">
                  <td className="py-2 px-2 text-[hsl(var(--text))]">Net Distributable Income (Y1)</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--gold))]">{fmtFull(ndi)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Exit Carry */}
      {hasData && (
        <div className="maritime-card">
          <div className="maritime-card-head">Exit Carry (Incentive Fee)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-white/[0.03]">
                  <td className="py-2 px-2 text-[hsl(var(--text2))]">Net Exit Proceeds (to SPV)</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">{fmtFull(model.netExit)}</td>
                </tr>
                <tr className="border-b border-white/[0.03]">
                  <td className="py-2 px-2 text-[hsl(var(--text2))]">Less: Return of Equity Capital</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--red))]">({fmtFull(model.equity)})</td>
                </tr>
                <tr className="border-b border-white/[0.03]">
                  <td className="py-2 px-2 text-[hsl(var(--text2))]">Exit Profit (above equity)</td>
                  <td className={`py-2 px-2 font-mono text-right ${model.exitProfit >= 0 ? 'text-[hsl(var(--green))]' : 'text-[hsl(var(--red))]'}`}>
                    {fmtFull(model.exitProfit)}
                  </td>
                </tr>
                <tr className="border-b border-white/[0.03]">
                  <td className="py-2 px-2 text-[hsl(var(--text2))]">Carry / Incentive Fee ({(model.carryRate * 100).toFixed(0)}% of profit)</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--red))]">
                    {model.carryAmount > 0 ? `(${fmtFull(model.carryAmount)})` : '$0'}
                  </td>
                </tr>
                <tr className="bg-[hsl(var(--panel2))] font-semibold border-t border-[hsl(var(--border))]">
                  <td className="py-2 px-2 text-[hsl(var(--text))]">Net to Investors (after carry)</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--gold))]">{fmtFull(model.netToInvestor)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Performance Metrics */}
      {hasData && (
        <>
          <div className="flex gap-2.5 flex-wrap">
            <div className="metric-tile">
              <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Project IRR (pre-fee)</div>
              <div className={`font-mono text-lg font-medium ${irrCol(model.irr)}`}>
                {fmtPct(model.irr)}
              </div>
              <div className="text-[10px] text-[hsl(var(--text3))]">No fees deducted</div>
            </div>
            <div className="metric-tile metric-tile-highlight">
              <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Investor IRR (post-fee)</div>
              <div className={`font-mono text-lg font-medium ${irrCol(model.irrFee)}`}>
                {fmtPct(model.irrFee)}
              </div>
              <div className="text-[10px] text-[hsl(var(--text3))]">After mgmt + commercial</div>
            </div>
            <div className="metric-tile metric-tile-highlight">
              <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">IRR after All Fees + Carry</div>
              <div className={`font-mono text-lg font-medium ${irrCol(model.irrCarry)}`}>
                {fmtPct(model.irrCarry)}
              </div>
              <div className="text-[10px] text-[hsl(var(--text3))]">True investor return</div>
            </div>
            <div className="metric-tile">
              <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Equity Multiple</div>
              <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{model.mult.toFixed(2)}x</div>
            </div>
          </div>
          
          <div className="flex gap-2.5 flex-wrap">
            <div className="metric-tile">
              <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Y1 Cash Yield (NDI/Equity)</div>
              <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{y1Yield.toFixed(1)}%</div>
            </div>
            <div className="metric-tile">
              <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Total Fees (annual, Y1)</div>
              <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{fmtM(annFY1)}</div>
            </div>
            <div className="metric-tile">
              <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Total Carry at Exit</div>
              <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">
                {model.carryAmount > 0 ? fmtM(model.carryAmount) : '$0 (no profit above equity)'}
              </div>
            </div>
            <div className="metric-tile">
              <div className="text-[9px] text-[hsl(var(--text3))] mb-0.5 tracking-wide uppercase">Hold Period</div>
              <div className="font-mono text-lg font-medium text-[hsl(var(--text))]">{model.hold}</div>
            </div>
          </div>
          
          {/* IRR Explanation */}
          {model.irrFee === model.irrCarry && (
            <div className="mt-3 p-3 bg-[hsl(var(--amber-dim))] border border-[hsl(var(--amber))] rounded-lg text-xs text-[hsl(var(--amber))]">
              <strong>Note:</strong> Investor IRR and IRR after Carry are the same because 
              {model.carryAmount <= 0 
                ? ' there is no exit profit above equity returned (carry = $0).'
                : ' the carry amount is small relative to total cash flows.'}
            </div>
          )}
        </>
      )}
      
      {/* Cash Flow Breakdown */}
      {hasData && model.rows.length > 0 && (
        <div className="maritime-card">
          <div className="maritime-card-head">Cash Flow Breakdown by Scenario</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  <th className="text-left py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Year</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Project CF (no fees)</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Investor CF (w/ fees)</th>
                  <th className="text-right py-1.5 px-2 text-[9px] font-semibold tracking-wide uppercase text-[hsl(var(--text3))]">Final CF (w/ carry)</th>
                </tr>
              </thead>
              <tbody>
                {model.rows.map((r, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2 px-2 text-[hsl(var(--text2))]">
                      {i === 0 ? 'Initial' : `Year ${r.year}${r.isLast ? ' (Exit)' : ''}`}
                    </td>
                    <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">
                      {i === 0 ? `(${fmtFull(model.equity)})` : fmtFull(r.cf)}
                    </td>
                    <td className="py-2 px-2 font-mono text-right text-[hsl(var(--gold))]">
                      {i === 0 ? `(${fmtFull(model.equity)})` : fmtFull(r.cfFee)}
                    </td>
                    <td className="py-2 px-2 font-mono text-right text-[hsl(var(--green))]">
                      {i === 0 
                        ? `(${fmtFull(model.equity)})` 
                        : r.isLast && model.carryAmount > 0 
                          ? fmtFull(r.cfFee - model.carryAmount) + ' *'
                          : fmtFull(r.cfFee)
                      }
                    </td>
                  </tr>
                ))}
                <tr className="bg-[hsl(var(--panel2))] font-semibold border-t border-[hsl(var(--border))]">
                  <td className="py-2 px-2 text-[hsl(var(--text))]">IRR</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--text))]">{fmtPct(model.irr)}</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--gold))]">{fmtPct(model.irrFee)}</td>
                  <td className="py-2 px-2 font-mono text-right text-[hsl(var(--green))]">{fmtPct(model.irrCarry)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {model.carryAmount > 0 && (
            <div className="mt-2 text-[10px] text-[hsl(var(--text3))]">
              * Final year reduced by carry amount of {fmtM(model.carryAmount)}
            </div>
          )}
        </div>
      )}
      
      {/* Distribution Profile */}
      <div className="maritime-card">
        <div className="maritime-card-head">Distribution Profile</div>
        <div className="text-[13px] text-[hsl(var(--text2))] leading-7">
          <div>• <strong className="text-[hsl(var(--text))]">Structure:</strong> Dedicated SPV — asset-backed, equity partner participation</div>
          <div>• <strong className="text-[hsl(var(--text))]">Waterfall:</strong> Revenue → OPEX → Debt Service → Fees → Investor Distribution</div>
          <div>• <strong className="text-[hsl(var(--text))]">Distributions:</strong> Quarterly to equity partners</div>
          <div>• <strong className="text-[hsl(var(--text))]">Exit:</strong> Net sale proceeds pro-rata after balloon repayment, per ownership register</div>
          <div>• <strong className="text-[hsl(var(--text))]">Survey Reserve:</strong> Provisions held in escrow — not distributable</div>
        </div>
      </div>
    </div>
  );
}
