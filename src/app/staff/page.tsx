import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StaffClient from './StaffClient'; // We'll create this for real-time

export default async function StaffPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata?.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // Get staff from staff_profiles (not profiles)
    const { data: staff } = await supabase
        .from('staff_profiles')  // ✅ Updated table name
        .select(`
            id, 
            full_name, 
            email, 
            role_id,
            position,
            department,
            phone,
            avatar_url,
            status,
            created_at
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    // Get roles - using organization_id (not org_id)
    const { data: roles } = await supabase
        .from("roles")
        .select("id, name, permissions")
        .eq("organization_id", organizationId);  // ✅ Updated column name

    // Get permission templates
    const { data: permissions } = await supabase
        .from("permissions")
        .select("*")
        .eq("organization_id", organizationId);

    // Invite user function
    const handleInviteUser = async (formData: FormData) => {
        "use server";

        const email = formData.get("email") as string;
        const fullName = formData.get("fullName") as string;
        const roleId = formData.get("roleId") as string;
        
        if (!email) return redirect("/staff?error=Email required");

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const organizationId = user?.app_metadata?.organization_id;

        // Invite via Supabase Auth
        const { data: authData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
            email,
            { 
                data: { 
                    organization_id: organizationId,
                    full_name: fullName 
                } 
            }
        );

        if (inviteError) return redirect(`/staff?error=${inviteError.message}`);

        // Create staff profile
        if (authData?.user) {
            await supabase
                .from('staff_profiles')
                .insert({
                    id: authData.user.id,
                    full_name: fullName,
                    email: email,
                    role_id: roleId || null,
                    organization_id: organizationId,
                    status: 'pending',
                    created_at: new Date().toISOString()
                });
        }

        return redirect("/staff?success=Invitation Sent!");
    };

    // Update staff status
    const updateStaffStatus = async (formData: FormData) => {
        "use server";

        const staffId = formData.get("staffId") as string;
        const status = formData.get("status") as string;

        const supabase = await createClient();
        await supabase
            .from("staff_profiles")
            .update({ 
                status,
                updated_at: new Date().toISOString()
            })
            .eq("id", staffId);

        redirect("/staff");
    };

    // Assign role
    const assignRole = async (formData: FormData) => {
        "use server";

        const staffId = formData.get("staffId") as string;
        const roleId = formData.get("roleId") as string;

        const supabase = await createClient();
        await supabase
            .from("staff_profiles")
            .update({ 
                role_id: roleId,
                updated_at: new Date().toISOString()
            })
            .eq("id", staffId);

        redirect("/staff");
    };

    // Pass initial data to client component
    return (
        <StaffClient 
            organizationId={organizationId}
            initialStaff={staff || []}
            initialRoles={roles || []}
            initialPermissions={permissions || []}
            handleInviteUser={handleInviteUser}
            assignRole={assignRole}
            updateStaffStatus={updateStaffStatus}
        />
    );
}