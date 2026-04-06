import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const POST = async(request: Request)=>{
    try {
        const body = await request.json();
        const { email, password } = body;

        const supabase = await createClient();

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({email, password,})

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();

        if (userError) {
            return NextResponse.json({ error: 'Could not retrieve user role.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, user: authData.user, role: userData.role }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}