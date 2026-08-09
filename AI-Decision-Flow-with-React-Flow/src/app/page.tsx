'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNodesState, useEdgesState, Node, Edge } from '@xyflow/react';
import WorkflowCanvas from '../components/WorkflowCanvas';
import Sidebar from '../components/Sidebar';
import LogsPanel from '../components/LogsPanel';
import { Workflow, Execution, ExecutionLog } from '../lib/db';
import { Cpu, Info } from 'lucide-react';

export default function Home() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  
  // React Flow state hook manager
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Triggering & Running Execution State
  const [initialInput, setInitialInput] = useState(
    'Hi support, I bought a basic subscription license yesterday but my account has not been activated yet. I want a refund!'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [currentLogs, setCurrentLogs] = useState<ExecutionLog[]>([]);
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');

  // Execution History state list
  const [executionHistory, setExecutionHistory] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  // 1. Fetch workflows list on load
  const loadWorkflows = async (selectId?: string) => {
    try {
      const res = await fetch('/api/workflows');
      const data = await res.json();
      setWorkflows(data);

      if (data.length > 0) {
        // If an ID is provided, choose it. Otherwise choose the first or default
        const active = selectId 
          ? data.find((w: Workflow) => w.id === selectId) 
          : data[0];
        
        if (active) {
          selectWorkflowConfig(active);
        }
      }
    } catch (err) {
      console.error('Failed to load workflows:', err);
    }
  };

  // 2. Fetch executions history list
  const loadExecutions = async (workflowId: string) => {
    try {
      const res = await fetch(`/api/executions?workflowId=${workflowId}`);
      const data = await res.json();
      setExecutionHistory(data);
    } catch (err) {
      console.error('Failed to load execution history:', err);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  // When a new workflow is selected
  const selectWorkflowConfig = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setSelectedExecution(null);
    setCurrentLogs([]);
    setExecutionStatus('idle');
    setActiveExecutionId(null);
    
    // Set nodes and edges
    setNodes(workflow.nodes || []);
    setEdges(workflow.edges || []);

    // Load execution history
    loadExecutions(workflow.id);
  };

  // Node editing handlers
  const handleNodeDataChange = useCallback(
    (nodeId: string, field: string, value: string) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                [field]: value
              }
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // 3. Save current canvas nodes & edges to the database
  const handleSaveWorkflow = async () => {
    if (!selectedWorkflow) return;
    
    const updatedWorkflow: Workflow = {
      ...selectedWorkflow,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type as any,
        position: n.position,
        data: {
          label: n.data.label as string,
          prompt: n.data.prompt as string,
          description: n.data.description as string
        }
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle as any,
        type: e.type,
        animated: e.animated
      }))
    };

    try {
      const res = await fetch(`/api/workflows/${selectedWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWorkflow)
      });
      if (res.ok) {
        const saved = await res.json();
        // Refresh list
        loadWorkflows(saved.id);
        alert('Workflow layout saved successfully.');
      } else {
        const error = await res.json();
        alert(`Failed to save: ${error.error}`);
      }
    } catch (err) {
      console.error('Error saving workflow:', err);
    }
  };

  // 4. Create a new empty workflow template
  const handleCreateNewWorkflow = () => {
    const id = `workflow-${Date.now()}`;
    const newWorkflow: Workflow = {
      id,
      title: 'New AI Router Workflow',
      description: 'Define your custom decision logic here.',
      nodes: [
        {
          id: 'start-node',
          type: 'decision',
          position: { x: 250, y: 80 },
          data: {
            label: 'Start Routing Check',
            prompt: 'Is this message requesting assistance?',
            description: 'Main router entry'
          }
        }
      ],
      edges: [],
      updatedAt: new Date().toISOString()
    };
    
    setSelectedWorkflow(newWorkflow);
    setNodes(newWorkflow.nodes);
    setEdges([]);
    setSelectedExecution(null);
    setCurrentLogs([]);
    setExecutionStatus('idle');
    setActiveExecutionId(null);
    setExecutionHistory([]);
  };

  // 5. Delete specific workflow
  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      const res = await fetch(`/api/workflows/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadWorkflows();
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  };

  // 6. JSON Export
  const handleExportJSON = () => {
    if (!selectedWorkflow) return;
    
    const fileData = {
      title: selectedWorkflow.title,
      description: selectedWorkflow.description,
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: {
          label: n.data.label,
          prompt: n.data.prompt,
          description: n.data.description
        }
      })),
      edges: edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        type: e.type
      }))
    };

    const blob = new Blob([JSON.stringify(fileData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedWorkflow.title.toLowerCase().replace(/\s+/g, '-')}-config.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 7. JSON Import
  const handleImportJSON = (importedData: any) => {
    if (!selectedWorkflow) return;
    
    // Inject label and prompt structure safely
    const importedNodes = (importedData.nodes || []).map((n: any) => ({
      id: n.id,
      type: n.type || 'decision',
      position: n.position || { x: 100, y: 100 },
      data: {
        label: n.data?.label || 'Node',
        prompt: n.data?.prompt || '',
        description: n.data?.description || ''
      }
    }));

    const importedEdges = (importedData.edges || []).map((e: any) => {
      const isYes = e.sourceHandle === 'yes';
      return {
        id: e.id || `edge-${e.source}-${e.target}-${e.sourceHandle}`,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || 'yes',
        type: e.type || 'smoothstep',
        style: {
          stroke: isYes ? '#10b981' : '#f59e0b',
          strokeWidth: 3
        }
      };
    });

    setNodes(importedNodes);
    setEdges(importedEdges);
    alert('Workflow graph imported successfully. Save template to persist changes.');
  };

  // 8. Trigger Background Execution (Inngest)
  const handleExecuteWorkflow = async () => {
    if (!selectedWorkflow) return;
    
    // Clean canvas visual run status
    setNodes((nds) => nds.map(n => ({ ...n, data: { ...n.data, status: 'idle' } })));
    setEdges((eds) => eds.map(e => ({ ...e, animated: false })));
    
    setIsRunning(true);
    setExecutionStatus('running');
    setCurrentLogs([]);
    setSelectedExecution(null);

    try {
      // First save current layout to verify we run the latest changes
      const updatedWorkflow: Workflow = {
        ...selectedWorkflow,
        nodes: nodes.map(n => ({
          id: n.id,
          type: n.type as any,
          position: n.position,
          data: {
            label: n.data.label as string,
            prompt: n.data.prompt as string,
            description: n.data.description as string
          }
        })),
        edges: edges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle as any,
          type: e.type
        }))
      };

      await fetch(`/api/workflows/${selectedWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWorkflow)
      });

      const executeRes = await fetch(`/api/workflows/${selectedWorkflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialInput })
      });
      
      const executeData = await executeRes.json();
      if (executeData.executionId) {
        setActiveExecutionId(executeData.executionId);
      } else {
        alert(`Failed to trigger run: ${executeData.error}`);
        setIsRunning(false);
        setExecutionStatus('failed');
      }
    } catch (err) {
      console.error('Trigger execution error:', err);
      setIsRunning(false);
      setExecutionStatus('failed');
    }
  };

  // 9. Sync canvas nodes and edges style dynamically during running/past executions
  const updateVisualExecutionStates = useCallback((exec: Execution) => {
    // Highlight nodes based on their visited path
    setNodes((nds) =>
      nds.map((node) => {
        let nodeStatus: 'idle' | 'running' | 'completed' | 'failed' | 'visited-yes' | 'visited-no' = 'idle';

        if (exec.currentNodeId === node.id && exec.status === 'running') {
          nodeStatus = 'running';
        } else if (exec.visitedNodes.includes(node.id)) {
          if (node.type === 'terminal') {
            nodeStatus = exec.status === 'failed' && exec.currentNodeId === node.id ? 'failed' : 'completed';
          } else {
            // Find decision direction
            const nodeDecision = exec.decisions[node.id];
            if (nodeDecision === 'YES') {
              nodeStatus = 'visited-yes';
            } else if (nodeDecision === 'NO') {
              nodeStatus = 'visited-no';
            } else {
              nodeStatus = 'running';
            }
          }
        } else if (exec.status === 'failed' && exec.currentNodeId === node.id) {
          nodeStatus = 'failed';
        }

        return {
          ...node,
          data: {
            ...node.data,
            status: nodeStatus
          }
        };
      })
    );

    // Animate active traversed edges
    setEdges((eds) =>
      eds.map((edge) => {
        const sourceDecision = exec.decisions[edge.source];
        const isTraversed = 
          sourceDecision && 
          exec.visitedNodes.includes(edge.source) && 
          edge.sourceHandle === sourceDecision.toLowerCase();
          
        return {
          ...edge,
          animated: !!isTraversed,
          style: {
            ...edge.style,
            stroke: isTraversed 
              ? (edge.sourceHandle === 'yes' ? '#10b981' : '#f59e0b') 
              : '#3f3f46', // dim down inactive edges
            strokeWidth: isTraversed ? 4 : 2,
            opacity: isTraversed ? 1.0 : 0.25
          }
        };
      })
    );
  }, [setNodes, setEdges]);

  // 10. Polling current active execution
  useEffect(() => {
    if (!activeExecutionId) return;

    let pollInterval: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await fetch(`/api/executions/${activeExecutionId}`);
        if (!res.ok) return;

        const execData: Execution = await res.json();
        setCurrentLogs(execData.logs || []);
        setExecutionStatus(execData.status);
        
        // Draw real-time execution animation lines
        updateVisualExecutionStates(execData);

        if (execData.status !== 'running') {
          // Finished execution
          setIsRunning(false);
          setActiveExecutionId(null);
          // Reload workflow logs and executions history list
          if (selectedWorkflow) {
            loadExecutions(selectedWorkflow.id);
          }
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling execution logs failed:', err);
      }
    };

    poll(); // Run first
    pollInterval = setInterval(poll, 1000);

    return () => clearInterval(pollInterval);
  }, [activeExecutionId, updateVisualExecutionStates, selectedWorkflow]);

  // 11. Handle selection of execution history
  const handleSelectExecution = (exec: Execution | null) => {
    setSelectedExecution(exec);
    if (exec) {
      setCurrentLogs(exec.logs || []);
      setExecutionStatus(exec.status);
      updateVisualExecutionStates(exec);
    } else {
      // Revert back to idle template nodes style
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            status: 'idle'
          }
        }))
      );
      setEdges((eds) =>
        eds.map((e) => {
          const isYes = e.sourceHandle === 'yes';
          return {
            ...e,
            animated: false,
            style: {
              ...e.style,
              stroke: isYes ? '#10b981' : '#f59e0b',
              strokeWidth: 3,
              opacity: 1.0
            }
          };
        })
      );
      setCurrentLogs([]);
      setExecutionStatus('idle');
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 md:p-8 gap-6">
      {/* Premium Dashboard Title Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-violet-900/20 text-white">
            <Cpu className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              AI Decision Flow Canvas
              <span className="text-[10px] tracking-widest font-mono font-bold uppercase bg-violet-950/70 border border-violet-850 px-2 py-0.5 rounded-full text-violet-300">
                Next.js & Inngest
              </span>
            </h1>
            <p className="text-xs text-zinc-450 mt-0.5">
              Build, edit, and traverse branching decision trees using visual nodes and LLM classification.
            </p>
          </div>
        </div>

        {/* API Warning/Status info banner */}
        <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-400">
          <Info className="h-4 w-4 text-violet-400 shrink-0" />
          <span>No keys set? System runs in smart **Mock Mode** automatically.</span>
        </div>
      </header>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Left Control Panel / Sidebar */}
        <Sidebar
          workflows={workflows}
          selectedWorkflow={selectedWorkflow}
          onSelectWorkflow={selectWorkflowConfig}
          onSaveWorkflow={handleSaveWorkflow}
          onDeleteWorkflow={handleDeleteWorkflow}
          onCreateNewWorkflow={handleCreateNewWorkflow}
          
          initialInput={initialInput}
          setInitialInput={setInitialInput}
          onExecute={handleExecuteWorkflow}
          isRunning={isRunning}

          executionHistory={executionHistory}
          selectedExecution={selectedExecution}
          onSelectExecution={handleSelectExecution}

          onImportJSON={handleImportJSON}
          onExportJSON={handleExportJSON}
        />

        {/* Center Canvas & Logs Viewport */}
        <div className="flex-1 flex flex-col gap-6 min-h-[450px] lg:min-h-0">
          {/* React Flow Editor */}
          <div className="flex-1 min-h-[300px] lg:min-h-0">
            <WorkflowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              setNodes={setNodes}
              setEdges={setEdges}
              onNodeDataChange={handleNodeDataChange}
              onExecute={handleExecuteWorkflow}
              isRunning={isRunning}
              selectedNodeId={selectedNodeId}
              setSelectedNodeId={setSelectedNodeId}
            />
          </div>

          {/* Bottom Execution Logs Console */}
          <div className="h-72 shrink-0 lg:h-80">
            <LogsPanel
              logs={currentLogs}
              status={executionStatus}
              initialInput={selectedExecution?.initialInput || (isRunning ? initialInput : undefined)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
