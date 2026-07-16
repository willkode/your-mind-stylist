import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin required' }, { status: 403 });
        }
        
        const audiobooks = await base44.asServiceRole.entities.Audiobook.filter({ status: "published" });
        const result = audiobooks.map(ab => ({
            id: ab.id,
            title: ab.title,
            slug: ab.slug,
            product_id: ab.product_id,
            access_level: ab.access_level,
        }));
        
        return Response.json({ audiobooks: result });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});