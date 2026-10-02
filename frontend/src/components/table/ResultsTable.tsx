'use client';

import React from 'react';
import { EmployeeLead } from '@/types/lead';
import { Badge, EmailStatusBadge } from '@/components/ui/Badge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SpinnerIcon, PlusIcon, ExternalLinkIcon } from '@/components/ui/Icons';

interface ResultsTableProps {
  leads: EmployeeLead[];
  selectedLeadIds: string[];
  setSelectedLeadIds: React.Dispatch<React.SetStateAction<string[]>>;
  onRowClick: (lead: EmployeeLead) => void;
  onVerifyEmail?: (lead: EmployeeLead) => void;
  onRevealContact?: (lead: EmployeeLead) => void;
  onAddToList?: (lead: EmployeeLead) => void;
  verifyingKey?: string | null;
  loading?: boolean;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  leads,
  selectedLeadIds,
  setSelectedLeadIds,
  onRowClick,
  onVerifyEmail,
  onRevealContact,
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
        <Badge variant="success" size="sm">
          {val}% High
        </Badge>
      );
    }
    if (val >= 65) {
      return (
        <Badge variant="warning" size="sm">
          {val}% Medium
        </Badge>
      );
    }
    return (
      <Badge variant="default" size="sm">
        {val}% Basic
      </Badge>
    );
  };

  if (loading) {
    return <TableSkeleton rows={8} />;
  }

  if (leads.length === 0) {
    return (
      <EmptyState
        title="No Prospective Leads Found"
        description="No records match your active search filters or search prompt. Try adjusting your parameters or crawl a new domain."
      />
    );
  }

  return (
    <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#0b1120]/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10">
              <th className="py-3 px-4 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all leads"
                  className="w-4 h-4 rounded border-slate-700 bg-[#090d16] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Executive / Contact</th>
              <th className="py-3 px-4">Company & Location</th>
              <th className="py-3 px-4">Contact Email</th>
              <th className="py-3 px-4">Quality Score</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {leads.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead.id);
              const isVerifyingThis =
                verifyingKey === lead.id || verifyingKey === `${lead.id}-${lead.workEmail}`;

              return (
                <tr
                  key={lead.id}
                  onClick={() => onRowClick(lead)}
                  className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Checkbox column */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleSelectOne(lead.id, e as any)}
                      aria-label={`Select ${lead.fullName}`}
                      className="w-4 h-4 rounded border-slate-700 bg-[#090d16] text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Name & Title */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0">
                        {lead.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-semibold text-slate-100 text-sm truncate">
                            {lead.fullName}
                          </span>
                          {lead.isDecisionMaker && (
                            <Badge variant="decisionMaker" size="sm">
                              DM
                            </Badge>
                          )}
                        </div>
                        <div className="text-slate-400 text-xs truncate">
                          {lead.jobTitle || 'Team Member'}{' '}
                          {lead.department && (
                            <span className="text-slate-500">· {lead.department}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Company & Location */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200 truncate">{lead.companyName}</div>
                    <div className="text-slate-400 text-[11px] truncate mt-0.5">
                      {[lead.city, lead.country].filter(Boolean).join(', ') || 'Global / Remote'}
                    </div>
                  </td>

                  {/* Work Email & Verification */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-slate-200 text-xs">
                      {lead.workEmail || (
                        <span className="text-slate-500 font-sans italic text-[11px]">
                          Unrevealed / None
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                      <EmailStatusBadge status={lead.emailStatus} />
                      {lead.workEmail && onVerifyEmail && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onVerifyEmail(lead);
                          }}
                          disabled={isVerifyingThis}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium underline disabled:opacity-50 inline-flex items-center gap-1"
                        >
                          {isVerifyingThis ? (
                            <>
                              <SpinnerIcon className="w-3 h-3 text-indigo-400" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            'Verify'
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Lead Quality */}
                  <td className="py-3.5 px-4">{renderQualityBadge(lead.qualityScore)}</td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end space-x-1.5">
                      {onRevealContact && (
                        <button
                          onClick={() => onRevealContact(lead)}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors"
                          title="Reveal verified phone and email (costs credits)"
                        >
                          Reveal
                        </button>
                      )}
                      {onAddToList && (
                        <button
                          onClick={() => onAddToList(lead)}
                          className="p-1 sm:px-2 sm:py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 rounded-lg text-xs font-medium transition-colors"
                          title="Save to targeted list"
                        >
                          <PlusIcon className="w-3.5 h-3.5 sm:hidden" />
                          <span className="hidden sm:inline">+ List</span>
                        </button>
                      )}
                      <button
                        onClick={() => onRowClick(lead)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700/80 transition-colors"
                      >
                        Inspect
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
