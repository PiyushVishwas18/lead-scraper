'use client';

import React, { useState } from 'react';
import { SavedList } from '@/types/lead';
import { CloseIcon, PlusIcon, SavedListsIcon, CheckIcon } from '@/components/ui/Icons';

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-headline"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-[#0b1120] border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <SavedListsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-headline" className="text-sm sm:text-base font-bold text-white tracking-tight">
                Add to Outreach List
              </h3>
              <p className="text-[11px] text-slate-400">
                Assign <span className="font-semibold text-indigo-300">{selectedCount}</span> selected lead{selectedCount > 1 ? 's' : ''} to a segment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#0f172a] p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'existing'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Existing List ({lists.length})
          </button>
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'create'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            + New List
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'existing' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Choose Target Segment
              </label>
              {lists.length === 0 ? (
                <div className="p-6 text-center bg-[#0f172a] rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                  <p>No saved lists created yet.</p>
                  <button
                    type="button"
                    onClick={() => setMode('create')}
                    className="mt-2 text-indigo-400 hover:underline font-semibold"
                  >
                    Create your first list →
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {lists.map((l) => {
                    const isSelected = selectedListId === l.id;
                    return (
                      <label
                        key={l.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-sm'
                            : 'bg-[#0f172a] border-slate-800 hover:border-slate-700/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <input
                            type="radio"
                            name="listId"
                            value={l.id}
                            checked={isSelected}
                            onChange={() => setSelectedListId(l.id)}
                            className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 bg-[#0b1120] border-slate-700 cursor-pointer"
                          />
                          <div className="truncate">
                            <span className="text-xs font-semibold block text-white truncate">
                              {l.name}
                            </span>
                            {l.description && (
                              <span className="text-[11px] text-slate-400 block truncate">
                                {l.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md shrink-0 ml-2">
                          {l.leadCount} leads
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  List Name
                </label>
                <input
                  type="text"
                  required
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g. Q4 Outreach - SaaS Founders"
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="Targeting enterprise founders in US and UK"
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mode === 'existing' ? !selectedListId : !newListName.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              {mode === 'existing' ? 'Add Selected Leads' : 'Save Leads'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
