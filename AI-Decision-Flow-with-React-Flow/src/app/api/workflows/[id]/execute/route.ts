import { NextResponse } from 'next/server';
import { inngest } from '../../../../../inngest/client';
import { executionsDb, workflowsDb, Execution } from '../../../../../lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { initialInput } = body;

    if (!initialInput) {
      return NextResponse.json({ error: 'Missing initialInput in request body' }, { status: 400 });
    }

    const workflow = workflowsDb.get(id);
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Generate execution ID
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create execution document
    const newExecution: Execution = {
      id: executionId,
      workflowId: id,
      status: 'running',
      initialInput,
      currentNodeId: null,
      visitedNodes: [],
      decisions: {},
      logs: [],
      startTime: new Date().toISOString(),
    };

    // Save initial state
    executionsDb.save(newExecution);

    // Dispatch background event to Inngest
    await inngest.send({
      name: 'workflow.execute',
      data: {
        executionId,
        workflowId: id,
        initialInput,
      },
    });

    return NextResponse.json({ executionId });
  } catch (error: any) {
    console.error('Failed to trigger workflow execution:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
