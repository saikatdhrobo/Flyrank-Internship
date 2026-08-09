# AI Decision Flow System with React Flow + Inngest

A premium visual workflow editor and background execution engine built with Next.js, React Flow, and Inngest. This application allows you to visually build, edit, save, and execute AI-powered decision trees. 

Each node in the tree represents an AI classifier that prompts an LLM (OpenAI or Gemini) and evaluates an input context query to branch down the `YES` or `NO` path. Traversal continues step-by-step through Inngest background functions until a terminal output destination is reached.

---

## 🌟 Key Features

### 1. Interactive Flow Canvas (React Flow)
- **Node Management**: Add decision nodes and terminal output nodes on the fly.
- **Dynamic Connections**: Drag connections between nodes. Setting connections automatically maps paths. Edges linked to a node's `YES` handle are colored **Green** and `NO` handle are colored **Amber**.
- **Interactive Prompts**: Prompts can be directly updated inside decision cards on the canvas.

### 2. Reliable Workflow Traversal (Inngest)
- **Step-by-Step Execution**: Every node evaluation maps to an asynchronous Inngest step function.
- **Traverse Logic**: Evaluates the initial user query against the prompt criteria and routes down the matching connection.
- **Fail-Safe Execution**: Handled gracefully. If a node fails, it marks state as failed and logs trace errors.

### 3. Dynamic Visual State Polling
- During an active run, the canvas animates. The executing node pulses in **Blue**, traversed paths turn into thick dashed running lines, and evaluated nodes highlight in **Green (YES)** or **Amber (NO)** matching their decision.
- You can inspect past execution logs and see exactly how the decisions branched historically on the graph.

### 4. Smart Mock Mode Fallback
- No API keys? No problem. The LLM helper features a semantic-keyword analysis fallback. It executes mock branches based on query matching rules so that developers can test the entire workflow out-of-the-box.

### 5. Management Control Panel
- **JSON Import / Export**: Save, load, download, or upload entire graph layouts as JSON configs.
- **Persisted Templates**: Save customized workflows templates directly to a local database (`data/db.json`).
- **History Viewer**: Inspect past runs list with timestamps, durations, inputs, and final outcomes.

---

## 🚀 Getting Started

### 1. Setup Environment Variables
Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=your-openai-api-key-here
# OR
GEMINI_API_KEY=your-gemini-api-key-here
```
*Note: If no keys are provided, the system defaults to Smart Mock Mode automatically.*

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Next.js Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application dashboard.

### 4. Run the Inngest Dev Server
Inngest requires its local dev server to coordinate background steps and capture events.
In a new terminal window, run:
```bash
npx inngest-cli dev
# Or if you have inngest installed globally:
npx inngest dev
```
The Inngest Dev Server will launch at [http://localhost:8288](http://localhost:8288), where you can view step logs and events.

---

## 🛠️ Architecture

- **`src/lib/db.ts`**: Handles file persistence for workflow configurations and logs.
- **`src/lib/llm.ts`**: The AI classifier abstraction that wraps OpenAI SDK, Google Generative AI, or the Mock fallback.
- **`src/inngest/client.ts`**: Initiates the background event client.
- **`src/inngest/functions.ts`**: Graph traversal engine. Evaluates nodes and manages state database updates.
- **`src/app/api/inngest/route.ts`**: Serves Inngest communication routes.
- **`src/components/WorkflowCanvas.tsx`**: Renders React Flow canvas, node types, visual transitions, and controls.
- **`src/components/CustomNode.tsx`**: Defines custom visual layouts for Decision and Terminal nodes.
- **`src/components/Sidebar.tsx`**: Manages parameters, triggers, history, templates, and import/export.
- **`src/components/LogsPanel.tsx`**: Console showing chronological trace events of the execution path.
