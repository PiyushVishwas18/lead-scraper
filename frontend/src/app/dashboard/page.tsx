'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { AiSearchBar } from '@/components/search/AiSearchBar';
import { FilterSidebar } from '@/components/search/FilterSidebar';
import { ResultsTable } from '@/components/table/ResultsTable';
import { ProfileDrawer } from '@/components/drawer/ProfileDrawer';
import { SaveToListModal } from '@/components/modal/SaveToListModal';
import { API_BASE_URL } from '@/config/api';
import {
  EmployeeLead,
  DiscoveredEmployee,
  CompanySearchResult,
  SearchFilterRequest,
  SavedList,
  UsageStats,
} from '@/types/lead';

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('search');

  // Usage & Credit Stats
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  // Filters & Live Count
  const [filters, setFilters] = useState<SearchFilterRequest>({
    page: 0,
    size: 20,
    sort: 'newest',
  });
  const [livePeopleCount, setLivePeopleCount] = useState<number>(0);
  const [isAiParsing, setIsAiParsing] = useState<boolean>(false);

  // Search / People Results
  const [peopleLeads, setPeopleLeads] = useState<EmployeeLead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [loadingPeople, setLoadingPeople] = useState<boolean>(false);
  const [pageStats, setPageStats] = useState({ page: 0, totalPages: 1, totalElements: 0 });

  // Company Search
  const [companyKeyword, setCompanyKeyword] = useState<string>('software');
  const [companyLocation, setCompanyLocation] = useState<string>('London');
  const [companyResults, setCompanyResults] = useState<CompanySearchResult[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false);

  // Employee Discovery
  const [discoveryWebsite, setDiscoveryWebsite] = useState<string>('');
  const [maxEmployees, setMaxEmployees] = useState<number>(20);
  const [discoveredEmployees, setDiscoveredEmployees] = useState<DiscoveredEmployee[]>([]);
  const [selectedDiscoveredIndexes, setSelectedDiscoveredIndexes] = useState<number[]>([]);
  const [discovering, setDiscovering] = useState<boolean>(false);
  const [discoverySteps, setDiscoverySteps] = useState<{ label: string; done: boolean }[]>([]);
  const [savingBatch, setSavingBatch] = useState<boolean>(false);

  // Saved Lists
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [selectedList, setSelectedList] = useState<SavedList | null>(null);
  const [listLeads, setListLeads] = useState<EmployeeLead[]>([]);
  const [loadingLists, setLoadingLists] = useState<boolean>(false);
  const [isListModalOpen, setIsListModalOpen] = useState<boolean>(false);

  // Profile Drawer & Row Interaction
  const [drawerLead, setDrawerLead] = useState<EmployeeLead | null>(null);
  const [verifyingCandidateKey, setVerifyingCandidateKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check Authentication Token
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedEmail = localStorage.getItem('userEmail');
    if (!storedToken) {
      router.push('/');
      return;
    }
    setToken(storedToken);
    if (storedEmail) setUserEmail(storedEmail);
  }, [router]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  // Handle 401 Unauthorized
  const handleAuthError = useCallback(
    (res: Response) => {
      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
        router.push('/');
        return true;
      }
      return false;
    },
    [router]
  );

  // Fetch Usage & Credits
  const fetchUsageStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/usage`, { headers: getHeaders() });
      if (handleAuthError(res)) return;
      if (res.ok) {
        const data = await res.json();
        setUsageStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch usage stats', e);
    }
  }, [token, getHeaders, handleAuthError]);

  // Fetch Live People Count
  const fetchLiveCount = useCallback(
    async (currentFilters: SearchFilterRequest) => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/people/count`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(currentFilters),
        });
        if (handleAuthError(res)) return;
        if (res.ok) {
          const data = await res.json();
          setLivePeopleCount(data.count || 0);
        }
      } catch (e) {
        console.error('Failed to fetch live count', e);
      }
    },
    [token, getHeaders, handleAuthError]
  );

  // Fetch People / Saved Leads Search
  const fetchPeopleSearch = useCallback(
    async (currentFilters: SearchFilterRequest) => {
      if (!token) return;
      setLoadingPeople(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/people/search`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(currentFilters),
        });
        if (handleAuthError(res)) return;
        if (res.ok) {
          const data = await res.json();
          setPeopleLeads(data.content || []);
          setPageStats({
            page: data.number || 0,
            totalPages: data.totalPages || 1,
            totalElements: data.totalElements || 0,
          });
        }
      } catch (e) {
        console.error('Failed to search people', e);
      } finally {
        setLoadingPeople(false);
      }
    },
    [token, getHeaders, handleAuthError]
  );

  // Fetch Saved Lists
  const fetchSavedLists = useCallback(async () => {
    if (!token) return;
    setLoadingLists(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/lists`, { headers: getHeaders() });
      if (handleAuthError(res)) return;
      if (res.ok) {
        const data = await res.json();
        setSavedLists(data || []);
      }
    } catch (e) {
      console.error('Failed to fetch saved lists', e);
    } finally {
      setLoadingLists(false);
    }
  }, [token, getHeaders, handleAuthError]);

  // Initial Data Load
  useEffect(() => {
    if (token) {
      fetchUsageStats();
      fetchPeopleSearch(filters);
      fetchLiveCount(filters);
      fetchSavedLists();
    }
  }, [token, fetchUsageStats, fetchPeopleSearch, fetchLiveCount, fetchSavedLists, filters]);

  // Handle AI Search Submission
  const handleAiSearch = async (prompt: string) => {
    setIsAiParsing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/search/ai-parse`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ prompt }),
      });
      if (handleAuthError(res)) return;
      if (res.ok) {
        const parsedFilter: SearchFilterRequest = await res.json();
        setFilters(parsedFilter);
        fetchPeopleSearch(parsedFilter);
        fetchLiveCount(parsedFilter);
        showNotification('success', 'AI parsed search request into structured filters!');
      } else {
        showNotification('error', 'AI search parsing is temporarily unavailable.');
      }
    } catch (e) {
      showNotification('error', 'Failed to communicate with AI search service.');
    } finally {
      setIsAiParsing(false);
    }
  };

  // Handle Company Search
  const handleSearchCompanies = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;
    setLoadingCompanies(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/companies/search`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ keyword: companyKeyword, location: companyLocation, page: 0, size: 20 }),
      });
      if (handleAuthError(res)) return;
      if (res.ok) {
        const data = await res.json();
        setCompanyResults(data || []);
        fetchUsageStats();
        showNotification('success', `Found ${data.length} companies matching search.`);
      }
    } catch (e) {
      showNotification('error', 'Failed to execute company search.');
    } finally {
      setLoadingCompanies(false);
    }
  };

  // Handle Employee Discovery Pipeline
  const handleDiscoverEmployees = async (targetWebsite?: string) => {
    const site = targetWebsite || discoveryWebsite;
    if (!site || !site.trim()) {
      showNotification('error', 'Please enter a valid company website.');
      return;
    }
    setDiscovering(true);
    setDiscoveredEmployees([]);
    setSelectedDiscoveredIndexes([]);
    setDiscoverySteps([
      { label: 'Analyzing website URL & domain', done: true },
      { label: 'Discovering employee & team pages', done: false },
      { label: 'Parsing employees & classifying decision makers', done: false },
    ]);

    try {
      setTimeout(() => {
        setDiscoverySteps((prev) =>
          prev.map((s, idx) => (idx === 1 ? { ...s, done: true } : s))
        );
      }, 1500);

      const res = await fetch(
        `${API_BASE_URL}/api/employee-leads/discover?website=${encodeURIComponent(
          site.trim()
        )}&maxEmployees=${maxEmployees}`,
        { headers: getHeaders() }
      );
      if (handleAuthError(res)) return;

      setDiscoverySteps((prev) => prev.map((s) => ({ ...s, done: true })));

      if (res.ok) {
        const data: DiscoveredEmployee[] = await res.json();
        setDiscoveredEmployees(data || []);
        fetchUsageStats();
        if (data.length > 0) {
          showNotification('success', `Discovered ${data.length} employees from ${site}!`);
        } else {
          showNotification('error', 'No public employees found on company website pages.');
        }
      } else {
        showNotification('error', 'Failed to discover employees for this domain.');
      }
    } catch (e) {
      showNotification('error', 'Error occurred during employee discovery.');
    } finally {
      setDiscovering(false);
    }
  };

  // Save Batch Discovered Employees
  const handleSaveDiscoveredBatch = async () => {
    if (selectedDiscoveredIndexes.length === 0) return;
    setSavingBatch(true);
    try {
      const selected = selectedDiscoveredIndexes.map((idx) => discoveredEmployees[idx]);
      const res = await fetch(
        `${API_BASE_URL}/api/employee-leads/discover/save-batch?website=${encodeURIComponent(
          discoveryWebsite.trim()
        )}`,
        {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(selected),
        }
      );
      if (handleAuthError(res)) return;

      if (res.ok) {
        showNotification('success', `Saved ${selected.length} employees to leads!`);
        setSelectedDiscoveredIndexes([]);
        fetchPeopleSearch(filters);
        fetchUsageStats();
      } else {
        showNotification('error', 'Failed to save selected employees.');
      }
    } catch (e) {
      showNotification('error', 'Error saving employee batch.');
    } finally {
      setSavingBatch(false);
    }
  };

  // Verify Email (Row-Isolated Loading State)
  const handleVerifyEmail = async (lead: EmployeeLead) => {
    if (!lead.workEmail) return;
    const key = `${lead.id}-${lead.workEmail}`;
    setVerifyingCandidateKey(key);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/employee-leads/${lead.id}/verify-email?email=${encodeURIComponent(
          lead.workEmail
        )}`,
        { method: 'POST', headers: getHeaders() }
      );
      if (handleAuthError(res)) return;

      if (res.ok) {
        const updated: EmployeeLead = await res.json();
        setPeopleLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        if (drawerLead && drawerLead.id === updated.id) setDrawerLead(updated);
        fetchUsageStats();
        showNotification('success', `Email verification completed: ${updated.emailStatus}`);
      } else {
        showNotification('error', 'Failed to verify email address.');
      }
    } catch (e) {
      showNotification('error', 'Error verifying email address.');
    } finally {
      setVerifyingCandidateKey(null);
    }
  };

  // Contact Reveal
  const handleRevealContact = async (lead: EmployeeLead) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/people/${lead.id}/reveal-contact`, {
        method: 'POST',
        headers: getHeaders(),
      });
      if (handleAuthError(res)) return;

      if (res.ok) {
        const data = await res.json();
        showNotification(data.success ? 'success' : 'error', data.message);
        fetchPeopleSearch(filters);
        fetchUsageStats();
      }
    } catch (e) {
      showNotification('error', 'Contact reveal failed.');
    }
  };

  // Add Leads to List via Modal
  const handleSaveToList = async (listId: string) => {
    if (selectedLeadIds.length === 0) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/lists/${listId}/leads`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ leadIds: selectedLeadIds }),
      });
      if (handleAuthError(res)) return;

      if (res.ok) {
        showNotification('success', `Added ${selectedLeadIds.length} leads to saved list!`);
        setIsListModalOpen(false);
        setSelectedLeadIds([]);
        fetchSavedLists();
      }
    } catch (e) {
      showNotification('error', 'Failed to add leads to list.');
    }
  };

  // Create List & Save Leads
  const handleCreateAndSaveList = async (name: string, description?: string) => {
    try {
      const createRes = await fetch(`${API_BASE_URL}/api/lists`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, description }),
      });
      if (handleAuthError(createRes)) return;

      if (createRes.ok) {
        const newList = await createRes.json();
        await handleSaveToList(newList.id);
      }
    } catch (e) {
      showNotification('error', 'Failed to create new list.');
    }
  };

  // CSV Export
  const handleExportCsv = async (leadsToExport: EmployeeLead[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/export/leads`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(leadsToExport),
      });
      if (handleAuthError(res)) return;

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lead_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        showNotification('success', 'CSV export downloaded successfully!');
      }
    } catch (e) {
      showNotification('error', 'Failed to generate CSV export.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Platform Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        credits={usageStats ? { remainingCredits: usageStats.remainingCredits, totalCredits: usageStats.totalCredits } : undefined}
        userEmail={userEmail}
        onLogout={handleLogout}
      />

      {/* Notification Banner */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-xl text-xs font-semibold flex items-center space-x-2 border animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950 border-rose-500/50 text-rose-300'
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* ============================================================ */}
        {/* TAB 1: SEARCH / PEOPLE SEARCH & DASHBOARD */}
        {/* ============================================================ */}
        {(activeTab === 'search' || activeTab === 'people' || activeTab === 'decision-makers') && (
          <div className="space-y-6">
            {/* AI Natural Language Search Header */}
            <AiSearchBar onSearch={handleAiSearch} isLoading={isAiParsing} />

            {/* Live People Count Indicator */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-5 py-3 shadow">
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-indigo-500 animate-ping"></span>
                <span className="text-sm font-bold text-white">
                  {livePeopleCount.toLocaleString()} people match your search criteria
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {selectedLeadIds.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-indigo-300 font-semibold bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-md">
                      {selectedLeadIds.length} selected
                    </span>
                    <button
                      onClick={() => setIsListModalOpen(true)}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
                    >
                      + Save to List
                    </button>
                    <button
                      onClick={() =>
                        handleExportCsv(peopleLeads.filter((l) => selectedLeadIds.includes(l.id)))
                      }
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors"
                    >
                      Export CSV
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Main Search Content Layout (FilterSidebar + ResultsTable) */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Reusable Filter Sidebar */}
              <FilterSidebar
                filters={filters}
                setFilters={setFilters}
                onApply={() => {
                  fetchPeopleSearch(filters);
                  fetchLiveCount(filters);
                }}
                onClear={() => {
                  const defaultF: SearchFilterRequest = { page: 0, size: 20, sort: 'newest' };
                  setFilters(defaultF);
                  fetchPeopleSearch(defaultF);
                  fetchLiveCount(defaultF);
                }}
              />

              {/* Main Results Table */}
              <div className="flex-1 space-y-4">
                <ResultsTable
                  leads={
                    activeTab === 'decision-makers'
                      ? peopleLeads.filter((l) => l.isDecisionMaker)
                      : peopleLeads
                  }
                  selectedLeadIds={selectedLeadIds}
                  setSelectedLeadIds={setSelectedLeadIds}
                  onRowClick={(lead) => setDrawerLead(lead)}
                  onVerifyEmail={handleVerifyEmail}
                  onRevealContact={handleRevealContact}
                  onAddToList={(lead) => {
                    setSelectedLeadIds([lead.id]);
                    setIsListModalOpen(true);
                  }}
                  verifyingKey={verifyingCandidateKey}
                  loading={loadingPeople}
                />

                {/* Server-Side Pagination Controls */}
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400">
                  <span>
                    Page {pageStats.page + 1} of {pageStats.totalPages} ({pageStats.totalElements} total leads)
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={pageStats.page === 0 || loadingPeople}
                      onClick={() => {
                        const newF = { ...filters, page: pageStats.page - 1 };
                        setFilters(newF);
                        fetchPeopleSearch(newF);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded font-medium transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={pageStats.page >= pageStats.totalPages - 1 || loadingPeople}
                      onClick={() => {
                        const newF = { ...filters, page: pageStats.page + 1 };
                        setFilters(newF);
                        fetchPeopleSearch(newF);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded font-medium transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: COMPANY SEARCH */}
        {/* ============================================================ */}
        {activeTab === 'companies' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white">Company Search & Discovery</h2>
              <form onSubmit={handleSearchCompanies} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Keyword / Industry</label>
                  <input
                    type="text"
                    value={companyKeyword}
                    onChange={(e) => setCompanyKeyword(e.target.value)}
                    placeholder="e.g. software, fintech"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Location / City</label>
                  <input
                    type="text"
                    value={companyLocation}
                    onChange={(e) => setCompanyLocation(e.target.value)}
                    placeholder="e.g. London, Mumbai"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loadingCompanies}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded transition-colors"
                  >
                    {loadingCompanies ? 'Searching Companies...' : 'Search Companies'}
                  </button>
                </div>
              </form>
            </div>

            {/* Companies Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companyResults.map((comp, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base">{comp.name}</h3>
                      <p className="text-xs text-indigo-400 mt-0.5">{comp.category || 'Technology'}</p>
                    </div>
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-medium">
                      {comp.companySize || '50-200'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{comp.description}</p>

                  <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                    <span>📍 {[comp.city, comp.country].filter(Boolean).join(', ')}</span>
                    {comp.revenue && <span>💰 {comp.revenue}</span>}
                    {comp.funding && <span>🚀 {comp.funding}</span>}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    {comp.website ? (
                      <a
                        href={comp.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-400 hover:underline truncate max-w-[200px]"
                      >
                        {comp.website}
                      </a>
                    ) : (
                      <span></span>
                    )}
                    <button
                      onClick={() => {
                        setDiscoveryWebsite(comp.website || comp.name);
                        setActiveTab('discovery');
                        handleDiscoverEmployees(comp.website || comp.name);
                      }}
                      className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 rounded text-xs font-semibold transition-colors"
                    >
                      Find Employees →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: EMPLOYEE DISCOVERY */}
        {/* ============================================================ */}
        {activeTab === 'discovery' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <h2 className="text-base font-bold text-white">Employee Website Discovery Pipeline</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company Website URL</label>
                  <input
                    type="text"
                    value={discoveryWebsite}
                    onChange={(e) => setDiscoveryWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Employees</label>
                  <select
                    value={maxEmployees}
                    onChange={(e) => setMaxEmployees(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value={10}>10 Employees</option>
                    <option value={20}>20 Employees</option>
                    <option value={50}>50 Employees</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => handleDiscoverEmployees()}
                    disabled={discovering || !discoveryWebsite.trim()}
                    className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs rounded transition-colors disabled:opacity-50"
                  >
                    {discovering ? 'Discovering...' : 'Discover Employees'}
                  </button>
                </div>
              </div>

              {/* Progress Steps Indicator */}
              {discoverySteps.length > 0 && (
                <div className="pt-3 border-t border-slate-800 flex items-center space-x-4 text-xs">
                  {discoverySteps.map((step, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          step.done ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-400 animate-pulse'
                        }`}
                      >
                        {step.done ? '✓' : idx + 1}
                      </span>
                      <span className={step.done ? 'text-slate-200' : 'text-slate-400'}>{step.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discovered Employees Table */}
            {discoveredEmployees.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Discovered {discoveredEmployees.length} Employees
                  </h3>
                  {selectedDiscoveredIndexes.length > 0 && (
                    <button
                      onClick={handleSaveDiscoveredBatch}
                      disabled={savingBatch}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition-colors disabled:opacity-50"
                    >
                      {savingBatch ? 'Saving...' : `Save Selected (${selectedDiscoveredIndexes.length})`}
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="py-2.5 px-3 w-10">
                          <input
                            type="checkbox"
                            checked={
                              selectedDiscoveredIndexes.length === discoveredEmployees.length &&
                              discoveredEmployees.length > 0
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDiscoveredIndexes(discoveredEmployees.map((_, i) => i));
                              } else {
                                setSelectedDiscoveredIndexes([]);
                              }
                            }}
                            className="rounded border-slate-700 bg-slate-800 text-indigo-600"
                          />
                        </th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Title & Dept</th>
                        <th className="py-2.5 px-3">Published Email</th>
                        <th className="py-2.5 px-3">Decision Maker</th>
                        <th className="py-2.5 px-3">Source URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs">
                      {discoveredEmployees.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/50">
                          <td className="py-3 px-3">
                            <input
                              type="checkbox"
                              checked={selectedDiscoveredIndexes.includes(idx)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDiscoveredIndexes((prev) => [...prev, idx]);
                                } else {
                                  setSelectedDiscoveredIndexes((prev) => prev.filter((i) => i !== idx));
                                }
                              }}
                              className="rounded border-slate-700 bg-slate-800 text-indigo-600"
                            />
                          </td>
                          <td className="py-3 px-3 font-semibold text-white">{emp.fullName}</td>
                          <td className="py-3 px-3 text-slate-300">
                            {emp.jobTitle || 'Team Member'}{' '}
                            {emp.department && <span className="text-slate-500">· {emp.department}</span>}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-200">
                            {emp.email || <span className="text-slate-500 font-sans">No published email</span>}
                          </td>
                          <td className="py-3 px-3">
                            {emp.isDecisionMaker ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Yes
                              </span>
                            ) : (
                              <span className="text-slate-500">No</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {emp.sourceUrl ? (
                              <a
                                href={emp.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-400 hover:underline truncate block max-w-[150px]"
                              >
                                Source Page
                              </a>
                            ) : (
                              <span className="text-slate-500">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: SAVED LEADS */}
        {/* ============================================================ */}
        {activeTab === 'saved-leads' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
              <h2 className="text-base font-bold text-white">Saved Lead Repository</h2>
              <button
                onClick={() => handleExportCsv(peopleLeads)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-medium transition-colors"
              >
                Export All Saved CSV
              </button>
            </div>

            <ResultsTable
              leads={peopleLeads}
              selectedLeadIds={selectedLeadIds}
              setSelectedLeadIds={setSelectedLeadIds}
              onRowClick={(lead) => setDrawerLead(lead)}
              onVerifyEmail={handleVerifyEmail}
              onRevealContact={handleRevealContact}
              onAddToList={(lead) => {
                setSelectedLeadIds([lead.id]);
                setIsListModalOpen(true);
              }}
              verifyingKey={verifyingCandidateKey}
              loading={loadingPeople}
            />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: SAVED LISTS */}
        {/* ============================================================ */}
        {activeTab === 'saved-lists' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
              <div>
                <h2 className="text-base font-bold text-white">Saved Lists Management</h2>
                <p className="text-xs text-slate-400 mt-0.5">Organize saved leads into custom outreach segments</p>
              </div>
              <button
                onClick={() => setIsListModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition-colors"
              >
                + Create List
              </button>
            </div>

            {loadingLists ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading saved lists...</div>
            ) : savedLists.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
                No saved lists found. Click + Create List to create your first segment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {savedLists.map((list) => (
                  <div
                    key={list.id}
                    onClick={async () => {
                      setSelectedList(list);
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/lists/${list.id}/leads`, {
                          headers: getHeaders(),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setListLeads(data || []);
                        }
                      } catch (e) {
                        console.error('Failed to load list leads', e);
                      }
                    }}
                    className={`bg-slate-900 border rounded-xl p-5 cursor-pointer transition-all ${
                      selectedList?.id === list.id ? 'border-indigo-500 bg-indigo-950/20' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-white text-sm">{list.name}</h3>
                      <span className="text-[11px] bg-slate-800 text-indigo-300 font-semibold px-2 py-0.5 rounded">
                        {list.leadCount} leads
                      </span>
                    </div>
                    {list.description && <p className="text-xs text-slate-400 mt-2">{list.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Selected List Lead Details */}
            {selectedList && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Leads in "{selectedList.name}"</h3>
                  <button
                    onClick={() => handleExportCsv(listLeads)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded"
                  >
                    Export List CSV
                  </button>
                </div>
                <ResultsTable
                  leads={listLeads}
                  selectedLeadIds={[]}
                  setSelectedLeadIds={() => {}}
                  onRowClick={(lead) => setDrawerLead(lead)}
                  onVerifyEmail={handleVerifyEmail}
                  onRevealContact={handleRevealContact}
                />
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 6: USAGE & STATISTICS */}
        {/* ============================================================ */}
        {activeTab === 'usage' && usageStats && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h2 className="text-base font-bold text-white">Account Usage & Credits Dashboard</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 block">Remaining Credits</span>
                  <span className="text-2xl font-extrabold text-amber-400">{usageStats.remainingCredits}</span>
                </div>
                <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 block">Total Searches</span>
                  <span className="text-2xl font-extrabold text-white">{usageStats.totalSearched}</span>
                </div>
                <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 block">Employees Discovered</span>
                  <span className="text-2xl font-extrabold text-indigo-400">{usageStats.totalDiscovered}</span>
                </div>
                <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 block">Leads Saved</span>
                  <span className="text-2xl font-extrabold text-emerald-400">{usageStats.totalSaved}</span>
                </div>
                <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 block">Emails Found</span>
                  <span className="text-2xl font-extrabold text-purple-400">{usageStats.totalEmailsFound}</span>
                </div>
                <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 block">Emails Verified</span>
                  <span className="text-2xl font-extrabold text-blue-400">{usageStats.totalEmailsVerified}</span>
                </div>
                <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 block">Contacts Revealed</span>
                  <span className="text-2xl font-extrabold text-pink-400">{usageStats.totalContactsRevealed}</span>
                </div>
                <div className="bg-slate-800/60 border border-slate-800 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 block">Saved Lists Created</span>
                  <span className="text-2xl font-extrabold text-teal-400">{usageStats.totalListsCreated}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Slide-Over Profile Drawer Component */}
      <ProfileDrawer
        lead={drawerLead}
        onClose={() => setDrawerLead(null)}
        onVerifyEmail={handleVerifyEmail}
        onRevealContact={handleRevealContact}
        onAddToList={(lead) => {
          setSelectedLeadIds([lead.id]);
          setIsListModalOpen(true);
        }}
      />

      {/* Save Leads to List Modal */}
      <SaveToListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        lists={savedLists}
        onSaveToList={handleSaveToList}
        onCreateAndSave={handleCreateAndSaveList}
        selectedCount={selectedLeadIds.length}
      />
    </div>
  );
}