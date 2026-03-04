// import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-nocheck
serve(async (req) => {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }
  
    try {
      const {
        email,
        password,
        first_name,
        last_name,
        company_name,
        custom_subdomain,
        industry,
        other_industry,
      } = await req.json();
  
      const finalIndustry = industry === "Other (Please Specify)" ? other_industry : industry;
      const slug = custom_subdomain || company_name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 30);
  
      if (slug.length < 3) {
        return new Response(JSON.stringify({ error: "Subdomain must be at least 3 characters" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
  
      // 1. Create auth user
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // ← full power, bypasses RLS
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
  
      const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
            company_name,
            organization_slug: slug,
          },
          emailRedirectTo: Deno.env.get("SITE_URL") + "/auth/callback",
        },
      });
  
      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");
  
      const userId = authData.user.id;
  
      // 2. Check if subdomain already exists
      const { data: existingOrg } = await supabaseAdmin
        .from("organizations")
        .select("id")
        .eq("subdomain", slug)
        .maybeSingle();
  
      if (existingOrg) {
        throw new Error(`Subdomain "${slug}" is already taken`);
      }
  
      // 3. Create organization
      const { data: org, error: orgError } = await supabaseAdmin
        .from("organizations")
        .insert({
          user_id: userId,
          name: company_name,
          industry: finalIndustry,
          subdomain: slug,
        })
        .select()
        .single();
  
      if (orgError) throw orgError;
  
      // 4. Create staff profile (CEO with full perms)
      const allPermissions = [
        "task:create", "task:assign", "task:view",
        "inventory:add", "inventory:view",
        "sales:view", "expenses:add", "expenses:view",
        "staff:add", "staff:view",
        // add more as needed
      ];
  
      const { error: staffError } = await supabaseAdmin.from("staff_profiles").insert({
        id: userId,
        first_name,
        last_name,
        email,
        role: "ceo",
        permissions: allPermissions,
        organization_id: org.id,
      });
  
      if (staffError) throw staffError;
  
      // Return success + tokens so client can set session
      return new Response(
        JSON.stringify({
          success: true,
          user: authData.user,
          session: authData.session,
          organization: org,
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (err: any) {
      console.error(err);
      return new Response(
        JSON.stringify({ error: err.message || "Signup failed" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  });matthorg/src/utils/supabase/signup/index.ts
