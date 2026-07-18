import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const RANKS = { owner: 4, admin: 3, manager: 2, support_staff: 1, user: 0 };

function effectiveRole(user) {
  const cr = user?.custom_role;
  if (['owner', 'admin', 'manager', 'support_staff'].includes(cr)) return cr;
  return user?.role === 'admin' ? 'admin' : 'user';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const role = effectiveRole(user);
    if (RANKS[role] < RANKS.support_staff) {
      return Response.json({ error: 'Forbidden — staff access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const svc = base44.asServiceRole;

    const logActivity = async (actionType, note, details) => {
      try {
        await svc.entities.ActivityLog.create({
          action: actionType,
          action_type: actionType,
          actor: user.email,
          actor_role: role,
          entity_type: 'InternalNote',
          record_id: note?.id,
          target: note ? `${note.entity_type}:${note.record_id}` : '',
          details,
        });
      } catch (e) {
        console.error('Activity log failed:', e.message);
      }
    };

    if (action === 'list') {
      const { entity_type, record_id } = body;
      if (!entity_type || !record_id) {
        return Response.json({ error: 'entity_type and record_id are required' }, { status: 400 });
      }
      const notes = await svc.entities.InternalNote.filter({ entity_type, record_id }, '-created_date', 100);
      return Response.json({ notes, viewer_role: role });
    }

    if (action === 'create') {
      const { entity_type, record_id, content } = body;
      if (!entity_type || !record_id || !content?.trim()) {
        return Response.json({ error: 'entity_type, record_id, and content are required' }, { status: 400 });
      }
      const note = await svc.entities.InternalNote.create({
        entity_type,
        record_id,
        content: content.trim(),
        author_email: user.email,
        author_name: user.full_name || user.email,
        author_role: role,
      });
      await logActivity('note_added', note, `Internal note added by ${user.email}`);
      return Response.json({ note });
    }

    if (action === 'update') {
      const { note_id, content } = body;
      if (!note_id || !content?.trim()) {
        return Response.json({ error: 'note_id and content are required' }, { status: 400 });
      }
      const note = await svc.entities.InternalNote.get(note_id);
      if (!note) return Response.json({ error: 'Note not found' }, { status: 404 });
      if (note.author_email !== user.email && RANKS[role] < RANKS.admin) {
        return Response.json({ error: 'You can only edit your own notes' }, { status: 403 });
      }
      const updated = await svc.entities.InternalNote.update(note_id, {
        content: content.trim(),
        edited: true,
      });
      await logActivity('note_edited', note, `Internal note edited by ${user.email}`);
      return Response.json({ note: updated });
    }

    if (action === 'delete') {
      const { note_id } = body;
      if (RANKS[role] < RANKS.admin) {
        return Response.json({ error: 'Only admins can delete notes' }, { status: 403 });
      }
      const note = await svc.entities.InternalNote.get(note_id);
      if (!note) return Response.json({ error: 'Note not found' }, { status: 404 });
      await svc.entities.InternalNote.delete(note_id);
      await logActivity('note_deleted', note, `Internal note deleted by ${user.email}`);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});