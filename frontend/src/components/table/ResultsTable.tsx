'use client';

import React from 'react';
import { EmployeeLead } from '@/types/lead';

interface ResultsTableProps {
  leads: EmployeeLead[];
  selectedLeadIds: string[];
  setSelectedLeadIds: React.Dispatch<React.SetStateAction<string[]>>;
  onRowClick: (lead: EmployeeLead) => void;
  onFindEmail?: (lead: EmployeeLead) => void;
  onVerifyEmail?: (lead: EmployeeLead) => void;
  onRevealContact?: (lead: EmployeeLead) => void;
  onSaveLead?: (lead: EmployeeLead) => void;
  onAddToList?: (lead: EmployeeLead) => void;
  verifyingKey?: string | null;
  loading?: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  leads,
  selectedLeadIds,
  setSelectedLeadIds,
  onRowClick,
  onFindEmail,
  onVerifyEmail,
  onRevealContact,
  onSaveLead,
  onAddToList,
  verifyingKey,
  loading,
}) => {
  const isAllSelected = leads.length > 0 && leads.every((l) => selectedLeadIds.includes(l.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l.id));
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const renderQualityBadge = (score?: number) => {
    const val = score || 50;
    if (val >= 85) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          High ({val}%)
        </span>
      );
    }
    if (val >= 65) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          Med ({val}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-700 text-slate-300 border border-slate-600">
        Basic ({val}%)
      </span>
    );
  };

  const renderEmailStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            ✓ Valid
          </span>
        );
      case 'INVALID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            ✕ Invalid
          </span>
        );
      case 'UNKNOWN':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ? Unknown
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Not Verified
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-lg">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm font-medium text-slate-300">Loading results from backend...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center shadow-lg">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No Leads Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No records match your active criteria. Try clearing filters or running a company discovery search.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="py-3 px-4">Name & Title</th>
              <th className="py-3 px-4">Company & Location</th>
              <th className="py-3 px-4">Work Email & Status</th>
              <th className="py-3 px-4">Lead Quality</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-xs">
            {leads.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead.id);
              const isVerifyingThis = verifyingKey === lead.id || verifyingKey === `${lead.id}-${lead.workEmail}`;

              return (
                <tr
                  key={lead.id}
                  onClick={() => onRowClick(lead)}
                  className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-950/30' : ''
                  }`}
                >
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleSelectOne(lead.id, e as any)}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Name & Title */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-sm">{lead.fullName}</span>
                      {lead.isDecisionMaker && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          DM
                        </span>
                      )}
                    </div>
                    <div className="text-slate-400 mt-0.5">
                      {lead.jobTitle || 'Team Member'}{' '}
                      {lead.department && <span className="text-slate-500">· {lead.department}</span>}
                    </div>
                  </td>

                  {/* Company & Location */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200">{lead.companyName}</div>
                    <div className="text-slate-400 mt-0.5 text-[11px]">
                      {[lead.city, lead.country].filter(Boolean).join(', ') || 'Global'}
                    </div>
                  </td>

                  {/* Work Email & Status */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-slate-200">
                        {lead.workEmail || 'No published email'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                      {renderEmailStatusBadge(lead.emailStatus)}
                      {lead.workEmail && onVerifyEmail && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onVerifyEmail(lead);
                          }}
                          disabled={isVerifyingThis}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline disabled:opacity-50"
                        >
                          {isVerifyingThis ? 'Verifying...' : 'Verify'}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Lead Quality */}
                  <td className="py-3.5 px-4">{renderQualityBadge(lead.qualityScore)}</td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-2">
                      {onRevealContact && (
                        <button
                          onClick={() => onRevealContact(lead)}
                          className="px-2 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-medium transition-colors"
                        >
                          Reveal
                        </button>
                      )}
                      {onAddToList && (
                        <button
                          onClick={() => onAddToList(lead)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded text-[11px] font-medium transition-colors"
                        >
                          + List
                        </button>
                      )}
                      <button
                        onClick={() => onRowClick(lead)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-medium transition-colors"
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
