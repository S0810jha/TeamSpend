import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const POST = async (request: Request) => {
    try {
        const body = await request.json();
        const { startupId, teamName, initialBudget, startDate, endDate } = body;

        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: existingTeam } = await supabase
            .from('teams')
            .select('id')
            .eq('startup_id', startupId)
            .ilike('name', teamName) 
            .maybeSingle();

        if (existingTeam) {
            return NextResponse.json(
                { error: `A team named "${teamName}" already exists in your workspace.` }, 
                { status: 400 }
            );
        }

        // ==========================================
        // CREATE TEAM
        // ==========================================
        const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert([
            { 
                startup_id: startupId, 
                name: teamName 
            }
        ])
        .select('id') 
        .single();

        if (teamError) {
            console.error("🚨 TEAM ERROR:", teamError);
            // Send the EXACT Supabase error to the frontend!
            return NextResponse.json({ error: `Team Error: ${teamError.message}` }, { status: 400 });
        }   

        // ==========================================
        // CREATE BUDGET
        // ==========================================
        const { error: budgetError } = await supabase
        .from('budgets')
        .insert([
            {
            team_id: newTeam.id,
            total_amount: initialBudget,
            start_date: startDate,
            end_date: endDate,
            }
        ]);

        if (budgetError) {
            console.error("🚨 BUDGET ERROR:", budgetError);
            await supabase
                .from('teams')
                .delete()
                .eq('id', newTeam.id);
            // Send the EXACT Supabase error to the frontend!
            return NextResponse.json({ error: `Budget Error: ${budgetError.message}` }, { status: 400 });
        }

        return NextResponse.json({ success: true, teamId: newTeam.id }, { status: 200 });

    } catch (error) {
        console.error("🚨 SERVER FATAL ERROR:", error);
        return NextResponse.json({ error: error || 'Internal Server Error' }, { status: 500 });   
    }
}