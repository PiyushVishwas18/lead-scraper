'use client';

import React, { useState } from 'react';
import { EmployeeLead } from '@/types/lead';

interface ProfileDrawerProps {
  lead: EmployeeLead | null;
  onClose: () => void;
  onFindEmail?: (lead: EmployeeLead) => void;
  onVerifyEmail?: (lead: EmployeeLead) => void;
  onRevealContact?: (lead: EmployeeLead) => void;
  onAddToList?: (lead: EmployeeLead) => void;
  onSaveLead?: (lead: EmployeeLead) => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  lead,
  onClose,
  onFindEmail,
  onVerifyEmail,
  onRevealContact,
  onAddToList,
  onSaveLead,
}) => {
  const [copied, setCopied] = useState(false);

  if (!lead) return null;

  const handleCopyEmail = () => {
    if (lead.workEmail) {
      navigator.clipboard.writeText(lead.workEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 text-white h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header & Close Button */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">{lead.fullName}</h2>
                {lead.isDecisionMaker && (
                  <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Decision Maker
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-1">{lead.jobTitle || 'Team Member'}</p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* PERSON DETAILS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Person Details</h3>
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/60 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block">Department</span>
                <span className="font-semibold text-slate-200">{lead.department || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Seniority</span>
                <span className="font-semibold text-slate-200">{lead.seniority || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">Professional Profile</span>
                {lead.professionalUrl ? (
                  <a
                    href={lead.professionalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline truncate block"
                  >
                    {lead.professionalUrl}
                  </a>
                ) : (
                  <span className="text-slate-500">Not provided</span>
                )}
              </div>
            </div>
          </div>

          {/* COMPANY DETAILS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Company Information</h3>
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/60 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block">Company</span>
                <span className="font-semibold text-slate-200">{lead.companyName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Industry</span>
                <span className="font-semibold text-slate-200">{lead.industry || 'N/A'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block mb-0.5">Website</span>
                {lead.companyWebsite ? (
                  <a
                    href={lead.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline truncate block"
                  >
                    {lead.companyWebsite}
                  </a>
                ) : (
                  <span className="text-slate-500">Not provided</span>
                )}
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Location</span>
                <span className="font-semibold text-slate-200">
                  {[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* CONTACT & VERIFICATION */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Contact & Verification</h3>
            <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block">Work Email</span>
                  <span className="font-mono text-sm text-slate-100">{lead.workEmail || 'No published email'}</span>
                </div>
                {lead.workEmail && (
                  <button
                    onClick={handleCopyEmail}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs transition-colors"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-700/50 pt-2">
                <div>
                  <span className="text-slate-400 block">Email Verification Status</span>
                  <span className="font-semibold text-slate-200">{lead.emailStatus}</span>
                </div>
                {lead.workEmail && onVerifyEmail && (
                  <button
                    onClick={() => onVerifyEmail(lead)}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
                  >
                    Verify Email
                  </button>
                )}
              </div>

              {lead.phone && (
                <div className="border-t border-slate-700/50 pt-2">
                  <span className="text-slate-400 block">Phone</span>
                  <span className="font-mono text-slate-200">{lead.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* LEAD METADATA & SOURCE */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Lead Source & Metadata</h3>
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/60 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-400 block">Lead Status</span>
                <span className="font-semibold text-slate-200">{lead.status}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Quality Score</span>
                <span className="font-semibold text-emerald-400">{lead.qualityScore || 50}%</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Data Source</span>
                <span className="text-slate-300">{lead.source || 'Website Discovery'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="pt-6 border-t border-slate-800 flex items-center space-x-3">
          {onAddToList && (
            <button
              onClick={() => onAddToList(lead)}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded transition-colors"
            >
              + Add to List
            </button>
          )}
          {onRevealContact && (
            <button
              onClick={() => onRevealContact(lead)}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded transition-colors"
            >
              Reveal Contact
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
