'use client';

import React, { useState } from 'react';
import { SparklesIcon, SpinnerIcon, SearchIcon } from '@/components/ui/Icons';

interface AiSearchBarProps {
  onSearch: (prompt: string) => void;
  isLoading?: boolean;
}

export const AiSearchBar: React.FC<AiSearchBarProps> = ({ onSearch, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const suggestions = [
    'Find CTOs at SaaS companies in India',
    'Marketing directors at fintech startups with 50-500 employees',
    'Founders and CEOs in London',
    'Head of Sales at B2B software companies',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSearch(prompt.trim());
    }
  };

  const handleSuggestion = (text: string) => {
    setPrompt(text);
    onSearch(text);
  };

  return (
    <div className="bg-[#0f172a]/70 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Header with active AI indicator */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <SparklesIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Natural Language Prospecting
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>AI Parsing Engine Active</span>
        </div>
      </div>

      {/* Command Bar Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
          <SearchIcon className="w-4 h-4 text-slate-400" />
        </div>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Find VP of Engineering at series A software companies in London..."
          disabled={isLoading}
          className="w-full pl-11 pr-32 py-3 bg-[#0b1120] border border-slate-700/80 hover:border-slate-600 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs sm:text-sm shadow-inner transition-all disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="absolute right-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg shadow-sm transition-all flex items-center space-x-1.5"
        >
          {isLoading ? (
            <>
              <SpinnerIcon className="w-3.5 h-3.5 text-white" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>Execute</span>
              <span className="opacity-70">↵</span>
            </>
          )}
        </button>
      </form>

      {/* Preset Suggestions */}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-[11px] font-medium text-slate-400">Suggestions:</span>
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSuggestion(sug)}
            className="text-[11px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 border border-slate-700/60 hover:border-indigo-500/40 px-2.5 py-1 rounded-full transition-all text-left"
          >
            "{sug}"
          </button>
        ))}
      </div>
    </div>
  );
};
