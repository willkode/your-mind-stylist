import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload file using Core integration
    const result = await base44.integrations.Core.UploadFile({ file });

    return Response.json({ file_url: result.file_url });

  } catch (error) {
    console.error('Error uploading profile photo:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});