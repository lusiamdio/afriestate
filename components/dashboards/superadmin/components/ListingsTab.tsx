import React, { useState } from "react";
import { PropertyListing } from "../SuperAdminData";
import { 
  Globe, Search, CheckCircle2, AlertTriangle, ShieldAlert, MapPin, 
  Settings, RefreshCw, Send, Check, X, Shield, Activity, Star, Layers, DollarSign
} from "lucide-react";

interface ListingsTabProps {
  listings: PropertyListing[];
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  onAction: (actionType: string, listing: PropertyListing) => void;
  activeSub: string;
  selectedMapRegion: string;
  setSelectedMapRegion: (reg: string) => void;
  mapLayer: string;
  setMapLayer: (layer: any) => void;
  currencyCodeUsed: string;
  renderCurrency: (val: number) => string;
}

export default function ListingsTab({
  listings,
  selectedPropertyId,
  setSelectedPropertyId,
  onAction,
  activeSub,
  selectedMapRegion,
  setSelectedMapRegion,
  mapLayer,
  setMapLayer,
  currencyCodeUsed,
  renderCurrency
}: ListingsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Local state for Smart Verification checklist to make the UI look exceptionally interactive!
  const [checklist, setChecklist] = useState({
    deedValid: true,
    geoNoOverlap: true,
    ownerConsent: false,
    photosNudeClean: true,
    priceMatchesTrend: true
  });

  // Sovereign Geospatial Intelligence Local States for Risk Vetting Double-Click Interaction
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [riskModalLayer, setRiskModalLayer] = useState("Appreciation");
  const [riskModalRegion, setRiskModalRegion] = useState("Southern Africa");
  const [isReauditing, setIsReauditing] = useState(false);
  const [auditLogsLocal, setAuditLogsLocal] = useState<string[]>([]);

  const handleOpenRiskModal = (layer: string, region: string) => {
    setRiskModalLayer(layer);
    setRiskModalRegion(region);
    setIsRiskModalOpen(true);
    setAuditLogsLocal([
      `[LAUNCH] Initiating Deep Cadastral Integrity Audit for ${region}...`,
      `[LAYER] Targeting operational variables for [${layer.toUpperCase()}] overlay...`,
      `[SECURE] Multi-signature consensus route active.`,
    ]);
  };

  const handleRunReaudit = () => {
    setIsReauditing(true);
    setAuditLogsLocal(prev => [...prev, `[AUDIT] Launching satellite telemetry boundary scan...`]);
    setTimeout(() => {
      setAuditLogsLocal(prev => [
        ...prev,
        `[SCAN] Multi-spectral imaging overlapping verified: 0.00% error.`,
        `[SUCCESS] Title Deed digital signature validated with state hashes!`,
        `[INTEGRITY] Integrity verification confirmed. SECURE STATUS ACTIVE.`
      ]);
      setIsReauditing(false);
    }, 1200);
  };

  const selectedListing = listings.find(l => l.id === selectedPropertyId) || listings[0];

  // Map region constant data definition
  const regionsConstantData = {
    "Southern Africa": { city: "Cape Town / JHB", activeCapital: "R 2.45B", occupancyUnit: "94.8%" },
    "West Africa": { city: "Lagos / Lekki Corridor", activeCapital: "R 3.10B", occupancyUnit: "91.2%" },
    "East Africa": { city: "Nairobi / Westlands", activeCapital: "R 1.22B", occupancyUnit: "88.6%" },
    "North Africa": { city: "Cairo / Administrative Plaza", activeCapital: "R 1.48B", occupancyUnit: "92.4%" }
  };

  // Filter listings based on subtab selection
  const filteredListings = listings.filter(l => {
    // 1. Search filter
    const matchesSearch = 
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Status match based on Tab
    switch (activeSub) {
      case "Pending Approvals":
        return l.status === "Pending Approval";
      case "Smart Verification":
        return l.status === "Pending Approval" || l.authenticityScore < 80;
      case "Flagged Listings":
        return l.status === "Flagged Listings";
      case "Expired Listings":
        return l.status === "Expired";
      case "REIT Assets":
        return l.reitEligible === true;
      case "Luxury Portfolio":
        return l.type === "Luxury Portfolio";
      case "All Listings":
      default:
        return true;
    }
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT CONTENT PANEL */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        
        {/* Search Header */}
        {activeSub !== "Geo Mapping" && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, property ID, location..."
                className="w-full bg-[#070b19] rounded-lg pl-9 pr-4 py-2 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div className="flex gap-4 text-slate-400">
              <span>LISTINGS CAPTOR: <strong className="text-cyan-400">{filteredListings.length}</strong> TRACKED</span>
            </div>
          </div>
        )}

        {/* VIEW TYPE: DEFAULT TABLE or MAP */}
        {/* VIEW TYPE: DEFAULT TABLE or MAP */}
        {activeSub === "Geo Mapping" ? (
          /* High-Fidelity Interactive Map view */
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-[#0d1430] p-6 flex flex-col relative overflow-hidden min-h-[460px]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,30,56,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(18,30,56,0.1)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none"></div>

              <div className="flex flex-wrap items-center justify-between gap-4 z-10 mb-5 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                    <Globe className="h-4 w-4 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} /> 
                    AFRIESTATE GEOSPATIAL INTELLIGENCE GRID
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Click targets to switch operational hubs. Double-click layers or targets to evaluate risks.
                  </p>
                </div>

                {/* Geographic toggling filter values */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-[10px] font-mono">
                  {["Appreciation", "Investor Density", "Fraud Hotspots"].map((layer: any) => (
                    <button
                      key={layer}
                      onClick={() => setMapLayer(layer)}
                      onDoubleClick={() => handleOpenRiskModal(layer, selectedMapRegion)}
                      title="Double-click to evaluate layer risks"
                      className={`rounded px-2.5 py-0.5 font-bold transition-all ${
                        mapLayer === layer 
                          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-extrabold" 
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {layer}
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulated Vector Grid Overlay */}
              <div className="flex-1 flex items-center justify-center relative mt-4">
                <span className="absolute top-0 left-0 font-mono text-[9px] text-slate-500">DEVIATION_LEVEL: SECURE // SIG: GPS_CONTINENTAL</span>

                {/* Graphical Africa map and pulsing nodes */}
                <svg viewBox="0 0 400 400" className="w-[320px] h-[320px] text-slate-600/60 drop-shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                  <path 
                    d="M 120,40 L 260,40 L 320,80 L 350,140 L 310,220 L 260,250 L 220,310 L 200,380 L 195,420 L 180,440 L 175,410 L 165,340 C 120,310 110,240 100,200 C 65,190 40,160 45,130 C 50,110 70,80 120,40 Z" 
                    fill="#030712" 
                    stroke="#1e293b" 
                    strokeWidth="2" 
                    strokeDasharray="4,4" 
                  />

                  {/* Hotspots */}
                  <g 
                    className="cursor-pointer group" 
                    onClick={() => setSelectedMapRegion("Southern Africa")}
                    onDoubleClick={() => handleOpenRiskModal(mapLayer, "Southern Africa")}
                  >
                    <circle cx="185" cy="380" r="15" fill="rgba(6,182,212,0.1)" className="animate-ping" />
                    <circle cx="185" cy="380" r="5" fill={selectedMapRegion === "Southern Africa" ? "#06b6d4" : "#475569"} className="stroke-slate-950 group-hover:fill-cyan-400 transition-colors" />
                    <text x="195" y="383" fill="#06b6d4" fontSize="9" fontWeight="bold" className="font-mono">SOUTHERN (CPT/JHB)</text>
                  </g>

                  <g 
                    className="cursor-pointer group" 
                    onClick={() => setSelectedMapRegion("West Africa")}
                    onDoubleClick={() => handleOpenRiskModal(mapLayer, "West Africa")}
                  >
                    <circle cx="110" cy="180" r="15" fill="rgba(16,185,129,0.1)" className="animate-ping" />
                    <circle cx="110" cy="180" r="5" fill={selectedMapRegion === "West Africa" ? "#10b981" : "#475569"} className="stroke-slate-950 group-hover:fill-emerald-400 transition-colors" />
                    <text x="50" y="183" fill="#10b981" fontSize="9" fontWeight="bold" className="font-mono">WEST (LAGOS/LEKKI)</text>
                  </g>

                  <g 
                    className="cursor-pointer group" 
                    onClick={() => setSelectedMapRegion("East Africa")}
                    onDoubleClick={() => handleOpenRiskModal(mapLayer, "East Africa")}
                  >
                    <circle cx="260" cy="220" r="15" fill="rgba(245,158,11,0.1)" className="animate-ping" />
                    <circle cx="260" cy="220" r="5" fill={selectedMapRegion === "East Africa" ? "#f59e0b" : "#475569"} className="stroke-slate-950 group-hover:fill-amber-400 transition-colors" />
                    <text x="272" y="223" fill="#f59e0b" fontSize="9" fontWeight="bold" className="font-mono">EAST (NAIROBI)</text>
                  </g>

                  <g 
                    className="cursor-pointer group" 
                    onClick={() => setSelectedMapRegion("North Africa")}
                    onDoubleClick={() => handleOpenRiskModal(mapLayer, "North Africa")}
                  >
                    <circle cx="250" cy="90" r="15" fill="rgba(192,132,252,0.1)" />
                    <circle cx="250" cy="90" r="5" fill={selectedMapRegion === "North Africa" ? "#c084fc" : "#475569"} className="stroke-slate-950 group-hover:fill-purple-400 transition-colors" />
                    <text x="260" y="93" fill="#c084fc" fontSize="9" fontWeight="bold" className="font-mono">NORTH (CAIRO)</text>
                  </g>
                </svg>

                {/* Real-time map telemetry overlay */}
                <div className="absolute bottom-2 left-2 bg-slate-950/80 border border-slate-800 p-3 rounded-lg text-[10px] space-y-1.5 font-mono">
                  <span className="text-cyan-400 block border-b border-slate-800 pb-1 mb-1 font-bold">MAP INDICATOR FOCUS</span>
                  <div>ACTIVE PROVINCE: <span className="text-white font-bold">{selectedMapRegion}</span></div>
                  <div>LOCAL DEPUTIES: <span className="text-white">{regionsConstantData[selectedMapRegion as keyof typeof regionsConstantData]?.city}</span></div>
                  <div>ESCROW BUFFER: <span className="text-amber-400 font-bold">{regionsConstantData[selectedMapRegion as keyof typeof regionsConstantData]?.activeCapital}</span></div>
                  <div>AVG OCCUPANCY: <span className="text-emerald-400">{regionsConstantData[selectedMapRegion as keyof typeof regionsConstantData]?.occupancyUnit}</span></div>
                </div>
              </div>
            </div>

            {/* INTELLIGENCE LAYER DIAGNOSTICS DECK */}
            <div className="rounded-xl border border-slate-800 bg-[#060b1e] p-5 space-y-4 font-mono">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5 uppercase">
                    <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
                    Operational Layer Intelligence Controls
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Showing real-time indicators for <span className="text-white font-bold">{selectedMapRegion}</span> hub. Click cards to swap overlays.
                  </p>
                </div>
                <div className="text-[9px] text-slate-400 border border-slate-800 px-2 py-0.5 rounded bg-slate-950/50">
                  DB MODE: <span className="text-emerald-400 font-bold">SOVEREIGN SYNCED</span>
                </div>
              </div>

              {/* Grid of the three details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* APPRECIATION DETAILS BUTTON / CARD */}
                <div 
                  onClick={() => setMapLayer("Appreciation")}
                  className={`relative rounded-xl border p-4 bg-slate-950/60 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                    mapLayer === "Appreciation"
                      ? "border-cyan-500 bg-cyan-950/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-slate-950"
                      : "border-slate-850 hover:border-slate-700/80 hover:bg-slate-900"
                  }`}
                >
                  {mapLayer === "Appreciation" && (
                    <span className="absolute -top-2 right-3 text-[8px] bg-cyan-500 text-black font-extrabold px-1.5 py-0.2 rounded uppercase">
                      ACTIVE OVERLAY
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                        📈 Appreciation Index
                      </span>
                      <span className="text-[9.5px] text-cyan-400 font-bold bg-cyan-950/50 px-1.5 py-0.5 rounded">
                        {selectedMapRegion === "Southern Africa" ? "+12.8%" :
                         selectedMapRegion === "West Africa" ? "+18.4%" :
                         selectedMapRegion === "East Africa" ? "+14.1%" : "+9.6%"} YoY
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                      Sovereign capital appreciation velocity matching fractional tokenization index bounds.
                    </p>

                    <div className="space-y-1.5 border-t border-slate-900 pt-2.5 text-[9.5px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Projected Multiplier:</span>
                        <span className="text-white font-bold">
                          {selectedMapRegion === "Southern Africa" ? "1.45x Over 3y" :
                           selectedMapRegion === "West Africa" ? "2.10x Over 3y" :
                           selectedMapRegion === "East Africa" ? "1.65x Over 3y" : "1.20x Over 3y"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Registry Integration:</span>
                        <span className="text-emerald-400">100% SECURED</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Market Horizon:</span>
                        <span className="text-slate-300 font-semibold">Decentralized High-Yield</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-900/50 pt-2.5 mt-3 text-[9px] text-slate-500 font-bold flex justify-between items-center">
                    <span>DBL-CLICK FOR RISK HUD</span>
                    <span className="text-cyan-500">➔</span>
                  </div>
                </div>

                {/* INVESTOR DENSITY DETAILS BUTTON / CARD */}
                <div 
                  onClick={() => setMapLayer("Investor Density")}
                  className={`relative rounded-xl border p-4 bg-slate-950/60 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                    mapLayer === "Investor Density"
                      ? "border-amber-500 bg-amber-950/10 shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-slate-950"
                      : "border-slate-850 hover:border-slate-700/80 hover:bg-slate-900"
                  }`}
                >
                  {mapLayer === "Investor Density" && (
                    <span className="absolute -top-2 right-3 text-[8px] bg-amber-500 text-black font-extrabold px-1.5 py-0.2 rounded uppercase">
                      ACTIVE OVERLAY
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        👥 Investor Density
                      </span>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-950/50 px-1.5 py-0.5 rounded">
                        {selectedMapRegion === "Southern Africa" ? "2,840 Wallets" :
                         selectedMapRegion === "West Africa" ? "1,620 Wallets" :
                         selectedMapRegion === "East Africa" ? "910 Wallets" : "1,122 Wallets"}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                      Sovereign cash deposit density and active wallets backing local property pools.
                    </p>

                    <div className="space-y-1.5 border-t border-slate-900 pt-2.5 text-[9.5px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Committed Capital:</span>
                        <span className="text-white font-bold">
                          {selectedMapRegion === "Southern Africa" ? "R 2.45B Pool" :
                           selectedMapRegion === "West Africa" ? "R 3.10B Pool" :
                           selectedMapRegion === "East Africa" ? "R 1.22B Pool" : "R 1.48B Pool"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Institution Ratio:</span>
                        <span className="text-amber-400">32% REIT Reserves</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Liquidity Safety:</span>
                        <span className="text-slate-355 font-bold">CLASS AA</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-900/50 pt-2.5 mt-3 text-[9px] text-slate-500 font-bold flex justify-between items-center">
                    <span>DBL-CLICK FOR RISK HUD</span>
                    <span className="text-amber-500">➔</span>
                  </div>
                </div>

                {/* FRAUD HOTSPOTS DETAILS BUTTON / CARD */}
                <div 
                  onClick={() => setMapLayer("Fraud Hotspots")}
                  className={`relative rounded-xl border p-4 bg-slate-950/60 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                    mapLayer === "Fraud Hotspots"
                      ? "border-rose-500 bg-rose-950/10 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-slate-950"
                      : "border-slate-850 hover:border-slate-700/80 hover:bg-slate-900"
                  }`}
                >
                  {mapLayer === "Fraud Hotspots" && (
                    <span className="absolute -top-2 right-3 text-[8px] bg-rose-500 text-black font-extrabold px-1.5 py-0.2 rounded uppercase">
                      ACTIVE OVERLAY
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                        🛡️ Fraud Hotspots
                      </span>
                      <span className="text-[10px] text-rose-400 font-bold bg-rose-950/50 px-1.5 py-0.5 rounded">
                        {selectedMapRegion === "Southern Africa" ? "0.8% Class A" :
                         selectedMapRegion === "West Africa" ? "2.6% Class B" :
                         selectedMapRegion === "East Africa" ? "1.4% Class A" : "0.5% Class A"} Risk
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                      Deed registration boundary conflicts and multi-level escrow dispute alerts.
                    </p>

                    <div className="space-y-1.5 border-t border-slate-900 pt-2.5 text-[9.5px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Active Cadaster Scan:</span>
                        <span className="text-emerald-400 font-bold">100% ONLINE</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Incidents Intercepted:</span>
                        <span className="text-rose-400">0 CRITICAL</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dispute Guard Level:</span>
                        <span className="text-slate-350 font-bold">SECURE NOTARY</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-900/50 pt-2.5 mt-3 text-[9px] text-slate-500 font-bold flex justify-between items-center">
                    <span>DBL-CLICK FOR RISK HUD</span>
                    <span className="text-rose-500">➔</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* Normal Property Grid Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredListings.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-slate-800 bg-[#0c1224] p-16 text-center text-slate-500 text-xs font-mono">
                No real estate assets fit the currently defined "{activeSub}" query constraints.
              </div>
            ) : (
              filteredListings.map(l => (
                <div 
                  key={l.id} 
                  onClick={() => setSelectedPropertyId(l.id)}
                  className={`rounded-xl border p-4 bg-[#0c1224] cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    selectedPropertyId === l.id 
                      ? "border-cyan-500 bg-cyan-950/10 shadow-[0_0_20px_rgba(6,182,212,0.08)]" 
                      : "border-slate-800 hover:border-slate-700/80 hover:shadow-[0_0_15px_rgba(6,182,212,0.04)]"
                  }`}
                >
                  {/* Subtle top left bar indicator */}
                  <div className={`absolute top-0 left-0 right-0 h-[2.5px] ${
                    l.status === 'Verified Active' ? "bg-emerald-400" :
                    l.status === 'Pending Approval' ? "bg-amber-400" : "bg-rose-500"
                  }`}></div>

                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[9.5px] font-mono whitespace-nowrap bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded uppercase">
                        {l.id} • {l.type.toUpperCase()}
                      </span>
                      <span className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded font-black ${
                        l.status === 'Verified Active' ? "bg-emerald-500/10 text-emerald-400" :
                        l.status === 'Pending Approval' ? "bg-amber-500/10 text-amber-400 animate-pulse" : "bg-rose-500/10 text-rose-400"
                      }`}>{l.status}</span>
                    </div>

                    <h4 className="text-xs font-black text-slate-100 font-mono tracking-wide leading-snug hover:text-cyan-400 mb-1.5">
                      {l.title}
                    </h4>

                    <div className="flex gap-2 items-center text-[10px] text-slate-400 font-mono mb-3">
                      <MapPin className="h-3 w-3 text-cyan-400" />
                      <span>{l.location} ({l.region})</span>
                    </div>
                  </div>

                  <div>
                    {/* Metrics bar */}
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-800/80 pt-3 text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500 block">PRICE TAG</span>
                        <span className="text-amber-400 font-bold">{renderCurrency(l.price)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">AI AUTHENTIC</span>
                        <span className="text-cyan-400 font-bold">{l.authenticityScore}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">OCCUPANCY</span>
                        <span className="text-white font-bold">{l.occupancyPrediction}</span>
                      </div>
                    </div>

                    <div className="mt-3.5 flex justify-between items-center border-t border-slate-800/40 pt-2.5 text-[9px] font-mono">
                      <span className="text-slate-500">VALUATION INDICE: <strong className="text-emerald-400 font-normal">{l.valuationTrend}</strong></span>
                      {l.reitEligible && (
                        <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 px-1 rounded font-bold">REIT ELIGIBLE</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* RIGHT PROPERTY DETAILS / ACTION WORKSPACE VIEW */}
      <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-[#0d142b] p-5 flex flex-col justify-between overflow-hidden">
        {selectedListing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg bg-cyan-950/40 border border-cyan-800/30 p-2 text-cyan-400 text-[10px] font-mono text-center justify-center font-bold">
              <Layers className="h-3.5 w-3.5 text-cyan-400" /> REAL ESTATE INTEL GATEWAY
            </div>

            <div>
              <h3 className="text-sm font-black text-white font-mono tracking-wide mb-1 leading-snug">{selectedListing.title}</h3>
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-2">{selectedListing.type} • PRP ID: {selectedListing.id}</div>
              
              <div className="inline-flex gap-1.5 items-center bg-slate-950 px-2.5 py-1 border border-slate-800 rounded font-mono text-[10px] text-slate-350">
                <span>VALUATION:</span>
                <strong className="text-amber-400 font-bold">{renderCurrency(selectedListing.price)}</strong>
              </div>
            </div>

            <div className="space-y-2.5 font-mono text-[11px] border-t border-b border-slate-800 py-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Hub Region:</span>
                <span className="text-white font-bold">{selectedListing.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Structural Size:</span>
                <span className="text-white">{selectedListing.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Occupancy Prediction:</span>
                <span className="text-emerald-400 font-bold">{selectedListing.occupancyPrediction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AI Trust Authenticity:</span>
                <span className="text-cyan-400 font-bold">{selectedListing.authenticityScore}% Score</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Investment Index:</span>
                <span className="text-white font-bold">{selectedListing.investmentPotential}/100 Rating</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform Asset REIT:</span>
                <span className="text-purple-400 font-bold">{selectedListing.reitEligible ? "ELIGIBLE" : "NOT ELIGIBLE"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Authorized Owner key:</span>
                <span className="text-slate-400 select-all uppercase text-[10px]">{selectedListing.ownerId}</span>
              </div>
            </div>

            {/* Smart verification interactive checklist widgets */}
            {activeSub === "Smart Verification" && (
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 font-mono text-[10px]">
                <div className="text-cyan-400 font-bold uppercase tracking-widest pb-1 border-b border-slate-800 flex items-center justify-between">
                  <span>Smart Audit Checklist</span>
                  <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                </div>
                <div className="space-y-1.5 pt-1">
                  {[
                    { key: "deedValid", label: "Deed Registration Token Match" },
                    { key: "geoNoOverlap", label: "Geospatial Boundary Overlap Check" },
                    { key: "ownerConsent", label: "Notarized Deed Holding Consent" },
                    { key: "photosNudeClean", label: "Image Moderation Clean Index" },
                    { key: "priceMatchesTrend", label: "Fair Price Appraisals Index" }
                  ].map(ch => (
                    <label key={ch.key} className="flex items-center justify-between text-slate-350 cursor-pointer hover:text-white pb-1 border-b border-slate-900 last:border-none">
                      <span>{ch.label}</span>
                      <input 
                        type="checkbox" 
                        checked={checklist[ch.key as keyof typeof checklist]} 
                        onChange={() => toggleCheck(ch.key as any)}
                        className="accent-cyan-500 h-3.5 w-3.5 bg-slate-900 border-slate-800"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Administrative property workflow actions */}
            <div className="space-y-2 pt-1">
              <div className="text-[10px] text-slate-500 font-bold tracking-widest font-mono uppercase pb-1 border-b border-slate-800">REAL ESTATE WORKFLOW DISPATCHERS</div>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => onAction("ai_reanalyze_property", selectedListing)}
                  className="rounded bg-[#14234c] px-2 py-2 text-[10.5px] text-cyan-400 border border-cyan-500/20 hover:bg-[#1e3472] transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-cyan-400" /> AI Re-Analyze
                </button>
                <button 
                  onClick={() => onAction("verify_geo_property", selectedListing)}
                  className="rounded bg-slate-900 px-2 py-2 text-[10.5px] text-slate-300 border border-slate-800 hover:border-slate-600 transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                >
                  <MapPin className="h-3.5 w-3.5 text-cyan-400" /> Geo Verify
                </button>
                <button 
                  onClick={() => onAction("send_listing_warning", selectedListing)}
                  className="rounded bg-rose-500/10 px-2 py-2 text-[10.5px] text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                >
                  <ShieldAlert className="h-3.5 w-3.5" /> Legal Warning
                </button>
                <button 
                  onClick={() => onAction("push_to_investors", selectedListing)}
                  className="rounded bg-amber-500/10 px-2 py-2 text-[10.5px] text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                >
                  <DollarSign className="h-3.5 w-3.5 text-amber-400" /> Push to UHNW
                </button>
              </div>

              {selectedListing.status === "Pending Approval" && (
                <button 
                  onClick={() => onAction("approve_listing_asset", selectedListing)}
                  className="w-full rounded bg-emerald-500 py-2.5 text-center text-xs font-bold text-black hover:bg-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all font-mono uppercase flex items-center justify-center gap-1.5 mt-2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> AUTHORIZE & PUBLISH LISTING ACTIVE
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 font-mono text-xs">
            Select a commercial property listing card to display and control geospatial vetting workflows.
          </div>
        )}
      </div>
    </div>

    {/* SOVEREIGN RISK EVALUATION OVERLAY / CONTROL PANEL MODAL */}
    {isRiskModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="w-full max-w-xl border border-slate-800 rounded-2xl bg-[#090e1f] p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col justify-between font-mono relative">
          <button 
            onClick={() => setIsRiskModalOpen(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors animate-pulse"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="h-5 w-5 text-cyan-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-left">
                  Sovereign Risk Diagnostics Control HUD
                </h3>
                <p className="text-[10px] text-slate-500 text-left">
                  Evaluating Regional Integrity for <span className="text-cyan-400 font-bold">{riskModalRegion}</span> Hub
                </p>
              </div>
            </div>

            {/* Technical indicators grid */}
            <div className="grid grid-cols-2 gap-3 text-xs text-left">
              <div className="bg-slate-950 border border-slate-850 p-3 rounded">
                <span className="text-[10px] text-slate-500 block">SELECTED HUB LAYER</span>
                <span className="text-cyan-400 font-bold uppercase">{riskModalLayer}</span>
              </div>
              <div className="bg-slate-950 border border-slate-850 p-3 rounded">
                <span className="text-[10px] text-slate-500 block">AML INTEGRITY CLASS</span>
                <span className="text-emerald-400 font-extrabold">CLASS AAA (STABLE)</span>
              </div>
              <div className="bg-slate-950 border border-slate-850 p-3 rounded">
                <span className="text-[10px] text-slate-500 block">CADASTRAL CO-REFERENCE CONTROLS</span>
                <span className="text-white font-bold">12,840 Hectares Validated</span>
              </div>
              <div className="bg-slate-950 border border-slate-850 p-3 rounded">
                <span className="text-[10px] text-slate-500 block">ESTIMATED RISK FACTOR</span>
                <span className={`${
                  riskModalRegion === "West Africa" ? "text-amber-400" : "text-emerald-400"
                } font-black`}>
                  {riskModalRegion === "Southern Africa" ? "0.8%" :
                   riskModalRegion === "West Africa" ? "2.6% (Moderate)" :
                   riskModalRegion === "East Africa" ? "1.4%" : "0.5%"} Flag Index
                </span>
              </div>
            </div>

            {/* Live Vetting System Logs */}
            <div className="bg-slate-950/90 border border-slate-850 rounded p-4 text-[10px] space-y-1 max-h-[140px] overflow-y-auto text-left">
              <span className="text-[9px] text-slate-500 font-bold block border-b border-slate-900 pb-1 mb-1">CADASTRAL AUDIT STREAM</span>
              {auditLogsLocal.map((log, idx) => (
                <div key={idx} className="text-slate-300 font-mono">
                  {log}
                </div>
              ))}
              {isReauditing && (
                <div className="text-cyan-400 flex items-center gap-2 mt-1">
                  <span className="animate-pulse">● Running satellite scans and decentralized hash validations...</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-3">
              <button
                onClick={handleRunReaudit}
                disabled={isReauditing}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isReauditing ? "Scanning Web3 Deeds..." : "Force Real-time Re-Audit Scan"}
              </button>
              <button
                onClick={() => setIsRiskModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded text-xs font-bold uppercase transition-all"
              >
                Dismiss HUD
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
