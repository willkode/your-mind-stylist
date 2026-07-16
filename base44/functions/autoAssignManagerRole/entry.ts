import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if Roberta's email and role hasn't been assigned yet
        if (user.email === 'roberta@robertafernandez.com' && user.role === 'user' && !user.auto_assigned_role) {
            // Update to manager role using service role
            await base44.asServiceRole.entities.User.update(user.id, {
                role: 'manager',
                auto_assigned_role: true
            });

            return Response.json({ 
                success: true, 
                message: 'Manager role assigned to Roberta',
                role: 'manager'
            });
        }

        return Response.json({ 
            success: false, 
            message: 'No role assignment needed',
            current_role: user.role
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});