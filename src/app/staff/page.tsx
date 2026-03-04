import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import StaffClient from './StaffClient';

// Define the Role type to match what StaffClient expects
interface Role {
  id: string;
  name: string;
  permissions?: string[] | null;
  description?: string | null;
  is_default?: boolean;
  organization_id: string;
  created_at: string;
  updated_at?: string;
}

export default async function StaffPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata?.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // Get staff from staff_profiles
    const { data: staff } = await supabase
        .from('staff_profiles')
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

    // Get roles - include all fields needed by Role interface
    const { data: roles } = await supabase
        .from("roles")
        .select(`
            id, 
            name, 
            permissions,
            description,
            is_default,
            organization_id,
            created_at,
            updated_at
        `)
        .eq("organization_id", organizationId); 

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

        // Check if user with this email already exists
        const { data: existingUser } = await supabase
            .from('staff_profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return redirect("/staff?error=User with this email already exists");
        }

        try {
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

            if (inviteError) {
                console.error('Invite error:', inviteError);
                return redirect(`/staff?error=${encodeURIComponent(inviteError.message)}`);
            }

            // Create staff profile
            if (authData?.user) {
                const { error: profileError } = await supabase
                    .from('staff_profiles')
                    .insert({
                        id: authData.user.id,
                        full_name: fullName,
                        email: email,
                        role_id: roleId || null,
                        organization_id: organizationId,
                        status: 'pending',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    return redirect(`/staff?error=${encodeURIComponent(profileError.message)}`);
                }
            }

            return redirect("/staff?success=Invitation Sent!");
            
        } catch (error: any) {
            console.error('Unexpected error:', error);
            return redirect(`/staff?error=${encodeURIComponent(error.message || 'Failed to send invitation')}`);
        }
    };

    // Update staff status
    const updateStaffStatus = async (formData: FormData) => {
        "use server";

        const staffId = formData.get("staffId") as string;
        const status = formData.get("status") as string;

        const supabase = await createClient();
        
        const { error } = await supabase
            .from("staff_profiles")
            .update({ 
                status,
                updated_at: new Date().toISOString()
            })
            .eq("id", staffId);

        if (error) {
            console.error('Status update error:', error);
            return redirect(`/staff?error=${encodeURIComponent(error.message)}`);
        }

        redirect("/staff?success=Status updated");
    };

    // Assign role
    const assignRole = async (formData: FormData) => {
        "use server";

        const staffId = formData.get("staffId") as string;
        const roleId = formData.get("roleId") as string;

        const supabase = await createClient();
        
        const { error } = await supabase
            .from("staff_profiles")
            .update({ 
                role_id: roleId || null,
                updated_at: new Date().toISOString()
            })
            .eq("id", staffId);

        if (error) {
            console.error('Role assignment error:', error);
            return redirect(`/staff?error=${encodeURIComponent(error.message)}`);
        }

        redirect("/staff?success=Role updated");
    };

    // Ensure roles data matches the Role interface
    const formattedRoles: Role[] = (roles || []).map(role => ({
        id: role.id,
        name: role.name,
        permissions: role.permissions || [],
        description: role.description || null,
        is_default: role.is_default || false,
        organization_id: role.organization_id,
        created_at: role.created_at || new Date().toISOString(),
        updated_at: role.updated_at || role.created_at || new Date().toISOString()
    }));

    // Pass initial data to client component
    return (
        <StaffClient 
            organizationId={organizationId}
            initialStaff={staff || []}
            initialRoles={formattedRoles}
            initialPermissions={permissions || []}
            handleInviteUser={handleInviteUser}
            assignRole={assignRole}
            updateStaffStatus={updateStaffStatus}
        />
    );
}