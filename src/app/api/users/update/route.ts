import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const POST = async (request: Request) => {
    try {
        const body = await request.json();
        const { userId, fullName, role, teamId } = body;

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

        if (adminProfile?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Not authorized to edit users.' }, { status: 403 });
        }

        const adminAuthClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // FIX 1: Fetch the target user's role along with their startup_id
        const { data: targetUser } = await adminAuthClient
            .from('users')
            .select('startup_id, role')
            .eq('id', userId)
            .single();
            
        if (targetUser?.startup_id !== adminProfile.startup_id) {
            return NextResponse.json({ error: 'User not found in your workspace.' }, { status: 403 });
        }

        // FIX 2: Absolute backend security block
        if (targetUser?.role === 'ADMIN') {
            if (role !== 'ADMIN') {
                return NextResponse.json({ error: 'Security Exception: Cannot downgrade an Admin account.' }, { status: 403 });
            }
            // If they are an Admin, we ONLY allow them to update the name.
            const { error: profileError } = await adminAuthClient
                .from('users')
                .update({ full_name: fullName }) // Notice we explicitly omit updating 'role'
                .eq('id', userId);

            if (profileError) throw profileError;
            
            // We return early here so it completely skips the team assignment logic below!
            return NextResponse.json({ success: true }, { status: 200 });
        }

        // --- NORMAL EMPLOYEE/ANALYST UPDATE LOGIC ---
        
        // 3. Update the User's Profile (Name and Role)
        const { error: profileError } = await adminAuthClient
            .from('users')
            .update({ full_name: fullName, role: role })
            .eq('id', userId);

        if (profileError) throw profileError;

        // 4. Update the Team Assignment
        await adminAuthClient
            .from('team_members')
            .delete()
            .eq('user_id', userId);

        if (teamId) {
            const { error: teamError } = await adminAuthClient
                .from('team_members')
                .insert({ user_id: userId, team_id: teamId });
                
            if (teamError) throw teamError;
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("UPDATE USER ERROR:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}