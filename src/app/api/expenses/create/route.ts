import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const POST = async (request: Request) => {
    try {
        const body = await request.json();
        const { amount, description, category } = body;

        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // FIX: We need the user's startup_id so the Admin can actually see this expense!
        const { data: userProfile } = await supabase
            .from('users')
            .select('startup_id')
            .eq('id', user.id)
            .single();

        const { data: teamMember } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .single();

        if (!teamMember || !userProfile) {
            return NextResponse.json({ error: 'You are not assigned to a department.' }, { status: 403 });
        }

        const { data: team } = await supabase
            .from('teams')
            .select('budgets(start_date, end_date)')
            .eq('id', teamMember.team_id)
            .single();

        const budgetObj = Array.isArray(team?.budgets) ? team.budgets[0] : team?.budgets;

        if (!budgetObj?.start_date || !budgetObj?.end_date) {
            return NextResponse.json({ error: 'Your department has no active budget.' }, { status: 403 });
        }

        const today = new Date();
        const startDate = new Date(budgetObj.start_date);
        startDate.setHours(0, 0, 0, 0); 
        
        const endDate = new Date(budgetObj.end_date);
        endDate.setHours(23, 59, 59, 999); 

        if (today < startDate) return NextResponse.json({ error: 'Your budget cycle has not started yet.' }, { status: 403 });
        if (today > endDate) return NextResponse.json({ error: 'Your budget cycle has expired.' }, { status: 403 });

        // FIX: Insert the startup_id here!
        const { error: insertError } = await supabase
            .from('expenses')
            .insert({
                user_id: user.id,
                team_id: teamMember.team_id,
                startup_id: userProfile.startup_id, 
                amount: Number(amount),
                description,
                category,
                status: 'PENDING'
            });

        if (insertError) throw insertError;

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("EXPENSE SUBMIT ERROR:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}