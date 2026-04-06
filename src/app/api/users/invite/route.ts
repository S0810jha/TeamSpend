import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const POST = async (request: Request) => {
    try {
        const body = await request.json();
        const { startupId, fullName, email, password, role, teamId } = body;

        // 1. Verify the person making the request is actually an Admin
        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: adminProfile } = await supabase
            .from('users')
            .select('role, startup_id')
            .eq('id', authUser.id)
            .single();

        if (adminProfile?.role !== 'ADMIN' || adminProfile?.startup_id !== startupId) {
            return NextResponse.json({ error: 'Not authorized to invite users.' }, { status: 403 });
        }

        // 2. Initialize the SUPERUSER Admin Client (Requires SUPABASE_SERVICE_ROLE_KEY in .env.local)
        const adminAuthClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false // 👈 This stops the Admin from being forcefully logged out!
                }
            }
        );

        // 3. Create the new user in Supabase Authentication
        const { data: newAuthUser, error: createError } = await adminAuthClient.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto-confirm so they can log in immediately
            user_metadata: { full_name: fullName } // Notice we are NOT passing startup_name here!
        });

        if (createError) {
            console.error("SUPABASE CREATE USER ERROR:", createError);
            return NextResponse.json({ error: createError.message }, { status: 400 });
        }

        const newUserId = newAuthUser.user.id;

        // 4. Manually add them to your public.users table according to your schema
        const { error: profileError } = await adminAuthClient
            .from('users')
            .insert({
                id: newUserId,
                startup_id: startupId,
                role: role,
                full_name: fullName,
                email: email
            });

        if (profileError) {
            console.error("SUPABASE PROFILE ERROR:", profileError);
            // Rollback auth user if public table fails
            await adminAuthClient.auth.admin.deleteUser(newUserId);
            return NextResponse.json({ error: 'Failed to create user profile.' }, { status: 400 });
        }

        // 5. Link the employee to their Team in public.team_members
        if (teamId) {
            const { error: teamError } = await adminAuthClient
                .from('team_members')
                .insert({
                    user_id: newUserId,
                    team_id: teamId
                });

            if (teamError) {
                console.error("SUPABASE TEAM ASSIGN ERROR:", teamError);
                return NextResponse.json({ error: 'User created, but failed to assign to team.' }, { status: 400 });
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("SERVER CRASH:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}