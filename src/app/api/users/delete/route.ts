import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const POST = async (request: Request) => {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

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
            return NextResponse.json({ error: 'Not authorized to delete users.' }, { status: 403 });
        }

        if (userId === authUser.id) {
            return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });
        }

        const adminAuthClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // FIX: Fetch the target user's role along with their startup_id
        const { data: targetUser } = await adminAuthClient
            .from('users')
            .select('startup_id, role')
            .eq('id', userId)
            .single();
            
        if (targetUser?.startup_id !== adminProfile.startup_id) {
            return NextResponse.json({ error: 'User not found in your workspace.' }, { status: 403 });
        }

        // FIX: Absolute server-side block preventing Admin deletion
        if (targetUser?.role === 'ADMIN') {
            return NextResponse.json({ error: 'You cannot delete an Admin account.' }, { status: 403 });
        }

        const { error: deleteError } = await adminAuthClient.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error("SUPABASE DELETE ERROR:", deleteError);
            return NextResponse.json({ error: 'Failed to delete user account.' }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("DELETE USER EXCEPTION:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}