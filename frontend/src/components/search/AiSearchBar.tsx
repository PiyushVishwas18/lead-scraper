'use client';

import React, { useState } from 'react';

interface AiSearchBarProps {
  onSearch: (prompt: string) => void;
  isLoading?: boolean;
}

export const AiSearchBar: React.FC<AiSearchBarProps> = ({ onSearch, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const suggestions = [
    'Find CTOs at SaaS companies in India',
    'Find marketing managers at companies with 50-500 employees',
    'Find founders of fintech startups in Mumbai',
    'Find HR leaders at technology companies',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSearch(prompt.trim());
    }
  };

  const handleSuggestion = (text: string) => {
    setPrompt(text);
    onSearch(text);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center space-x-2 mb-3">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400">
          AI Natural Language Search
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Find CTOs at SaaS companies in India..."
          disabled={isLoading}
          className="w-full pl-11 pr-32 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
        />

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="absolute right-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-medium text-xs rounded-md shadow-md transition-all flex items-center space-x-1.5"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Parsing...</span>
            </>
          ) : (
            <>
              <span>AI Search</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* Preset Suggestion Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">Try asking:</span>
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            onClick={() => handleSuggestion(sug)}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 border border-slate-700 px-2.5 py-1 rounded-full transition-colors text-left"
          >
            "{sug}"
          </button>
        ))}
      </div>
    </div>
  );
};
