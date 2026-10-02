'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { AiSearchBar } from '@/components/search/AiSearchBar';
import { FilterSidebar } from '@/components/search/FilterSidebar';
import { ResultsTable } from '@/components/table/ResultsTable';
import { ProfileDrawer } from '@/components/drawer/ProfileDrawer';
import { SaveToListModal } from '@/components/modal/SaveToListModal';
import { Toast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import {
  CompaniesIcon,
  DiscoveryIcon,
  DecisionMakersIcon,
  ExportIcon,
  PlusIcon,
  SearchIcon,
  ExternalLinkIcon,
  SpinnerIcon,
  CheckIcon,
  CloseIcon,
  TrashIcon,
} from '@/components/ui/Icons';
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
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

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
  const [listToDelete, setListToDelete] = useState<SavedList | null>(null);
  const [deletingListId, setDeletingListId] = useState<string | null>(null);

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
    setTimeout(() => setNotification(null), 4500);
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
        showNotification('success', 'AI converted natural language query into filters!');
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
        showNotification('success', `Found ${data.length} companies matching criteria.`);
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
      { label: 'Analyzing target domain URL & security headers', done: true },
      { label: 'Discovering corporate team and staff directories', done: false },
      { label: 'Extracting verified employees and detecting leadership', done: false },
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
          showNotification('success', `Discovered ${data.length} team members from ${site}!`);
        } else {
          showNotification('error', 'No publicly indexed employees discovered on this domain.');
        }
      } else {
        showNotification('error', 'Failed to discover employees for this domain.');
      }
    } catch (e) {
      showNotification('error', 'Error occurred during employee discovery crawl.');
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
        showNotification('success', `Successfully saved ${selected.length} employees to your database!`);
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
        showNotification('success', `Email deliverability verification: ${updated.emailStatus}`);
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
      const res = await fetch(`${API_BASE_URL}/api/lists/${listId}/leads/batch`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ leadIds: selectedLeadIds }),
      });
      if (handleAuthError(res)) return;

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const addedCount = typeof data.addedCount === 'number' ? data.addedCount : selectedLeadIds.length;
        const alreadyPresent = typeof data.alreadyPresentCount === 'number' ? data.alreadyPresentCount : 0;

        let msg = `Added ${addedCount} lead${addedCount !== 1 ? 's' : ''} to outreach list!`;
        if (alreadyPresent > 0 && addedCount > 0) {
          msg = `Added ${addedCount} lead${addedCount !== 1 ? 's' : ''} (${alreadyPresent} already in list)`;
        } else if (alreadyPresent > 0 && addedCount === 0) {
          msg = `Selected lead${alreadyPresent !== 1 ? 's are' : ' is'} already in this list`;
        }

        showNotification('success', msg);
        setIsListModalOpen(false);
        setSelectedLeadIds([]);
        fetchSavedLists();
      } else {
        const err = await res.json().catch(() => null);
        showNotification('error', err?.message || 'Failed to add leads to list.');
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

  // Delete List
  const handleDeleteList = async (listId: string) => {
    setDeletingListId(listId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (handleAuthError(res)) return;

      if (res.ok) {
        showNotification('success', 'List deleted successfully');
        setSavedLists((prev) => prev.filter((l) => l.id !== listId));
        if (selectedList?.id === listId) {
          setSelectedList(null);
          setListLeads([]);
        }
        setListToDelete(null);
        fetchUsageStats();
      } else {
        const errorData = await res.json().catch(() => null);
        showNotification('error', errorData?.message || 'Failed to delete list.');
      }
    } catch (e) {
      showNotification('error', 'Failed to delete list.');
    } finally {
      setDeletingListId(null);
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
        showNotification('success', 'CSV export file downloaded successfully!');
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        credits={
          usageStats
            ? { remainingCredits: usageStats.remainingCredits, totalCredits: usageStats.totalCredits }
            : undefined
        }
        userEmail={userEmail}
        onLogout={handleLogout}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
        savedLeadsCount={peopleLeads.length}
        savedListsCount={savedLists.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Navigation */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          credits={
            usageStats
              ? { remainingCredits: usageStats.remainingCredits, totalCredits: usageStats.totalCredits }
              : undefined
          }
          userEmail={userEmail}
          onLogout={handleLogout}
          onOpenMobileMenu={() => setIsOpenMobile(true)}
          onQuickAiSearchClick={() => setActiveTab('search')}
        />

        {/* Floating Notification Toast */}
        <Toast notification={notification} onClose={() => setNotification(null)} />

        {/* Dynamic Section Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* ============================================================ */}
          {/* TAB 0: DASHBOARD OVERVIEW */}
          {/* ============================================================ */}
          {activeTab === 'dashboard' && (
            <DashboardOverview
              usageStats={usageStats}
              recentLeads={peopleLeads}
              savedLists={savedLists}
              onNavigateTab={setActiveTab}
              onSelectLead={(lead) => setDrawerLead(lead)}
              onExportCsv={handleExportCsv}
              userEmail={userEmail}
              loadingLeads={loadingPeople}
            />
          )}

          {/* ============================================================ */}
          {/* TAB 1: AI SEARCH & PEOPLE SEARCH */}
          {/* ============================================================ */}
          {(activeTab === 'search' || activeTab === 'people' || activeTab === 'decision-makers') && (
            <div className="space-y-6 animate-fade-in">
              {/* Natural Language AI Search Bar */}
              {activeTab === 'search' && (
                <AiSearchBar onSearch={handleAiSearch} isLoading={isAiParsing} />
              )}

              {/* Decision Makers Info Banner */}
              {activeTab === 'decision-makers' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
                      DM
                    </div>
                    <div>
                      <div className="font-semibold text-white">Decision Maker Intelligence Filter</div>
                      <p className="text-slate-400 mt-0.5">
                        Isolating executive and leadership tier contacts (CXO, VP, Founders, Heads)
                      </p>
                    </div>
                  </div>
                  <Badge variant="decisionMaker">High-Value Target</Badge>
                </div>
              )}

              {/* Action & Live Count Indicator Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f172a]/70 border border-slate-800/80 rounded-xl px-4 sm:px-5 py-3 shadow-sm backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-white">
                    <span className="text-indigo-400 font-bold">{livePeopleCount.toLocaleString()}</span>{' '}
                    matches in global directory
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedLeadIds.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-indigo-300 font-semibold bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                        {selectedLeadIds.length} selected
                      </span>
                      <button
                        onClick={() => setIsListModalOpen(true)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        <span>Save to List</span>
                      </button>
                      <button
                        onClick={() =>
                          handleExportCsv(peopleLeads.filter((l) => selectedLeadIds.includes(l.id)))
                        }
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                      >
                        <ExportIcon className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Two-Column Search Grid (FilterSidebar + ResultsTable) */}
              <div className="flex flex-col lg:flex-row gap-6 items-start">
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

                <div className="flex-1 w-full space-y-4">
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

                  {/* Server Pagination Bar */}
                  <div className="flex items-center justify-between bg-[#0f172a]/70 border border-slate-800/80 rounded-xl px-4 py-3 text-xs text-slate-400">
                    <span>
                      Page <span className="font-semibold text-white">{pageStats.page + 1}</span> of{' '}
                      <span className="font-semibold text-white">{pageStats.totalPages}</span>{' '}
                      ({pageStats.totalElements.toLocaleString()} total entries)
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        disabled={pageStats.page === 0 || loadingPeople}
                        onClick={() => {
                          const newF = { ...filters, page: pageStats.page - 1 };
                          setFilters(newF);
                          fetchPeopleSearch(newF);
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700/80 rounded-lg font-medium transition-colors"
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
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700/80 rounded-lg font-medium transition-colors"
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
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <CompaniesIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Target Account Directory
                    </h2>
                    <p className="text-xs text-slate-400">
                      Query corporate databases by keyword, industry, and geographic location
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSearchCompanies} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Keyword / Industry
                    </label>
                    <input
                      type="text"
                      value={companyKeyword}
                      onChange={(e) => setCompanyKeyword(e.target.value)}
                      placeholder="e.g. Fintech, SaaS, Healthcare"
                      className="w-full px-3 py-2 bg-[#0b1120] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Target City / Hub
                    </label>
                    <input
                      type="text"
                      value={companyLocation}
                      onChange={(e) => setCompanyLocation(e.target.value)}
                      placeholder="e.g. London, San Francisco"
                      className="w-full px-3 py-2 bg-[#0b1120] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={loadingCompanies}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      {loadingCompanies ? (
                        <>
                          <SpinnerIcon className="w-3.5 h-3.5 text-white" />
                          <span>Searching Accounts...</span>
                        </>
                      ) : (
                        <>
                          <SearchIcon className="w-3.5 h-3.5" />
                          <span>Search Companies</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Companies Grid */}
              {loadingCompanies ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="bg-[#0f172a]/70 border border-slate-800/80 rounded-xl p-5 space-y-3">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : companyResults.length === 0 ? (
                <EmptyState
                  title="No Companies Found"
                  description="Run a keyword or location search to discover target corporate entities."
                  actionText="Search Software Accounts"
                  onAction={() => {
                    setCompanyKeyword('software');
                    setCompanyLocation('London');
                    handleSearchCompanies();
                  }}
                  icon={<CompaniesIcon className="w-7 h-7" />}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyResults.map((comp, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3.5 hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-indigo-400 shrink-0">
                              {comp.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                                {comp.name}
                              </h3>
                              <p className="text-xs text-indigo-400 mt-0.5 font-medium">
                                {comp.category || 'Technology & Software'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="default" size="sm">
                            {comp.companySize || '50-200 team'}
                          </Badge>
                        </div>

                        {comp.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {comp.description}
                          </p>
                        )}

                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                          <span>📍 {[comp.city, comp.country].filter(Boolean).join(', ') || 'Global'}</span>
                          {comp.revenue && <span>💰 {comp.revenue}</span>}
                          {comp.funding && <span>🚀 {comp.funding}</span>}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        {comp.website ? (
                          <a
                            href={comp.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline truncate max-w-[200px]"
                          >
                            <span className="truncate">{comp.website}</span>
                            <ExternalLinkIcon className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">Domain unlisted</span>
                        )}

                        <button
                          onClick={() => {
                            setDiscoveryWebsite(comp.website || comp.name);
                            setActiveTab('discovery');
                            handleDiscoverEmployees(comp.website || comp.name);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <span>Discover Team</span>
                          <span className="text-indigo-400">→</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: EMPLOYEE DISCOVERY */}
          {/* ============================================================ */}
          {activeTab === 'discovery' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <DiscoveryIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Automated Domain Employee Discovery
                    </h2>
                    <p className="text-xs text-slate-400">
                      Crawl target company domains to automatically extract team rosters and leadership
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Company Website URL / Domain
                    </label>
                    <input
                      type="text"
                      value={discoveryWebsite}
                      onChange={(e) => setDiscoveryWebsite(e.target.value)}
                      placeholder="e.g. stripe.com or https://company.com"
                      className="w-full px-3 py-2 bg-[#0b1120] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Target Volume
                    </label>
                    <select
                      value={maxEmployees}
                      onChange={(e) => setMaxEmployees(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#0b1120] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value={10}>10 Team Members</option>
                      <option value={20}>20 Team Members</option>
                      <option value={50}>50 Team Members</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => handleDiscoverEmployees()}
                      disabled={discovering || !discoveryWebsite.trim()}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                    >
                      {discovering ? (
                        <>
                          <SpinnerIcon className="w-3.5 h-3.5 text-white" />
                          <span>Crawling Domain...</span>
                        </>
                      ) : (
                        <>
                          <DiscoveryIcon className="w-3.5 h-3.5" />
                          <span>Launch Discovery</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Steps Timeline */}
                {discoverySteps.length > 0 && (
                  <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    {discoverySteps.map((step, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            step.done
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-indigo-600/30 text-indigo-300 animate-pulse'
                          }`}
                        >
                          {step.done ? <CheckIcon className="w-3 h-3 text-slate-950" /> : idx + 1}
                        </div>
                        <span className={step.done ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discovered Employees Table */}
              {discoveredEmployees.length > 0 && (
                <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl space-y-3 p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                        Discovered {discoveredEmployees.length} Contacts
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Select team members to permanently add to your lead database
                      </p>
                    </div>
                    {selectedDiscoveredIndexes.length > 0 && (
                      <button
                        onClick={handleSaveDiscoveredBatch}
                        disabled={savingBatch}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {savingBatch ? (
                          <>
                            <SpinnerIcon className="w-3.5 h-3.5 text-white" />
                            <span>Saving Leads...</span>
                          </>
                        ) : (
                          <>
                            <CheckIcon className="w-3.5 h-3.5" />
                            <span>Save Selected ({selectedDiscoveredIndexes.length})</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#0b1120]/90 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-3 px-3 w-10">
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
                              className="w-4 h-4 rounded border-slate-700 bg-[#090d16] text-indigo-600 cursor-pointer"
                            />
                          </th>
                          <th className="py-3 px-3">Full Name</th>
                          <th className="py-3 px-3">Title & Department</th>
                          <th className="py-3 px-3">Discovered Email</th>
                          <th className="py-3 px-3">Leadership Status</th>
                          <th className="py-3 px-3">Source URL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {discoveredEmployees.map((emp, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-3">
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
                                className="w-4 h-4 rounded border-slate-700 bg-[#090d16] text-indigo-600 cursor-pointer"
                              />
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-white">
                              {emp.fullName}
                            </td>
                            <td className="py-3.5 px-3 text-slate-300">
                              {emp.jobTitle || 'Team Member'}{' '}
                              {emp.department && <span className="text-slate-500">· {emp.department}</span>}
                            </td>
                            <td className="py-3.5 px-3 font-mono text-slate-200">
                              {emp.email || (
                                <span className="text-slate-500 font-sans italic text-[11px]">
                                  No email on public page
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              {emp.isDecisionMaker ? (
                                <Badge variant="decisionMaker" size="sm">
                                  Decision Maker
                                </Badge>
                              ) : (
                                <span className="text-slate-500 text-[11px]">Individual Contributor</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3">
                              {emp.sourceUrl ? (
                                <a
                                  href={emp.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-indigo-400 hover:underline truncate max-w-[140px]"
                                >
                                  <span>View Page</span>
                                  <ExternalLinkIcon className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-500">Direct Crawler</span>
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
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Saved Lead Repository
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Centralized repository of all prospect records identified across your campaigns
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedLeadIds.length > 0 && (
                    <div className="flex items-center space-x-2 animate-fade-in">
                      <span className="text-xs text-indigo-300 font-semibold bg-indigo-500/15 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                        {selectedLeadIds.length} selected
                      </span>
                      <button
                        onClick={() => setIsListModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                      >
                        <PlusIcon className="w-4 h-4" />
                        <span>Add to List</span>
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleExportCsv(peopleLeads)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <ExportIcon className="w-4 h-4" />
                    <span>Export All Saved Leads</span>
                  </button>
                </div>
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
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Target Outreach Lists
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Segmented audience campaigns for cold email sequences and multichannel sales outreach
                  </p>
                </div>
                <button
                  onClick={() => setIsListModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Create Outreach List</span>
                </button>
              </div>

              {loadingLists ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="bg-[#0f172a]/70 border border-slate-800/80 rounded-xl p-5 space-y-3">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  ))}
                </div>
              ) : savedLists.length === 0 ? (
                <EmptyState
                  title="No Outreach Lists Found"
                  description="Create target lists to group discovered decision makers and organize sales sequences."
                  actionText="Create New List"
                  onAction={() => setIsListModalOpen(true)}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {savedLists.map((list) => {
                    const isSelected = selectedList?.id === list.id;
                    return (
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
                        className={`bg-[#0f172a]/70 border rounded-2xl p-5 cursor-pointer transition-all shadow-sm ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/20 shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                            : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <h3 className="font-bold text-white text-sm tracking-tight truncate mr-2">
                            {list.name}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Badge variant="info" size="sm">
                              {list.leadCount} leads
                            </Badge>
                            <button
                              type="button"
                              title="Delete list"
                              aria-label={`Delete list ${list.name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setListToDelete(list);
                              }}
                              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        {list.description && (
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                            {list.description}
                          </p>
                        )}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{isSelected ? 'Active Segment' : 'Click to inspect'}</span>
                          <span className="text-indigo-400 font-medium">View Leads →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Selected List Lead Details */}
              {selectedList && (
                <div className="space-y-4 pt-4 border-t border-slate-800/80 animate-fade-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        Leads in "{selectedList.name}"
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {listLeads.length} leads assigned to this segment
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {listLeads.length > 0 && (
                        <button
                          onClick={() => handleExportCsv(listLeads)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/80 transition-colors"
                        >
                          <ExportIcon className="w-3.5 h-3.5" />
                          <span>Export List CSV</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setListToDelete(selectedList)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold rounded-lg border border-red-800/60 transition-colors"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        <span>Delete List</span>
                      </button>
                    </div>
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
          {activeTab === 'usage' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      Account Usage & Operational Metrics
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Real-time credit allocation and historical activity records
                    </p>
                  </div>
                  {usageStats && (
                    <Badge variant="success" size="md">
                      Active Subscription
                    </Badge>
                  )}
                </div>

                {usageStats ? (
                  <>
                    {/* Remaining Credit Allocation Bar */}
                    <div className="bg-[#0b1120] border border-slate-800/80 rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">Credits Utilization</span>
                        <span className="font-mono text-amber-400 font-bold">
                          {usageStats.remainingCredits.toLocaleString()} / {usageStats.totalCredits.toLocaleString()} Remaining
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-indigo-500 h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${Math.min(
                              100,
                              usageStats.totalCredits > 0
                                ? Math.round((usageStats.remainingCredits / usageStats.totalCredits) * 100)
                                : 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Operational Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-[#0b1120] border border-slate-800/80 p-4 rounded-xl shadow-sm">
                        <span className="text-xs text-slate-400 block font-medium">Total Searches</span>
                        <span className="text-2xl font-bold text-white mt-1.5 block tracking-tight">
                          {usageStats.totalSearched.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">AI & standard queries</span>
                      </div>

                      <div className="bg-[#0b1120] border border-slate-800/80 p-4 rounded-xl shadow-sm">
                        <span className="text-xs text-slate-400 block font-medium">Discovered Employees</span>
                        <span className="text-2xl font-bold text-indigo-400 mt-1.5 block tracking-tight">
                          {usageStats.totalDiscovered.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">From web crawls</span>
                      </div>

                      <div className="bg-[#0b1120] border border-slate-800/80 p-4 rounded-xl shadow-sm">
                        <span className="text-xs text-slate-400 block font-medium">Leads Saved</span>
                        <span className="text-2xl font-bold text-emerald-400 mt-1.5 block tracking-tight">
                          {usageStats.totalSaved.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">In lead repository</span>
                      </div>

                      <div className="bg-[#0b1120] border border-slate-800/80 p-4 rounded-xl shadow-sm">
                        <span className="text-xs text-slate-400 block font-medium">Emails Found</span>
                        <span className="text-2xl font-bold text-purple-400 mt-1.5 block tracking-tight">
                          {usageStats.totalEmailsFound.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">Identified contacts</span>
                      </div>

                      <div className="bg-[#0b1120] border border-slate-800/80 p-4 rounded-xl shadow-sm">
                        <span className="text-xs text-slate-400 block font-medium">Emails Verified</span>
                        <span className="text-2xl font-bold text-blue-400 mt-1.5 block tracking-tight">
                          {usageStats.totalEmailsVerified.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          {usageStats.totalEmailsFound > 0
                            ? `${Math.round((usageStats.totalEmailsVerified / usageStats.totalEmailsFound) * 100)}% verification rate`
                            : 'SMTP verified'}
                        </span>
                      </div>

                      <div className="bg-[#0b1120] border border-slate-800/80 p-4 rounded-xl shadow-sm">
                        <span className="text-xs text-slate-400 block font-medium">Contacts Revealed</span>
                        <span className="text-2xl font-bold text-pink-400 mt-1.5 block tracking-tight">
                          {usageStats.totalContactsRevealed.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">Unlocked phones & emails</span>
                      </div>

                      <div className="bg-[#0b1120] border border-slate-800/80 p-4 rounded-xl shadow-sm">
                        <span className="text-xs text-slate-400 block font-medium">Outreach Lists Created</span>
                        <span className="text-2xl font-bold text-teal-400 mt-1.5 block tracking-tight">
                          {usageStats.totalListsCreated.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">Targeted campaign sets</span>
                      </div>

                      <div className="bg-[#0b1120] border border-slate-800/80 p-4 rounded-xl shadow-sm">
                        <span className="text-xs text-slate-400 block font-medium">Remaining Credits</span>
                        <span className="text-2xl font-bold text-amber-400 mt-1.5 block tracking-tight">
                          {usageStats.remainingCredits.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">Ready for extraction</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Loading account metrics...
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Slide-Over Profile Drawer */}
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

      {/* Delete List Confirmation Dialog */}
      {listToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-[#0b1120] border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <TrashIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="delete-modal-title" className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Delete List
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                    "{listToDelete.name}"
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setListToDelete(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Delete this list? The list and its saved associations will be removed. The leads themselves will not be deleted.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                disabled={deletingListId === listToDelete.id}
                onClick={() => setListToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingListId === listToDelete.id}
                onClick={() => handleDeleteList(listToDelete.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {deletingListId === listToDelete.id ? (
                  <SpinnerIcon className="w-3.5 h-3.5" />
                ) : (
                  <TrashIcon className="w-3.5 h-3.5" />
                )}
                <span>{deletingListId === listToDelete.id ? 'Deleting...' : 'Delete List'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}