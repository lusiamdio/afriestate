import React, { useState } from "react";
import { SovereignUser } from "../SuperAdminData";
import { 
  Users, Search, AlertTriangle, Shield, MapPin, 
  UserX, ShieldAlert, Key, Edit, Heart, ChevronRight, Activity, Ban, Plus
} from "lucide-react";

interface UsersTabProps {
  users: SovereignUser[];
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  onAction: (actionType: string, user: SovereignUser) => void;
  activeSub: string;
}

export default function UsersTab({
  users,
  selectedUserId,
  setSelectedUserId,
  onAction,
  activeSub
}: UsersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const selectedUser = users.find(u => u.id === selectedUserId) || users[0];

  // Helper to filter users according to sub-tab
  const filteredUsers = users.filter(u => {
    // 1. Search term
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Role/Sub-tab
    switch (activeSub) {
      case "Normal Users":
        return u.role === "Normal User";
      case "Agents":
        return u.role === "Agent";
      case "Investors":
        return u.role === "Investor";
      case "Agencies":
        return u.role === "Agency";
      case "Developers":
        return u.role === "Developer";
      case "Suspensions":
        return u.status === "Suspended" || u.status === "Restricted";
      case "Verification Queue":
        return u.status === "Pending Verification";
      default:
        return true;
    }
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* LEFT LIST PANEL */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        {/* Search & Statistics Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or email..."
              className="w-full bg-[#070b19] rounded-lg pl-9 pr-4 py-2 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <div className="flex gap-4 text-slate-400">
            <span>RESULTS: <strong className="text-cyan-400">{filteredUsers.length}</strong> ACTORS</span>
            <span>TOTAL POOL: <strong className="text-white">{users.length}</strong> COHORTS</span>
          </div>
        </div>

        {/* Roles overview if Permissions tab */}
        {activeSub === "Permissions & Roles" ? (
          <div className="rounded-xl border border-slate-800 bg-[#0d142b]/80 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Key className="h-4 w-4 text-cyan-400" /> SYSTEM-LEVEL ACCESS OVERRIDES (RBAC)
            </h3>
            <p className="text-xs text-slate-350 leading-relaxed font-mono">
              The platform governs asset allocation through Role-Based Access Controls merged with real-time biometric keys. Tick options to enforce global sovereign-level security limits dynamically.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { role: "SuperAdmin Core", permissions: ["Unified Escrow Release", "Sovereign Override Bypass", "Complete Asset Seizure", "Service Heartbeat Interruption"], active: true },
                { role: "Verification Compliance Officer", permissions: ["Deed Registry Cross-matching", "AML Document Audit Sign-off", "Direct Legal Warn Issuance"], active: true },
                { role: "Field Agent Coordinator", permissions: ["Property Geo-Verification Upload", "Tenant Onboarding Escorts"], active: false }
              ].map((group, idx) => (
                <div key={idx} className="bg-slate-950/80 p-4 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <span className="text-xs font-bold text-cyan-400 font-mono uppercase">{group.role}</span>
                    <span className="text-[10px] text-slate-500 font-mono">ENFORCED IN REAL-TIME</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.permissions.map((p, pIdx) => (
                      <label key={pIdx} className="flex items-center gap-2 text-[10.5px] font-mono text-slate-350 cursor-pointer hover:text-white">
                        <input type="checkbox" defaultChecked={group.active} className="accent-cyan-500 h-3.5 w-3.5 rounded bg-slate-900 border-slate-800 focus:ring-0" />
                        <span>{p}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* User Directory Table */
          <div className="rounded-xl border border-slate-800 bg-[#0c1224] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase bg-slate-950">
                    <th className="p-4">DENTIFIER / USER NAME</th>
                    <th className="p-4">CORRESPONDENCE EMAIL</th>
                    <th className="p-4">RISK COEFFICIENT</th>
                    <th className="p-4">WALLET STATUS</th>
                    <th className="p-4 text-center">LISTINGS</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-500 text-xs">
                        No active users match the selected query filter indexes.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr 
                        key={u.id} 
                        onClick={() => setSelectedUserId(u.id)}
                        className={`border-b border-slate-800/40 text-[11px] hover:bg-slate-900/30 cursor-pointer transition-all ${
                          selectedUserId === u.id ? "bg-cyan-950/20" : ""
                        }`}
                      >
                        <td className="p-4 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-full bg-[#1e293b] text-cyan-400 font-bold flex items-center justify-center text-[10px] border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-slate-100 font-bold block">{u.name}</span>
                              <span className="block text-[9px] text-slate-500 font-normal">{u.id} | {u.role.toUpperCase()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 text-[11.5px]">{u.email}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${
                              u.riskScore > 75 ? "bg-rose-500 animate-pulse" :
                              u.riskScore > 30 ? "bg-amber-400" : "bg-emerald-400"
                            }`}></span>
                            <span className="font-bold">{u.riskScore}%</span>
                            <span className="text-[9px] text-slate-500">score</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold ${
                            u.isWalletFrozen 
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {u.isWalletFrozen ? "FROZEN LOCKED" : "SECURED"}
                          </span>
                        </td>
                        <td className="p-4 text-center text-slate-200 font-bold">{u.listings}</td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserId(u.id);
                            }}
                            className="text-cyan-400 hover:text-white hover:underline uppercase text-[10px] font-bold flex items-center gap-1 ml-auto"
                          >
                            Intel Workspace <ChevronRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT WORKSPACE BAR */}
      <div className="lg:col-span-4 rounded-xl border border-slate-800 bg-[#0d142b] p-5 flex flex-col justify-between overflow-hidden">
        {selectedUser ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2 rounded-lg bg-cyan-950/40 border border-cyan-800/30 p-2 text-cyan-400 text-[10px] font-mono text-center justify-center font-bold">
              <Shield className="h-3.5 w-3.5 text-cyan-400" /> SMART PROFILE WORKSPACE (SOVEREIGN ACTIVE)
            </div>

            <div className="text-center pb-4 border-b border-slate-800">
              <div className="h-16 w-16 rounded-full bg-[#14234c] text-cyan-400 font-bold flex items-center justify-center text-xl mx-auto border-2 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] mb-3">
                {selectedUser.name.substring(0, 2).toUpperCase()}
              </div>
              <h3 className="text-base font-black text-white font-mono tracking-wide">{selectedUser.name}</h3>
              <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">{selectedUser.role} • ID: {selectedUser.id}</p>
              
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-3 py-1 border border-slate-800 text-[10px] font-mono">
                <span className="text-slate-500">KYC CODE:</span>
                <span className={`font-bold ${
                  selectedUser.kycStatus === 'Approved' ? 'text-emerald-400' :
                  selectedUser.kycStatus === 'Flagged' ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                }`}>{selectedUser.kycStatus}</span>
              </div>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Communication Email:</span>
                <span className="text-white select-all">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Secure Mobile Cell:</span>
                <span className="text-white">{selectedUser.phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Geospatial Residence:</span>
                <span className="text-white text-right">{selectedUser.location}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">System Activity Status:</span>
                <span className={`font-bold ${
                  selectedUser.status === 'Active' ? 'text-emerald-400' : 'text-rose-400 font-bold'
                }`}>{selectedUser.status}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Active Wallet Exposure:</span>
                <span className="text-amber-400 font-bold">R {selectedUser.walletBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400">Tokenized REIT Holdings:</span>
                <span className="text-white font-semibold">R {selectedUser.investments.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-400 text-rose-400">Profile Fraud Risk:</span>
                <span className={`font-bold ${
                  selectedUser.riskScore > 75 ? "text-rose-400 animate-pulse" : "text-emerald-400"
                }`}>{selectedUser.riskScore}% severity</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                <span className="text-slate-500">IP Fingerprint Key:</span>
                <span className="text-slate-400 font-mono text-[9.5px] select-all uppercase">{selectedUser.fingerprint}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500">Last Telemetry Active:</span>
                <span className="text-slate-400">{selectedUser.lastActive}</span>
              </div>
            </div>

            {/* Geolocation Timeline */}
            <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2 border-b border-slate-800/80 pb-1">
                <MapPin className="h-3 w-3" /> Geolocation Fingerprint Stream
              </div>
              <div className="space-y-1.5 max-h-24 overflow-y-auto font-mono text-[10px] [scrollbar-width:thin] pr-1">
                {selectedUser.geoHistory?.map((geo, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-slate-350">
                    <span className="h-1 w-1 rounded-full bg-cyan-400"></span>
                    <span>{geo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Actions Operations Ribbon */}
            <div className="space-y-2 pt-2">
              <div className="text-[10px] text-slate-500 font-bold tracking-widest font-mono uppercase pb-1 border-b border-slate-800">SOVEREIGN WORKFLOW ACTION COMMANDS</div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => onAction("suspend", selectedUser)}
                  className="rounded bg-rose-500/10 px-2 py-2 text-[10.5px] text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                >
                  <UserX className="h-3.5 w-3.5" /> {selectedUser.status === "Suspended" ? "Lift Block" : "Suspend User"}
                </button>
                <button 
                  onClick={() => onAction("freeze_wallet", selectedUser)}
                  className="rounded bg-amber-500/10 px-2 py-2 text-[10.5px] text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                >
                  <Ban className="h-3.5 w-3.5" /> {selectedUser.isWalletFrozen ? "Unfreeze Wallet" : "Freeze Wallet"}
                </button>
                <button 
                  onClick={() => onAction("kyc_audit", selectedUser)}
                  className="rounded bg-cyan-500/10 px-2 py-2 text-[10.5px] text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                >
                  <ShieldAlert className="h-3.5 w-3.5" /> Trg KYC Review
                </button>
                <button 
                  onClick={() => onAction("send_legal", selectedUser)}
                  className="rounded bg-slate-900 px-2 py-2 text-[10.5px] text-slate-300 border border-slate-800 hover:border-slate-600 transition-all font-mono font-bold uppercase flex items-center justify-center gap-1"
                >
                  <Shield className="h-3.5 w-3.5" /> Send Judicial
                </button>
              </div>

              {selectedUser.status === "Pending Verification" && (
                <button 
                  onClick={() => onAction("approve_verification", selectedUser)}
                  className="w-full rounded bg-emerald-500 py-2.5 text-center text-xs font-bold text-black hover:bg-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all font-mono uppercase flex items-center justify-center gap-1.5 mt-2"
                >
                  <Activity className="h-3.5 w-3.5" /> APPROVE KYC VERIFICATION ENTRY
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500 font-mono text-xs">
            Select a broker, investor, or user profile to trigger active telemetry operations.
          </div>
        )}
      </div>
    </div>
  );
}
