// supabase/functions/check-subdomain/index.ts
// @ts-nocheck: Temporarily disabling full check due to Deno environment sync issues in local editor
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RequestBody {
  subdomain?: string;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { subdomain }: RequestBody = await req.json();

    if (!subdomain || subdomain.length < 3) {
      return new Response(JSON.stringify({ available: false, message: "Subdomain too short" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
  } catch (err) {
    // Explicitly handling the error as an Error object to avoid 'any'
    const errorMessage = err instanceof Error ? err.message : "Check failed";
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});