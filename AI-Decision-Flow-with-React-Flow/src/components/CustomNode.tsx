import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { HelpCircle, Terminal, Play, CheckCircle, AlertTriangle } from 'lucide-react';

interface CustomNodeProps {
  id: string;
  data: {
    label: string;
    prompt: string;
    description?: string;
    status?: 'idle' | 'running' | 'completed' | 'failed' | 'visited-yes' | 'visited-no';
    onChange?: (id: string, field: string, value: string) => void;
  };
  selected?: boolean;
}

export function DecisionNode({ id, data, selected }: CustomNodeProps) {
  const statusStyles = {
    idle: 'border-zinc-700 bg-zinc-900/90 text-zinc-100 shadow-zinc-950/50',
    running: 'border-blue-500 bg-blue-950/40 text-blue-100 shadow-blue-500/20 animate-pulse border-2',
    'visited-yes': 'border-emerald-500 bg-emerald-950/30 text-emerald-100 shadow-emerald-500/10 border-2',
    'visited-no': 'border-amber-500 bg-amber-950/30 text-amber-100 shadow-amber-500/10 border-2',
    completed: 'border-zinc-500 bg-zinc-900/90 text-zinc-100 shadow-zinc-950/50',
    failed: 'border-rose-500 bg-rose-950/30 text-rose-100 shadow-rose-500/20 border-2',
  };

  const currentStatus = data.status || 'idle';

  return (
    <div
      className={`relative w-72 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 ${
        statusStyles[currentStatus]
      } ${selected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-black' : ''}`}
    >
      {/* Top Handle - Input */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-zinc-600 border border-zinc-900 rounded-full"
      />

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-3">
        <HelpCircle className={`h-5 w-5 ${currentStatus === 'running' ? 'text-blue-400 animate-spin' : 'text-violet-400'}`} />
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={data.label}
            onChange={(e) => data.onChange?.(id, 'label', e.target.value)}
            className="w-full bg-transparent text-sm font-semibold border-none focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-1 text-white truncate"
            placeholder="Node Label"
          />
        </div>
        {/* Status Indicator */}
        <span className="flex h-2 w-2 relative">
          {currentStatus === 'running' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              currentStatus === 'running'
                ? 'bg-blue-400'
                : currentStatus === 'visited-yes'
                ? 'bg-emerald-400'
                : currentStatus === 'visited-no'
                ? 'bg-amber-400'
                : currentStatus === 'failed'
                ? 'bg-rose-400'
                : 'bg-zinc-600'
            }`}
          ></span>
        </span>
      </div>

      {/* Node Prompt Text Area */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">AI Decision Criteria</label>
        <textarea
          value={data.prompt}
          rows={3}
          onChange={(e) => data.onChange?.(id, 'prompt', e.target.value)}
          className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none font-sans"
          placeholder="e.g. Is this a support query?"
        />
      </div>

      {/* Node Description Input */}
      <div className="mt-2">
        <input
          type="text"
          value={data.description || ''}
          onChange={(e) => data.onChange?.(id, 'description', e.target.value)}
          className="w-full bg-transparent text-[10px] text-zinc-500 border-none focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-1"
          placeholder="Add short description..."
        />
      </div>

      {/* Outputs Handles - YES (left) and NO (right) */}
      <div className="flex justify-between items-center mt-4 pt-2 border-t border-zinc-800 text-[10px] font-semibold text-zinc-400">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>YES</span>
        </div>
        <div className="flex items-center gap-1">
          <span>NO</span>
          <span className="h-2 w-2 rounded-full bg-amber-500"></span>
        </div>
      </div>

      {/* YES Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: '25%' }}
        className="!h-3 !w-3 !bg-emerald-500 border border-zinc-900 rounded-full hover:scale-125 transition-transform"
      />

      {/* NO Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: '75%' }}
        className="!h-3 !w-3 !bg-amber-500 border border-zinc-900 rounded-full hover:scale-125 transition-transform"
      />
    </div>
  );
}

export function TerminalNode({ id, data, selected }: CustomNodeProps) {
  const statusStyles = {
    idle: 'border-zinc-800 bg-zinc-950/90 text-zinc-400 shadow-zinc-950/80',
    running: 'border-indigo-500 bg-indigo-950/30 text-indigo-200 shadow-indigo-500/20 animate-pulse border-2',
    'visited-yes': 'border-emerald-500 bg-emerald-950/30 text-emerald-100 shadow-emerald-500/10 border-2',
    'visited-no': 'border-emerald-500 bg-emerald-950/30 text-emerald-100 shadow-emerald-500/10 border-2',
    completed: 'border-emerald-500 bg-emerald-950/30 text-emerald-100 shadow-emerald-500/10 border-2',
    failed: 'border-rose-500 bg-rose-950/30 text-rose-100 shadow-rose-500/20 border-2',
  };

  const currentStatus = data.status || 'idle';
  const isVisited = currentStatus === 'completed' || currentStatus === 'visited-yes' || currentStatus === 'visited-no';

  return (
    <div
      className={`relative w-64 rounded-xl border p-3.5 shadow-xl backdrop-blur-md transition-all duration-300 ${
        statusStyles[currentStatus]
      } ${selected ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-black' : ''}`}
    >
      {/* Top Handle - Input */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-zinc-600 border border-zinc-900 rounded-full"
      />

      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isVisited ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-900 text-zinc-500'}`}>
          <Terminal className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Terminal Output</div>
          <input
            type="text"
            value={data.label}
            onChange={(e) => data.onChange?.(id, 'label', e.target.value)}
            className="w-full bg-transparent text-sm font-semibold border-none focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-1 text-white truncate"
            placeholder="Queue Name"
          />
        </div>
        {isVisited && (
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
        )}
      </div>
    </div>
  );
}
