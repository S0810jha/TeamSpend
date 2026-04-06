import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const POST = async()=>{
    try {
        const supabase = await createClient()
        const { error } = await supabase.auth.signOut();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}