import React, { useRef } from 'react';
import { Workflow, Execution } from '../lib/db';
import {
  FileCode,
  Download,
  Upload,
  Save,
  Trash2,
  FolderOpen,
  History,
  Play,
  FilePlus,
  Compass
} from 'lucide-react';

interface SidebarProps {
  workflows: Workflow[];
  selectedWorkflow: Workflow | null;
  onSelectWorkflow: (workflow: Workflow) => void;
  onSaveWorkflow: () => void;
  onDeleteWorkflow: (id: string) => void;
  onCreateNewWorkflow: () => void;
  
  initialInput: string;
  setInitialInput: (val: string) => void;
  onExecute: () => void;
  isRunning: boolean;

  executionHistory: Execution[];
  selectedExecution: Execution | null;
  onSelectExecution: (exec: Execution | null) => void;

  onImportJSON: (data: any) => void;
  onExportJSON: () => void;
}

export default function Sidebar({
  workflows,
  selectedWorkflow,
  onSelectWorkflow,
  onSaveWorkflow,
  onDeleteWorkflow,
  onCreateNewWorkflow,
  initialInput,
  setInitialInput,
  onExecute,
  isRunning,
  executionHistory,
  selectedExecution,
  onSelectExecution,
  onImportJSON,
  onExportJSON
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.nodes && parsed.edges) {
          onImportJSON(parsed);
        } else {
          alert('Invalid JSON format: Must contain nodes and edges.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  return (
    <div className="w-full lg:w-96 flex flex-col gap-6 select-none">
      {/* 1. Trigger Settings Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
          <Compass className="h-5 w-5 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Execution Trigger</h2>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400">Initial Input Context</label>
          <textarea
            value={initialInput}
            onChange={(e) => setInitialInput(e.target.value)}
            rows={4}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            placeholder="e.g. Hi, my device won't charge since morning. I want to cancel and ask for a full refund."
          />
        </div>

        <button
          onClick={onExecute}
          disabled={isRunning || !initialInput.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold rounded-xl transition shadow-lg shadow-violet-900/10 active:scale-98"
        >
          <Play className="h-4 w-4" />
          {isRunning ? 'Running Workflow...' : 'Execute Flow'}
        </button>
      </div>

      {/* 2. Workflows Templates Manager */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-violet-400" />
            <h2 className="text-sm font-semibold text-zinc-200">Workflows</h2>
          </div>
          <button
            onClick={onCreateNewWorkflow}
            title="Create New Workflow"
            className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition"
          >
            <FilePlus className="h-4 w-4" />
          </button>
        </div>

        {/* Selected Workflow Title Edit */}
        {selectedWorkflow && (
          <div className="space-y-2 pb-2">
            <input
              type="text"
              value={selectedWorkflow.title}
              onChange={(e) =>
                onSelectWorkflow({ ...selectedWorkflow, title: e.target.value })
              }
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Workflow Title"
            />
            <input
              type="text"
              value={selectedWorkflow.description || ''}
              onChange={(e) =>
                onSelectWorkflow({ ...selectedWorkflow, description: e.target.value })
              }
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-[10px] text-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Description..."
            />
            
            <div className="flex gap-2 pt-1">
              <button
                onClick={onSaveWorkflow}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white text-[10px] font-medium rounded-lg transition"
              >
                <Save className="h-3.5 w-3.5" />
                Save Layout
              </button>
              <button
                onClick={() => onDeleteWorkflow(selectedWorkflow.id)}
                className="p-1.5 bg-zinc-900 hover:bg-rose-950/40 border border-zinc-800 text-zinc-400 hover:text-rose-450 rounded-lg transition"
                title="Delete Workflow"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Workflow List */}
        <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
          {workflows.map((w) => (
            <button
              key={w.id}
              onClick={() => onSelectWorkflow(w)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex justify-between items-center transition ${
                selectedWorkflow?.id === w.id
                  ? 'bg-violet-950/40 border border-violet-900/50 text-white'
                  : 'bg-zinc-900/30 hover:bg-zinc-900/80 border border-transparent text-zinc-400'
              }`}
            >
              <span className="font-medium truncate mr-2">{w.title}</span>
              <span className="text-[9px] text-zinc-650 shrink-0">
                {new Date(w.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>

        {/* Export/Import Controls */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900">
          <button
            onClick={onExportJSON}
            className="flex items-center justify-center gap-1.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-semibold rounded-lg border border-zinc-800 transition"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>
          
          <button
            onClick={handleImportClick}
            className="flex items-center justify-center gap-1.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-semibold rounded-lg border border-zinc-800 transition"
          >
            <Upload className="h-3.5 w-3.5" />
            Import JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />
        </div>
      </div>

      {/* 3. Execution History Panel */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4 flex-1 min-h-[220px] flex flex-col">
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 shrink-0">
          <History className="h-5 w-5 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Execution History</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[260px] lg:max-h-none">
          {executionHistory.length === 0 ? (
            <div className="text-center text-zinc-600 italic text-xs py-8">
              No past executions.
            </div>
          ) : (
            executionHistory.map((exec) => {
              const statusBadges = {
                running: 'bg-blue-950/40 text-blue-400 border border-blue-900/50',
                completed: 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50',
                failed: 'bg-rose-950/40 text-rose-400 border border-rose-900/50'
              };

              const isSelected = selectedExecution?.id === exec.id;

              return (
                <div
                  key={exec.id}
                  onClick={() => onSelectExecution(isSelected ? null : exec)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer text-xs space-y-1.5 ${
                    isSelected
                      ? 'bg-violet-950/30 border-violet-900/60'
                      : 'bg-zinc-900/20 hover:bg-zinc-900/60 border-zinc-800/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-zinc-300 font-mono text-[10px]">
                      {exec.id.substring(0, 14)}...
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                        statusBadges[exec.status]
                      }`}
                    >
                      {exec.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-450 line-clamp-1 italic">
                    "{exec.initialInput}"
                  </div>
                  <div className="text-[9px] text-zinc-600 flex justify-between items-center">
                    <span>{new Date(exec.startTime).toLocaleTimeString()}</span>
                    {exec.endTime && (
                      <span>
                        Duration:{' '}
                        {Math.round(
                          (new Date(exec.endTime).getTime() - new Date(exec.startTime).getTime()) / 100
                        ) / 10}
                        s
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
