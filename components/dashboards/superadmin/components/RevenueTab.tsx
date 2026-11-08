import React, { useState } from "react";
import { EscrowTransaction } from "../SuperAdminData";
import { 
  DollarSign, Search, AlertTriangle, Play, FileText, Download, Check, 
  ArrowUpRight, RefreshCw, Layers, ShieldAlert, Ban, Sparkles, CheckCircle2
} from "lucide-react";

interface RevenueTabProps {
  transactions: EscrowTransaction[];
  selectedTransactionId: string | null;
  setSelectedTransactionId: (id: string | null) => void;
  onAction: (actionType: string, tx: EscrowTransaction) => void;
  activeSub: string;
  currencyCodeUsed: string;
  renderCurrency: (val: number) => string;
}

export default function RevenueTab({
  transactions,
  selectedTransactionId,
  setSelectedTransactionId,
  onAction,
  activeSub,
  currencyCodeUsed,
  renderCurrency
}: RevenueTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [generatePeriod, setGeneratePeriod] = useState("Q2 2026");

  const selectedTx = transactions.find(t => t.id === selectedTransactionId) || transactions[0];

  // Filters based on sub-tabs
  const filteredTxs = transactions.filter(t => {
    // 1. Search term filter
    const matchesSearch = 
      t.senderName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.receiverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Tab filtering
    switch (activeSub) {
      case "Commissions":
        return t.type === "Broker Commission";
      case "Investor Income":
        return t.type === "REIT Dividend";
      case "Escrow & Wallets":
        return t.status === "Pending Escrow" || t.status === "Frozen Locked";
      case "Transactions":
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      
      {/* 1. FINANCIAL MONITORS RIBBON (Always shown in Overview or Transactions) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono">
        <div className="rounded-xl border border-slate-800 bg-[#0c1224] p-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500"></div>
          <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">GLOBAL ESCOW LIQUIDITY</span>
          <span className="text-xl font-bold text-white block">{renderCurrency(492041800)}</span>
          <span className="text-[9px] text-emerald-400 mt-1 block">● Nominal Solvent Cap Required</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0c1224] p-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-400"></div>
          <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">TOTAL COMMISSIONS ACCRUED</span>
          <span className="text-xl font-bold text-emerald-400 block">{renderCurrency(18473000)}</span>
          <span className="text-[9px] text-slate-400 mt-1 block">● 2.0% Default Platform Notary rate</span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0c1224] p-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-purple-400"></div>
          <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">REIT ANNUAL DIVIDEND PENDING</span>
          <span className="text-xl font-bold text-purple-400 block">{renderCurrency(32400000)}</span>
          <span className="text-[9px] text-purple-400 mt-1 block flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Yield cycle dynamic projection
          </span>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#0c1224] p-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-400"></div>
          <span className="text-[10px] text-slate-400 uppercase font-black block mb-1">TAX LIABILITY ACCRUED (ZAR)</span>
          <span className="text-xl font-bold text-cyan-400 block">{renderCurrency(4204910)}</span>
          <span className="text-[9px] text-slate-500 mt-1 block">● Dedicated SARS corporate withhold</span>
        </div>
      </div>

      {activeSub === "Revenue Overview" ? (
        /* REVENUE OVERVIEW & HIGH-TECH CHARTS */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 font-mono">
          <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-[#0d1430] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-pulse" /> CONTINENTAL CAPITAL FLOW CHANNELS
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed pb-3 border-b border-slate-850">
              Evaluates cash flow streams across registered real estate segments in simulated real-time nodes. Adjust rates to balance liquidity.
            </p>

            <div className="space-y-4 pt-2">
              {[
                { label: "Fractional Housing Deposits", percentage: 58, value: 14205000, color: "bg-cyan-400" },
                { label: "Agent Brokerage Pro Subscriptions", percentage: 22, value: 5612000, color: "bg-emerald-400" },
                { label: "Escrow Smart Notary Fees", percentage: 14, value: 3209000, color: "bg-amber-400" },
                { label: "Co-Investment Lead Acquisitions", percentage: 6, value: 789000, color: "bg-purple-400" }
              ].map((item, id) => (
                <div key={id} className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>{item.label}</span>
                    <span className="font-bold text-right text-white">
                      {renderCurrency(item.value)} ZAR ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 mt-6 flex justify-between items-center text-[11px] text-slate-500">
              <span>Forecast index: REIT gains are estimated +2.2% during peak winter migrations.</span>
              <span className="text-cyan-400 uppercase font-black">SOLVENT</span>
            </div>
          </div>

          <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-[#0c1224] p-5 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-white tracking-widest uppercase flex items-center gap-2 pb-2 border-b border-slate-800 mb-3">
                <Layers className="h-4 w-4 text-cyan-400" /> TREASURY DIVIDEND RELEASER
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed pb-2">
                Clicking the dispatcher below will distribute accumulative fractions of pending REIT co-investment dividends directly back to linked investor wallet balances.
              </p>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 space-y-2 text-[10.5px] font-mono text-slate-350">
                <div className="flex justify-between font-bold"><span>Total Accumulation Pool:</span> <span className="text-white">R 32,400,000</span></div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5"><span>Unique Investors Target:</span> <span className="text-white">1,204</span></div>
                <div className="flex justify-between pt-1 font-bold text-[11px]"><span>Average Yield Return:</span> <span className="text-emerald-400">14.82%</span></div>
              </div>
            </div>

            <button
              onClick={() => onAction("schedule_dividend", {} as any)}
              className="w-full rounded bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold py-2 text-xs transition-all tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)] uppercase flex items-center justify-center gap-1"
            >
              <ArrowUpRight className="h-4 w-4" /> Trigger Dividend Allocation
            </button>
          </div>
        </div>
      ) : activeSub === "Subscription Plans" ? (
        /* SUBSCRIPTION PLAN MODIFICATIONS */
        <div className="rounded-xl border border-slate-800 bg-[#0d1430] p-6 space-y-4 font-mono text-xs text-slate-300">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-cyan-400" /> SYSTEM-WIDE COMMISSIONS & LICENSING PLANS
          </h3>
          <p className="text-xs text-slate-350 pb-2 border-b border-slate-800 leading-relaxed">
            Modify licensing rates and commission percentages across the continental regions dynamically. Changing these coefficients triggers an audit log and realigns all active checkout balances.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-white block border-b border-slate-800 pb-1 uppercase">Platform Commission Rate</span>
              <p className="text-[10.5px] text-slate-400 leading-normal">Default percentage taken directly from secondary brokerage listing transactions on the blockchain.</p>
              <div className="flex items-center gap-3 pt-1">
                <input type="number" defaultValue="2.0" step="0.1" className="w-24 bg-[#0c1224] border border-slate-800 text-xs px-2.5 py-1.5 rounded font-bold text-white text-center focus:ring-0 focus:border-cyan-500" />
                <span className="text-xs font-bold text-white">% COM (ZAR)</span>
                <button onClick={() => onAction("adjust_pricing_config", {} as any)} className="bg-cyan-500 text-black font-bold px-3 py-1.5 rounded hover:bg-cyan-400 text-[10.5px] uppercase">Enforce</button>
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-white block border-b border-slate-800 pb-1 uppercase">Agent Professional Sub (Monthly)</span>
              <p className="text-[10.5px] text-slate-400 leading-normal">Price charged to real estate agencies and brokers to publish unlimited listings concurrently.</p>
              <div className="flex items-center gap-3 pt-1">
                <input type="number" defaultValue="450" className="w-24 bg-[#0c1224] border border-slate-800 text-xs px-2.5 py-1.5 rounded font-bold text-white text-center focus:ring-0 focus:border-cyan-500" />
                <span className="text-xs font-bold text-white">ZAR / Mo</span>
                <button onClick={() => onAction("adjust_pricing_config", {} as any)} className="bg-cyan-500 text-black font-bold px-3 py-1.5 rounded hover:bg-cyan-400 text-[10.5px] uppercase">Enforce</button>
              </div>
            </div>
          </div>
        </div>
      ) : activeSub === "Taxes & Financial Reports" ? (
        /* TAXES AND REPORT GENERATION */
        <div className="rounded-xl border border-slate-800 bg-[#0d1430] p-6 space-y-5 font-mono text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" /> SOVEREIGN EXECUTIVE TREASURY DIAGNOSTICS & TAX REPORTS
            </h3>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">REPORTS HUB READY</span>
          </div>
          <p className="text-xs text-slate-350 leading-relaxed pb-1">
            Produce cryptographic, tax-vetted reports detailing escrow liquidity volumes, cross-border commissions, and income payouts aligned with SARS, KRA, and Nigeria CBN guidelines.
          </p>

          <div className="bg-slate-950 p-4 rounded-lg border border-slate-850 space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <span className="text-slate-400">SELECT AUDITING PERIOD:</span>
              <select 
                value={generatePeriod} 
                onChange={(e) => setGeneratePeriod(e.target.value)}
                className="bg-[#0c1224] border border-slate-800 text-xs px-3 py-1.5 rounded text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Q1 2026">Q1 2026 Sovereign Audit Draft</option>
                <option value="Q2 2026">Q2 2026 Sovereign Audit Realtime</option>
                <option value="FY 2025">FY 2025 Vetted Financials (Final)</option>
              </select>
              <button 
                onClick={() => onAction("trigger_general_report", { data: generatePeriod } as any)}
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-1.5 rounded transition-all uppercase flex items-center gap-1 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: "6s" }} /> Process Vetted PDF Report
              </button>
            </div>

            <div className="border-t border-slate-900 pt-3 space-y-2 text-[11px] text-slate-400 leading-relaxed">
              <div className="font-bold text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> AI-Generated Treasury Forecasting Summary
              </div>
              <p className="border-l-2 border-cyan-400 pl-3">
                "Based on currency conversion coefficients NGN, KES, and ZAR, the projected platform commission index during {generatePeriod} reflects high performance solvency. Tax liability withholdings of R 4,204,910 are fully isolated in local banks, limiting FX volatility exposure."
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* TRANSACTIONS DIRECTORY LIST */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 font-mono text-xs">
          {/* LEDGER AREA */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            
            {/* Search row */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by sender, receiver, id..."
                  className="w-full bg-[#070b19] rounded-lg pl-9 pr-4 py-2 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
              <span className="text-slate-500">TRANSACTION FEED SYNCHRONIZED</span>
            </div>

            {/* Transactions table */}
            <div className="rounded-xl border border-slate-800 bg-[#0c1224] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase bg-slate-950 p-4">
                      <th className="p-4">TRANSACTION HASH</th>
                      <th className="p-4">SENDER / RECEIVER</th>
                      <th className="p-4 text-right">VOLUME OUTFLOW</th>
                      <th className="p-4 text-center">AML HEALTH</th>
                      <th className="p-4">STATUS</th>
                      <th className="p-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTxs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-500">
                          No accounting ledger records match current view categories.
                        </td>
                      </tr>
                    ) : (
                      filteredTxs.map(tx => (
                        <tr 
                          key={tx.id} 
                          onClick={() => setSelectedTransactionId(tx.id)}
                          className={`border-b border-slate-800/40 hover:bg-slate-900/30 cursor-pointer text-[11px] transition-all ${
                            selectedTransactionId === tx.id ? "bg-cyan-950/10" : ""
                          }`}
                        >
                          <td className="p-4 font-bold text-white uppercase select-all">
                            {tx.id}
                            <span className="block text-[9px] text-slate-500 font-normal">{tx.date}</span>
                          </td>
                          <td className="p-4">
                            <div className="text-slate-200 font-semibold">{tx.senderName}</div>
                            <div className="text-slate-500 text-[10px]">→ {tx.receiverName}</div>
                          </td>
                          <td className="p-4 text-right font-black text-amber-400">
                            {renderCurrency(tx.amount)}
                            <span className="block text-[9px] text-slate-500 font-normal font-sans">fee: {renderCurrency(tx.fee)}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex h-2 w-2 rounded-full ${
                              tx.amlFlagged ? "bg-rose-500 animate-pulse" : "bg-emerald-400"
                            }`}></span>
                            <span className="text-[10px] text-slate-400 ml-1.5">{tx.amlFlagged ? "AML WARN" : "CLEARED"}</span>
                          </td>
                          <td className="p-4">
                            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-black ${
                              tx.status === 'Completed' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              tx.status === 'Frozen Locked' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse" :
                              "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>{tx.status}</span>
                          </td>
                          <td className="p-4 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTransactionId(tx.id);
                              }}
                              className="text-cyan-400 text-[10px] font-bold hover:underline"
                            >
                              CONTROL
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* LEDGER WORKSPACE DETAILS */}
          <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-[#0d142b] p-5 flex flex-col justify-between overflow-hidden">
            {selectedTx ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-cyan-950/40 border border-cyan-800/30 p-2 text-cyan-400 text-[10px] font-mono text-center justify-center font-bold">
                  <DollarSign className="h-3.5 w-3.5" /> SECURED ESCROW WORKSPACE
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-350 uppercase">AUDITING TRANSACTION</h4>
                  <span className="text-base font-black text-white block select-all tracking-wider mb-2">{selectedTx.id}</span>
                  
                  <div className="inline-flex gap-1.5 items-center bg-slate-950 px-2.5 py-1 border border-slate-800 rounded text-[10px]">
                    <span className="text-slate-500">ESCROW AMOUNT:</span>
                    <strong className="text-amber-400 font-bold">{renderCurrency(selectedTx.amount)}</strong>
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-b border-slate-800 py-3 text-[11px] leading-relaxed text-slate-300">
                  <div className="flex justify-between">
                    <span>Sender Party:</span>
                    <span className="text-white font-bold text-right">{selectedTx.senderName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Receiver Acc:</span>
                    <span className="text-white font-bold text-right">{selectedTx.receiverName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vetted Date:</span>
                    <span className="text-slate-400">{selectedTx.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assigned Fee:</span>
                    <span className="text-slate-350">{renderCurrency(selectedTx.fee)} ZAR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Region Hub:</span>
                    <span className="text-white font-semibold">{selectedTx.region}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Risk Index:</span>
                    <span className={`font-semibold ${selectedTx.amlFlagged ? "text-rose-400" : "text-emerald-400"}`}>
                      {selectedTx.amlFlagged ? "High Suspicion Route Rate" : "Nominal Zero Threat"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Escrow State:</span>
                    <span className="text-white font-bold uppercase">{selectedTx.status}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-[10px] text-slate-500 font-bold tracking-widest font-mono uppercase pb-1 border-b border-slate-800">MUTABLE ESCROW PROTOCOLS</div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => onAction("freeze_escrow_pool", selectedTx)}
                      className="rounded bg-rose-500/10 px-2 py-2 text-[10.5px] text-rose-450 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                    >
                      <Ban className="h-3.5 w-3.5" /> Freeze Escrow
                    </button>
                    <button 
                      onClick={() => onAction("reverse_escrow_tx", selectedTx)}
                      className="rounded bg-slate-900 px-2 py-2 text-[10.5px] text-slate-300 border border-slate-800 hover:border-slate-600 transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                    >
                      <Layers className="h-3.5 w-3.5 text-cyan-400" /> Reverse Tx
                    </button>
                    <button 
                      onClick={() => onAction("trigger_aml_invest", selectedTx)}
                      className="rounded bg-amber-500/10 px-2 py-2 text-[10.5px] text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" /> Run AML Aud
                    </button>
                    <button 
                      onClick={() => onAction("initiate_refund_tx", selectedTx)}
                      className="rounded bg-slate-900 px-2 py-2 text-[10.5px] text-slate-350 border border-slate-800 hover:border-slate-600 transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                    >
                      <FileText className="h-3.5 w-3.5" /> Refund Tx
                    </button>
                  </div>

                  {selectedTx.status === "Pending Escrow" && (
                    <button 
                      onClick={() => onAction("approve_payout_escrow", selectedTx)}
                      className="w-full rounded bg-emerald-500 py-2.5 text-center text-xs font-bold text-black hover:bg-emerald-400 transition-all font-mono uppercase flex items-center justify-center gap-1.5 mt-2"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> AUTHORIZE FUNDS PAYOUT STENCIL
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500">
                Select an escrow transfer entry from the accounting ledger to trigger financial overrides.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
