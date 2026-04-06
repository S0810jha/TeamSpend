import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export const GET = async()=>{
    try {
        const cookieStore = await cookies()
        const supabase = createClient(cookieStore)

        const {data, error} = await supabase.from("startups").select("*").limit(1)
        if (error) {
            return NextResponse.json(
                { status: "Connection Failed", details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                status: "Success",
                message: "Supabase is connected perfectly! Database tables are recognized.",
                data: data
            },
            { status: 200 }
        )

    } catch (error: any) {
        return NextResponse.json(
            { status: "Server Error", details: error.message },
            { status: 500 }
        )
    }
}