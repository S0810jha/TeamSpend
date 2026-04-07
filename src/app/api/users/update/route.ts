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

        const { data: targetUser } = await adminAuthClient
            .from('users')
            .select('startup_id, role')
            .eq('id', userId)
            .single();
            
        if (targetUser?.startup_id !== adminProfile.startup_id) {
            return NextResponse.json({ error: 'User not found in your workspace.' }, { status: 403 });
        }

        if (targetUser?.role === 'ADMIN') {
            if (role !== 'ADMIN') {
                return NextResponse.json({ error: 'Security Exception: Cannot downgrade an Admin account.' }, { status: 403 });
            }

            const { error: profileError } = await adminAuthClient
                .from('users')
                .update({ full_name: fullName }) 
                .eq('id', userId);

            if (profileError) throw profileError;
            
            return NextResponse.json({ success: true }, { status: 200 });
        }

        
        const { error: profileError } = await adminAuthClient
            .from('users')
            .update({ full_name: fullName, role: role })
            .eq('id', userId);

        if (profileError) throw profileError;

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