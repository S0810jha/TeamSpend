import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { email, password, fullName, startupName } = body;

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          startup_name: startupName, 
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Registration successful!' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}