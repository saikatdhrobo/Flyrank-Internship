import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DecisionNode, TerminalNode } from './CustomNode';
import { PlusCircle, Play, Trash2 } from 'lucide-react';

// Register node types
const nodeTypes = {
  decision: DecisionNode,
  terminal: TerminalNode
};

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodeDataChange: (id: string, field: string, value: string) => void;
  onExecute: () => void;
  isRunning: boolean;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

export default function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setNodes,
  setEdges,
  onNodeDataChange,
  onExecute,
  isRunning,
  selectedNodeId,
  setSelectedNodeId
}: WorkflowCanvasProps) {

  // Add customized nodes with event handlers injected
  const nodesWithHandlers = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onChange: onNodeDataChange
      }
    }));
  }, [nodes, onNodeDataChange]);

  // Handle linking edges and setting custom styled paths
  const onConnect = useCallback(
    (connection: Connection) => {
      const isYes = connection.sourceHandle === 'yes';
      const edgeId = `edge-${connection.source}-${connection.target}-${connection.sourceHandle}`;
      
      const newEdge: Edge = {
        id: edgeId,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        type: 'smoothstep',
        animated: false,
        style: {
          stroke: isYes ? '#10b981' : '#f59e0b', // Green for YES, Amber for NO
          strokeWidth: 3,
        },
        data: {
          path: isYes ? 'YES' : 'NO'
        }
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Add new Decision Node
  const addDecisionNode = useCallback(() => {
    const id = `node-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'decision',
      position: { x: 200 + Math.random() * 100, y: 150 + Math.random() * 100 },
      data: {
        label: 'New AI Question',
        prompt: 'Does the user message contain...?',
        description: 'AI decision check description',
        status: 'idle'
      }
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  // Add new Terminal Node
  const addTerminalNode = useCallback(() => {
    const id = `node-${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'terminal',
      position: { x: 200 + Math.random() * 100, y: 300 + Math.random() * 100 },
      data: {
        label: 'Final Routing Destination',
        prompt: '',
        description: 'End target description',
        status: 'idle'
      }
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  // Selection change
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length > 0) {
        setSelectedNodeId(selectedNodes[0].id);
      } else {
        setSelectedNodeId(null);
      }
    },
    [setSelectedNodeId]
  );

  // Delete Selected Node or Edge
  const deleteSelected = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges, setSelectedNodeId]);

  return (
    <div className="w-full h-full relative bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        className="text-white"
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background
          color="#27272a"
          gap={18}
          size={1.5}
          variant={BackgroundVariant.Dots}
        />
        <Controls className="!bg-zinc-900 !border-zinc-800 !text-white !fill-white [&>button]:!bg-zinc-900 [&>button]:!border-zinc-800 [&>button:hover]:!bg-zinc-800 [&>button]:!text-white [&>svg]:!fill-white" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'terminal') return '#4f46e5';
            return '#8b5cf6';
          }}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="!bg-zinc-900/90 !border-zinc-800 rounded-lg overflow-hidden shadow-lg hidden md:block"
        />

        {/* Canvas Toolbar Panel */}
        <Panel position="top-left" className="flex flex-wrap gap-2.5 bg-zinc-900/80 backdrop-blur-md p-2 rounded-xl border border-zinc-800 shadow-xl">
          <button
            onClick={addDecisionNode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition shadow-md shadow-violet-900/20"
          >
            <PlusCircle className="h-4 w-4" />
            Decision Node
          </button>
          
          <button
            onClick={addTerminalNode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-md shadow-indigo-900/20"
          >
            <PlusCircle className="h-4 w-4" />
            Terminal Node
          </button>

          {selectedNodeId && (
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600/90 hover:bg-rose-500 text-white rounded-lg transition shadow-md"
            >
              <Trash2 className="h-4 w-4" />
              Delete Node
            </button>
          )}
        </Panel>

        {/* Execute Button Overlay */}
        <Panel position="top-right">
          <button
            onClick={onExecute}
            disabled={isRunning}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-lg text-sm transition ${
              isRunning
                ? 'bg-blue-600/50 cursor-not-allowed text-zinc-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-105 active:scale-95 shadow-emerald-900/20'
            }`}
          >
            <Play className={`h-4.5 w-4.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Executing...' : 'Run Workflow'}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
