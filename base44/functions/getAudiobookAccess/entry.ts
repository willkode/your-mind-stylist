import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { audiobook_id } = await req.json();
    if (!audiobook_id) {
      return Response.json({ error: 'audiobook_id is required' }, { status: 400 });
    }

    // Get the audiobook
    const audiobook = await base44.entities.Audiobook.get(audiobook_id);
    if (!audiobook) {
      return Response.json({ error: 'Audiobook not found' }, { status: 404 });
    }

    // Free audiobooks — always accessible
    if (audiobook.access_level === 'free' || !audiobook.product_id) {
      return Response.json({
        has_access: true,
        audio_url: audiobook.audio_url,
        download_url: audiobook.download_url || audiobook.audio_url,
      });
    }

    // Manager bypass: creator of this audiobook can always preview
    if (user.role === 'manager' && audiobook.created_by === user.email) {
      return Response.json({
        has_access: true,
        access_type: 'manager_preview',
        audio_url: audiobook.audio_url,
        download_url: audiobook.download_url || audiobook.audio_url,
        file_format: audiobook.file_format || 'mp3',
        file_size_mb: audiobook.file_size_mb,
      });
    }

    // Product-gated — check ownership
    const ownership = await base44.functions.invoke('checkProductOwnership', {
      product_id: audiobook.product_id,
    });

    const hasAccess = ownership.data?.owns_product || ownership.data?.has_access || false;

    if (!hasAccess) {
      return Response.json({
        has_access: false,
        error: 'You do not have access to this audiobook. Please purchase the associated product.',
      }, { status: 403 });
    }

    return Response.json({
      has_access: true,
      audio_url: audiobook.audio_url,
      download_url: audiobook.download_url || audiobook.audio_url,
      file_format: audiobook.file_format || 'mp3',
      file_size_mb: audiobook.file_size_mb,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});