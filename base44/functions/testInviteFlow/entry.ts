import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * TEST ONLY — probes the Base44 invite API behavior.
 * Does NOT send real invites unless mode=live.
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const mode = body.mode || 'inspect'; // 'inspect' or 'live'
  const testEmail = body.email;

  if (mode === 'inspect') {
    // Just inspect the SDK method signature and type
    const inviteUserFn = base44.auth?.inviteUser || base44.users?.inviteUser;
    return Response.json({
      has_inviteUser_on_auth: typeof base44.auth?.inviteUser === 'function',
      has_inviteUser_on_users: typeof base44.users?.inviteUser === 'function',
      auth_methods: Object.keys(base44.auth || {}),
      users_methods: base44.users ? Object.keys(base44.users) : 'base44.users does not exist',
      note: 'Call with mode=live and email=test@example.com to test actual invite',
    });
  }

  if (mode === 'live' && testEmail) {
    // Actually call inviteUser and capture the full return value
    console.log(`[testInviteFlow] Calling inviteUser for: ${testEmail}`);
    
    let result;
    let error;
    try {
      // Try both possible locations
      if (typeof base44.users?.inviteUser === 'function') {
        result = await base44.users.inviteUser(testEmail, 'user');
        console.log('[testInviteFlow] base44.users.inviteUser result:', JSON.stringify(result));
      } else if (typeof base44.auth?.inviteUser === 'function') {
        result = await base44.auth.inviteUser(testEmail, 'user');
        console.log('[testInviteFlow] base44.auth.inviteUser result:', JSON.stringify(result));
      } else {
        error = 'Neither base44.auth.inviteUser nor base44.users.inviteUser exists';
      }
    } catch (e) {
      error = e.message;
      console.error('[testInviteFlow] Error:', e.message);
    }

    return Response.json({
      testEmail,
      result: result ?? null,
      resultType: result === undefined ? 'undefined' : typeof result,
      resultKeys: result && typeof result === 'object' ? Object.keys(result) : null,
      error: error ?? null,
      note: 'Examine result to see if an invite URL/token is returned',
    });
  }

  return Response.json({ error: 'Invalid mode. Use inspect or live' }, { status: 400 });
});