import { serve } from 'inngest/next';
import { inngest } from '../../../inngest/client';
import { executeWorkflow } from '../../../inngest/functions';

// Serve Inngest endpoints (GET, POST, PUT are required by Inngest client/server dev portal)
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [executeWorkflow],
});
