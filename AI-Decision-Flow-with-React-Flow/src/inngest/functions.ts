import { inngest } from './client';
import { executionsDb, workflowsDb } from '../lib/db';
import { evaluateDecision } from '../lib/llm';

export const executeWorkflow = inngest.createFunction(
  {
    id: 'execute-workflow-function',
    name: 'Execute AI Decision Workflow',
    triggers: [{ event: 'workflow.execute' }],
  },
  async ({ event, step }) => {
    const { executionId, workflowId, initialInput } = event.data;

    // Helper to log message in DB & local console
    const logExecution = async (
      message: string,
      type: 'info' | 'success' | 'warning' | 'error',
      nodeId?: string,
      nodeLabel?: string
    ) => {
      console.log(`[EXECUTION][${executionId}] ${message}`);
      executionsDb.addLog(executionId, {
        message,
        type,
        nodeId,
        nodeLabel,
      });
    };

    try {
      await logExecution(`Starting workflow execution for input: "${initialInput}"`, 'info');

      // 1. Fetch current execution & workflow configuration
      const execution = executionsDb.get(executionId);
      const workflow = workflowsDb.get(workflowId);

      if (!execution || !workflow) {
        throw new Error(`Workflow (${workflowId}) or Execution (${executionId}) not found.`);
      }

      // 2. Identify start node
      // Look for a node of type 'start' or 'decision' with no incoming edges, or fall back to 'start-node' or first node
      const nodes = workflow.nodes;
      const edges = workflow.edges;

      let startNode = nodes.find(n => n.id === 'start-node');
      if (!startNode) {
        // Find a decision node with no incoming edges
        const incomingTargets = new Set(edges.map(e => e.target));
        startNode = nodes.find(n => n.type === 'decision' && !incomingTargets.has(n.id));
      }
      if (!startNode) {
        // Fallback to first decision node
        startNode = nodes.find(n => n.type === 'decision') || nodes[0];
      }

      if (!startNode) {
        throw new Error('No valid nodes found in the workflow to start from.');
      }

      let currentNodeId: string | null = startNode.id;
      const visitedNodes: string[] = [];
      const decisions: Record<string, 'YES' | 'NO'> = {};

      await logExecution(`Identified start node: "${startNode.data.label}" (${startNode.id})`, 'info', startNode.id, startNode.data.label);

      // Loop to traverse the workflow graph
      while (currentNodeId) {
        const currentNode = nodes.find(n => n.id === currentNodeId);
        if (!currentNode) {
          await logExecution(`Node with ID "${currentNodeId}" not found in graph. Ending execution.`, 'error');
          break;
        }

        visitedNodes.push(currentNodeId);

        // Update the execution record state in DB
        const currentExec = executionsDb.get(executionId)!;
        currentExec.currentNodeId = currentNodeId;
        currentExec.visitedNodes = [...visitedNodes];
        executionsDb.save(currentExec);

        if (currentNode.type === 'terminal') {
          await logExecution(
            `Reached Terminal Node: "${currentNode.data.label}"`,
            'success',
            currentNode.id,
            currentNode.data.label
          );
          
          // Finalize terminal execution
          const finalExec = executionsDb.get(executionId)!;
          finalExec.status = 'completed';
          finalExec.endTime = new Date().toISOString();
          executionsDb.save(finalExec);
          break;
        }

        // It is a decision node
        await logExecution(
          `Evaluating decision: "${currentNode.data.label}"`,
          'info',
          currentNode.id,
          currentNode.data.label
        );

        // Execute LLM call using Inngest Step
        const decisionResult = await step.run(`evaluate-${currentNode.id}`, async () => {
          return await evaluateDecision(initialInput, currentNode.data.prompt);
        });

        decisions[currentNode.id] = decisionResult;
        
        // Save the decision result
        const decisionExec = executionsDb.get(executionId)!;
        decisionExec.decisions = { ...decisions };
        executionsDb.save(decisionExec);

        await logExecution(
          `Decision for "${currentNode.data.label}" evaluated to: ${decisionResult}`,
          decisionResult === 'YES' ? 'success' : 'warning',
          currentNode.id,
          currentNode.data.label
        );

        // Find the outgoing edge corresponding to the YES/NO handle
        const expectedHandle = decisionResult.toLowerCase(); // 'yes' or 'no'
        const outgoingEdge = edges.find(
          e => e.source === currentNode.id && e.sourceHandle === expectedHandle
        );

        if (outgoingEdge) {
          const nextNode = nodes.find(n => n.id === outgoingEdge.target);
          const nextLabel = nextNode ? nextNode.data.label : outgoingEdge.target;
          
          await logExecution(
            `Routing decision ${decisionResult} to next node: "${nextLabel}"`,
            'info',
            currentNode.id,
            currentNode.data.label
          );
          currentNodeId = outgoingEdge.target;
        } else {
          await logExecution(
            `No outgoing edge configured for decision "${decisionResult}" on node "${currentNode.data.label}"`,
            'warning',
            currentNode.id,
            currentNode.data.label
          );
          
          // Finish execution since we hit a dead end on the decision path
          const finalExec = executionsDb.get(executionId)!;
          finalExec.status = 'completed';
          finalExec.endTime = new Date().toISOString();
          executionsDb.save(finalExec);
          break;
        }
      }

      await logExecution('Workflow execution completed successfully.', 'success');
      return { success: true, visitedNodes, decisions };

    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      await logExecution(`Workflow execution failed: ${errorMsg}`, 'error');
      
      const failedExec = executionsDb.get(executionId);
      if (failedExec) {
        failedExec.status = 'failed';
        failedExec.endTime = new Date().toISOString();
        failedExec.error = errorMsg;
        executionsDb.save(failedExec);
      }
      return { success: false, error: errorMsg };
    }
  }
);
