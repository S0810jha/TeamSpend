import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export const POST = async (request: Request) => {
    try {
        const body = await request.json();
        const { teamId, budgetId, totalAmount, startDate, endDate } = body;

        const supabase = await createClient();
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) 
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: adminProfile } = await supabase
            .from('users')
            .select('role, startup_id')
            .eq('id', authUser.id)
            .single();

        if (adminProfile?.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Not authorized to manage budgets.' }, { status: 403 });
        }

        const adminAuthClient = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: targetTeam } = await adminAuthClient
            .from('teams')
            .select('startup_id')
            .eq('id', teamId)
            .single();
            
        if (targetTeam?.startup_id !== adminProfile.startup_id) {
            return NextResponse.json({ error: 'Team not found in your workspace.' }, { status: 403 });
        }

        if (budgetId) {
            
            const { error: updateError } = await adminAuthClient
                .from('budgets')
                .update({ 
                    total_amount: totalAmount, 
                    start_date: startDate, 
                    end_date: endDate 
                })
                .eq('id', budgetId);

            if (updateError) throw updateError;
        } else {
            
            const { error: insertError } = await adminAuthClient
                .from('budgets')
                .insert({ 
                    team_id: teamId, 
                    total_amount: totalAmount, 
                    start_date: startDate, 
                    end_date: endDate 
                });

            if (insertError) throw insertError;
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("BUDGET UPDATE ERROR:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}