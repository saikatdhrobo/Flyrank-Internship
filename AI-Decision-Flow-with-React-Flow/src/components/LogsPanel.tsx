import React, { useEffect, useRef } from 'react';
import { ExecutionLog } from '../lib/db';
import { Terminal, RefreshCw, Cpu } from 'lucide-react';

interface LogsPanelProps {
  logs: ExecutionLog[];
  status: 'idle' | 'running' | 'completed' | 'failed';
  initialInput?: string;
}

export default function LogsPanel({ logs, status, initialInput }: LogsPanelProps) {
  const containerEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const logColors = {
    info: 'text-zinc-300 border-zinc-800',
    success: 'text-emerald-400 bg-emerald-950/20 border-emerald-900/50',
    warning: 'text-amber-400 bg-amber-950/20 border-amber-900/50',
    error: 'text-rose-400 bg-rose-950/20 border-rose-900/50 border-2 animate-pulse',
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Terminal className="h-4.5 w-4.5 text-violet-400" />
          <h2 className="text-sm font-semibold text-zinc-200">Execution Logs</h2>
        </div>
        <div className="flex items-center gap-2">
          {status === 'running' && (
            <div className="flex items-center gap-1.5 text-xs text-blue-400">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Running...</span>
            </div>
          )}
          {status === 'completed' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-900">
              Success
            </span>
          )}
          {status === 'failed' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-950 text-rose-400 border border-rose-900">
              Failed
            </span>
          )}
          {status === 'idle' && (
            <span className="text-xs text-zinc-500">Awaiting trigger</span>
          )}
        </div>
      </div>

      {/* Input query summary */}
      {initialInput && (
        <div className="px-4 py-2 bg-zinc-900/30 border-b border-zinc-900 text-xs text-zinc-400 flex gap-1.5 items-start">
          <Cpu className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-zinc-300">Input Context:</span>{' '}
            <span className="italic">"{initialInput}"</span>
          </div>
        </div>
      )}

      {/* Logs Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[300px] md:max-h-none min-h-[150px] font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 italic py-8">
            <p>No executions started yet.</p>
            <p className="text-[10px] mt-1">Enter a test query and click "Run Workflow" to start.</p>
          </div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border flex gap-2 items-start transition-all duration-300 ${
                logColors[log.type] || logColors.info
              }`}
            >
              <span className="text-zinc-500 select-none font-semibold shrink-0">[{log.timestamp}]</span>
              <div className="flex-1">
                {log.nodeLabel && (
                  <span className="font-bold text-violet-300 mr-1 bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-900/35">
                    {log.nodeLabel}
                  </span>
                )}
                <span>{log.message}</span>
              </div>
            </div>
          ))
        )}
        <div ref={containerEndRef} />
      </div>
    </div>
  );
}
