import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const POST = async (request: Request) => {
    try {
        const body = await request.json();
        const { expenseId, newStatus } = body;

        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: adminProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single();

        if (adminProfile?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Only admins can approve expenses.' }, { status: 403 });
        }

        const adminAuthClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error: updateError } = await adminAuthClient
            .from('expenses')
            .update({ status: newStatus })
            .eq('id', expenseId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("EXPENSE STATUS UPDATE ERROR:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}