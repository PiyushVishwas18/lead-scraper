'use client';

import React, { useState } from 'react';
import { SavedList } from '@/types/lead';

interface SaveToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  lists: SavedList[];
  onSaveToList: (listId: string) => void;
  onCreateAndSave: (name: string, description?: string) => void;
  selectedCount: number;
}

export const SaveToListModal: React.FC<SaveToListModalProps> = ({
  isOpen,
  onClose,
  lists,
  onSaveToList,
  onCreateAndSave,
  selectedCount,
}) => {
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [mode, setMode] = useState<'existing' | 'create'>('existing');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'existing' && selectedListId) {
      onSaveToList(selectedListId);
    } else if (mode === 'create' && newListName.trim()) {
      onCreateAndSave(newListName.trim(), newListDesc.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 text-white shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-base font-bold text-white">Save {selectedCount} Leads to List</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'existing' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Existing List ({lists.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            + Create New List
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'existing' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Select List</label>
              {lists.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No saved lists found. Switch to Create New List.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {lists.map((l) => (
                    <label
                      key={l.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedListId === l.id
                          ? 'bg-indigo-950/40 border-indigo-500/50'
                          : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="listId"
                          value={l.id}
                          checked={selectedListId === l.id}
                          onChange={() => setSelectedListId(l.id)}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-white block">{l.name}</span>
                          {l.description && <span className="text-[11px] text-slate-400">{l.description}</span>}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                        {l.leadCount} leads
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">List Name</label>
                <input
                  type="text"
                  required
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. India SaaS CTOs"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="Target list for outreach..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mode === 'existing' ? !selectedListId : !newListName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium rounded transition-colors"
            >
              Save Leads
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
