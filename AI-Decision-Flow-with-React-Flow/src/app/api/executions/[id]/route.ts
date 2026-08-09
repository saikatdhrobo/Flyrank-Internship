import { NextResponse } from 'next/server';
import { executionsDb } from '../../../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const execution = executionsDb.get(id);
    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }
    return NextResponse.json(execution);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
