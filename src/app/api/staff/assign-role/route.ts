import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const { staffId, roleId } = await req.json();

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role_id: roleId })
    .eq("id", staffId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}