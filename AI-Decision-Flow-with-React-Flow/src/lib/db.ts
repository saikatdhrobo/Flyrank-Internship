import fs from 'fs';
import path from 'path';

// Define TS Interfaces
export interface WorkflowNode {
  id: string;
  type: 'decision' | 'terminal' | 'start';
  position: { x: number; y: number };
  data: {
    label: string;
    prompt: string;
    description?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: 'yes' | 'no' | string; // 'yes' or 'no' for decisions
  type?: string;
  animated?: boolean;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  updatedAt: string;
}

export interface ExecutionLog {
  timestamp: string;
  nodeId?: string;
  nodeLabel?: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Execution {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  initialInput: string;
  currentNodeId: string | null;
  visitedNodes: string[];
  decisions: Record<string, 'YES' | 'NO'>;
  logs: ExecutionLog[];
  startTime: string;
  endTime?: string;
  error?: string;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

interface Schema {
  workflows: Workflow[];
  executions: Execution[];
}

// Default Seed Data
const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'customer-support-router',
    title: 'AI Customer Support Router',
    description: 'Classifies customer messages and routes them to Refund, General Support, Sales, or General inquiries.',
    nodes: [
      {
        id: 'start-node',
        type: 'decision',
        position: { x: 250, y: 50 },
        data: {
          label: 'Is support request?',
          prompt: 'Is this message asking for technical support, customer support, or help with their account?',
          description: 'Checks if the user needs support help.'
        }
      },
      {
        id: 'refund-check',
        type: 'decision',
        position: { x: 50, y: 220 },
        data: {
          label: 'Is refund request?',
          prompt: 'Is the user requesting a financial refund, money back, billing adjustment, or cancelling a paid subscription with a refund?',
          description: 'Checks if this is related to payments/refunds.'
        }
      },
      {
        id: 'sales-check',
        type: 'decision',
        position: { x: 450, y: 220 },
        data: {
          label: 'Is sales inquiry?',
          prompt: 'Is the user asking about pricing, demo requests, purchasing licenses, or business partnership deals?',
          description: 'Checks if this is sales or pricing related.'
        }
      },
      {
        id: 'refund-queue',
        type: 'terminal',
        position: { x: -80, y: 400 },
        data: {
          label: 'Refund & Billing Queue',
          prompt: '',
          description: 'Routes to the Billing team.'
        }
      },
      {
        id: 'support-queue',
        type: 'terminal',
        position: { x: 180, y: 400 },
        data: {
          label: 'Technical Support Queue',
          prompt: '',
          description: 'Routes to general tech support.'
        }
      },
      {
        id: 'sales-queue',
        type: 'terminal',
        position: { x: 380, y: 400 },
        data: {
          label: 'Sales Representative Queue',
          prompt: '',
          description: 'Routes to sales reps.'
        }
      },
      {
        id: 'general-queue',
        type: 'terminal',
        position: { x: 620, y: 400 },
        data: {
          label: 'General Inquiries Queue',
          prompt: '',
          description: 'Routes to info@ company mailbox.'
        }
      }
    ],
    edges: [
      {
        id: 'e1',
        source: 'start-node',
        target: 'refund-check',
        sourceHandle: 'yes',
        type: 'smoothstep'
      },
      {
        id: 'e2',
        source: 'start-node',
        target: 'sales-check',
        sourceHandle: 'no',
        type: 'smoothstep'
      },
      {
        id: 'e3',
        source: 'refund-check',
        target: 'refund-queue',
        sourceHandle: 'yes',
        type: 'smoothstep'
      },
      {
        id: 'e4',
        source: 'refund-check',
        target: 'support-queue',
        sourceHandle: 'no',
        type: 'smoothstep'
      },
      {
        id: 'e5',
        source: 'sales-check',
        target: 'sales-queue',
        sourceHandle: 'yes',
        type: 'smoothstep'
      },
      {
        id: 'e6',
        source: 'sales-check',
        target: 'general-queue',
        sourceHandle: 'no',
        type: 'smoothstep'
      }
    ],
    updatedAt: new Date().toISOString()
  }
];

function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const defaultData: Schema = {
      workflows: DEFAULT_WORKFLOWS,
      executions: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

export function readDb(): Schema {
  initDb();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data) as Schema;
  } catch (error) {
    console.error('Error reading database file, resetting database.', error);
    const defaultData: Schema = {
      workflows: DEFAULT_WORKFLOWS,
      executions: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
}

export function writeDb(data: Schema) {
  initDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Workflows CRUD Helper Functions
export const workflowsDb = {
  list: (): Workflow[] => {
    return readDb().workflows;
  },
  get: (id: string): Workflow | undefined => {
    return readDb().workflows.find((w) => w.id === id);
  },
  save: (workflow: Workflow): Workflow => {
    const db = readDb();
    const index = db.workflows.findIndex((w) => w.id === workflow.id);
    const updatedWorkflow = { ...workflow, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      db.workflows[index] = updatedWorkflow;
    } else {
      db.workflows.push(updatedWorkflow);
    }
    writeDb(db);
    return updatedWorkflow;
  },
  delete: (id: string): boolean => {
    const db = readDb();
    const initialLength = db.workflows.length;
    db.workflows = db.workflows.filter((w) => w.id !== id);
    writeDb(db);
    return db.workflows.length < initialLength;
  }
};

// Executions CRUD Helper Functions
export const executionsDb = {
  list: (): Execution[] => {
    return readDb().executions;
  },
  listForWorkflow: (workflowId: string): Execution[] => {
    return readDb().executions.filter((e) => e.workflowId === workflowId);
  },
  get: (id: string): Execution | undefined => {
    return readDb().executions.find((e) => e.id === id);
  },
  save: (execution: Execution): Execution => {
    const db = readDb();
    const index = db.executions.findIndex((e) => e.id === execution.id);
    if (index >= 0) {
      db.executions[index] = execution;
    } else {
      db.executions.push(execution);
    }
    writeDb(db);
    return execution;
  },
  addLog: (executionId: string, log: Omit<ExecutionLog, 'timestamp'>): Execution | undefined => {
    const db = readDb();
    const execution = db.executions.find((e) => e.id === executionId);
    if (execution) {
      const fullLog: ExecutionLog = {
        ...log,
        timestamp: new Date().toLocaleTimeString()
      };
      execution.logs.push(fullLog);
      writeDb(db);
    }
    return execution;
  }
};
