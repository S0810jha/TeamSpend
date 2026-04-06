import { createClient } from "./supabase/server";
import { redirect } from "next/navigation";

export const getUserProfile = async()=>{
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if(authError || !user){
        redirect('/login')
    }

    const {data: profile, error: profileError} = await supabase
    .from('users')
    .select('id, role, full_name, startup_id, startups(name)')
    .eq('id', user.id)
    .single()

    if(profileError || !profile){
        redirect('/login')
    }

    return { user, profile };
}