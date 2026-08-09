import { NextResponse } from 'next/server';
import { executionsDb } from '../../../lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    
    let executions = executionsDb.list();
    if (workflowId) {
      executions = executions.filter(e => e.workflowId === workflowId);
    }
    
    // Sort by startTime descending
    executions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    return NextResponse.json(executions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
