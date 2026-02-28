// /home/user/matthorg/src/app/api/staff/assign-role/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { staffId, roleId } = await req.json();

    // Validate input
    if (!staffId || !roleId) {
      return NextResponse.json(
        { error: "staffId and roleId are required" }, 
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if current user has permission (admin/manager)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      );
    }

    // Get current user's role to verify they're admin
    const { data: currentUser } = await supabase
      .from("staff_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!currentUser || !['Admin', 'CEO', 'manager'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" }, 
        { status: 403 }
      );
    }

    // Update the staff member's role - using correct table name!
    const { error, data } = await supabase
      .from("staff_profiles")  // ← FIXED: Changed from "profiles" to "staff_profiles"
      .update({ 
        role_id: roleId,
        updated_at: new Date().toISOString()
      })
      .eq("id", staffId)
      .select();

    if (error) {
      console.error("Error updating role:", error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }

    // Log the action for audit trail
    await supabase
      .from("activity_logs")
      .insert({
        user_id: user.id,
        action: "ASSIGN_ROLE",
        details: {
          staff_id: staffId,
          role_id: roleId,
          timestamp: new Date().toISOString()
        }
      });

    return NextResponse.json({ 
      success: true, 
      data: data?.[0] 
    });

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

// Optional: Add GET method to fetch available roles
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    
    const { data: roles, error } = await supabase
      .from("roles")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 400 }
      );
    }

    return NextResponse.json({ roles });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}