import { NextResponse } from 'next/server';
import { workflowsDb } from '../../../lib/db';

export async function GET() {
  try {
    const list = workflowsDb.list();
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.id || !body.title) {
      return NextResponse.json({ error: 'Missing required fields: id and title' }, { status: 400 });
    }
    const saved = workflowsDb.save(body);
    return NextResponse.json(saved);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
