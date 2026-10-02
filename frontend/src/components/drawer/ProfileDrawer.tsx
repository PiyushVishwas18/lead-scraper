'use client';

import React, { useState } from 'react';
import { EmployeeLead } from '@/types/lead';
import { Badge, EmailStatusBadge } from '@/components/ui/Badge';
import {
  CloseIcon,
  MailIcon,
  PhoneIcon,
  ExternalLinkIcon,
  CheckIcon,
  PlusIcon,
  CreditCardIcon,
  SpinnerIcon,
} from '@/components/ui/Icons';

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
  onVerifyEmail,
  onRevealContact,
  onAddToList,
}) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!lead) return null;

  const handleCopyEmail = () => {
    if (lead.workEmail) {
      navigator.clipboard.writeText(lead.workEmail);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleCopyPhone = () => {
    if (lead.phone) {
      navigator.clipboard.writeText(lead.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleVerify = async () => {
    if (onVerifyEmail) {
      setIsVerifying(true);
      try {
        await onVerifyEmail(lead);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm flex justify-end animate-fade-in"
    >
      <div className="w-full max-w-lg bg-[#0b1120] border-l border-slate-800 text-white h-full flex flex-col justify-between shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800/80 bg-[#0f172a]/60 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
              {lead.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="drawer-title" className="text-lg font-bold text-white tracking-tight">
                  {lead.fullName}
                </h2>
                {lead.isDecisionMaker && (
                  <Badge variant="decisionMaker" size="sm">
                    Decision Maker
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {lead.jobTitle || 'Team Member'}{' '}
                {lead.companyName && <span className="text-indigo-400">@ {lead.companyName}</span>}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close lead profile"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Information Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: PERSON */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <span>Person Profile</span>
            </h3>
            <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-slate-800/80 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block">Department</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {lead.department || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Seniority Level</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {lead.seniority || 'Unclassified'}
                  </span>
                </div>
              </div>

              {lead.professionalUrl && (
                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Professional Network
                  </span>
                  <a
                    href={lead.professionalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline truncate max-w-full"
                  >
                    <span>{lead.professionalUrl}</span>
                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: COMPANY */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Company Details
            </h3>
            <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-slate-800/80 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block">Organization</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {lead.companyName}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Industry</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {lead.industry || 'General Technology'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                <div>
                  <span className="text-[11px] text-slate-400 block">Location</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block">
                    {[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || 'Global'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Website Domain</span>
                  {lead.companyWebsite ? (
                    <a
                      href={lead.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline mt-0.5 truncate"
                    >
                      <span className="truncate">{lead.companyWebsite}</span>
                      <ExternalLinkIcon className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-slate-500 mt-0.5 block">N/A</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: CONTACT & VERIFICATION */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Contact & Deliverability
            </h3>
            <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-slate-800/80 space-y-3 text-xs">
              {/* Work Email */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">Work Email</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-semibold text-white">
                      {lead.workEmail || 'No email published'}
                    </span>
                    <EmailStatusBadge status={lead.emailStatus} />
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  {lead.workEmail && (
                    <button
                      onClick={handleCopyEmail}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                    >
                      {copiedEmail ? 'Copied!' : 'Copy'}
                    </button>
                  )}
                  {lead.workEmail && onVerifyEmail && (
                    <button
                      onClick={handleVerify}
                      disabled={isVerifying}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      {isVerifying ? (
                        <>
                          <SpinnerIcon className="w-3 h-3 text-white" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        'Verify'
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Phone number if available */}
              {lead.phone && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Direct Phone</span>
                    <span className="font-mono text-xs text-slate-200 mt-0.5 block">
                      {lead.phone}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyPhone}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                  >
                    {copiedPhone ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: LEAD METADATA */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Lead Intelligence & Scoring
            </h3>
            <div className="bg-[#0f172a]/70 rounded-xl p-4 border border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block">Lead Pipeline Status</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{lead.status}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Quality Assessment</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">
                  {lead.qualityScore || 50}% Confidence
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-800/60">
                <span className="text-[11px] text-slate-400 block">Acquisition Source</span>
                <span className="text-slate-300 mt-0.5 block">
                  {lead.source || 'Domain Employee Crawl'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Drawer Actions */}
        <div className="p-4 sm:p-6 border-t border-slate-800/80 bg-[#0f172a]/80 flex items-center gap-3">
          {onAddToList && (
            <button
              onClick={() => onAddToList(lead)}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700/80 transition-colors flex items-center justify-center gap-1.5"
            >
              <PlusIcon className="w-4 h-4 text-indigo-400" />
              <span>Save to List</span>
            </button>
          )}
          {onRevealContact && (
            <button
              onClick={() => onRevealContact(lead)}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5"
            >
              <CreditCardIcon className="w-4 h-4" />
              <span>Reveal Contact</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
