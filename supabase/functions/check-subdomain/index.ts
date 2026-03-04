// supabase/functions/check-subdomain/index.ts
// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { subdomain } = await req.json();

    if (!subdomain || subdomain.length < 3) {
      return new Response(JSON.stringify({ available: false, message: "Subdomain too short" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabaseAdmin
      .from("organizations")
      .select("subdomain")
      .eq("subdomain", subdomain)
      .maybeSingle();

    if (error) throw error;

    const available = !data;

    return new Response(
      JSON.stringify({ available, subdomain }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Check failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});