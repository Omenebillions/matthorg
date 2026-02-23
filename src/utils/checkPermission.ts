import { createClient } from "@/utils/supabase/client";

export async function checkPermission(userId: string, permissionKey: string) {
    const supabase = await createClient();

    // Get auth metadata (superadmin lives here)
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.app_metadata?.superadmin === true) {
        return true; // 🚀 OWNER OVERRIDE
    }

    // 1. Get user role
    const { data: profile } = await supabase
        .from("staff_profiles")
        .select("role_id")
        .eq("id", userId)
        .single();

    if (!profile?.role_id) return false;

    // 2. Check permission
    const { data: hasPermission } = await supabase
        .from("role_permissions")
        .select("permission_id, permissions!inner(key)")
        .eq("role_id", profile.role_id)
        .eq("permissions.key", permissionKey)
        .maybeSingle();

    return !!hasPermission;
}