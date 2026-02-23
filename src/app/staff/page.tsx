import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function StaffPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const organizationId = user.app_metadata?.organization_id;
    if (!organizationId) return redirect('/?error=No organization found');

    // Get staff
    const { data: staff } = await supabase
        .from('profiles')
        .select('id, full_name, email, role_id')
        .eq('organization_id', organizationId);

    // Get roles
    const { data: roles } = await supabase
        .from("roles")
        .select("id, name")
        .eq("org_id", organizationId);

    // Invite user function
    const handleInviteUser = async (formData: FormData) => {
        "use server";

        const email = formData.get("email") as string;
        if (!email) return redirect("/staff?error=Email required");

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const supabaseAdmin = await createClient();
        const organizationId = user?.app_metadata?.organization_id;

        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            email,
            { data: { organization_id: organizationId } }
        );

        if (error) return redirect(`/staff?error=${error.message}`);

        return redirect("/staff?success=Invitation Sent!");
    };

    // Assign role (server action)
    const assignRole = async (formData: FormData) => {
        "use server";

        const staffId = formData.get("staffId") as string;
        const roleId = formData.get("roleId") as string;

        const supabase = await createClient();
        await supabase.from("profiles")
            .update({ role_id: roleId })
            .eq("id", staffId);

        redirect("/staff");
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg flex flex-col">
                <div className="p-6 text-center">
                    <h1 className="text-3xl font-bold">
                        <span className="text-blue-600">MattH</span>
                        <span className="text-gray-800">org</span>
                    </h1>
                </div>

                <nav className="flex-grow px-4">
                    <ul className="space-y-2">
                        <li><Link href="/dashboard" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>🏠</span><span className="ml-3">Dashboard</span></Link></li>
                        <li><Link href="/tasks" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>📝</span><span className="ml-3">Tasks</span></Link></li>
                        <li><Link href="/jobs" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>💼</span><span className="ml-3">Jobs</span></Link></li>
                        <li><Link href="/sales" className="flex items-center p-3 text-gray-600 hover:bg-gray-100 rounded-lg"><span>📈</span><span className="ml-3">Sales</span></Link></li>

                        <li>
                            <Link href="/staff" className="flex items-center p-3 text-gray-800 bg-blue-100 rounded-lg font-bold shadow-sm">
                                <span>👥</span><span className="ml-3">Staff</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow-md p-4">
                    <h1 className="text-2xl font-semibold text-gray-800">Staff Management</h1>
                </header>

                <main className="flex-grow p-6 overflow-y-auto">

                    {/* Invite user */}
                    <div className="mb-8 bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Invite New Staff Member</h2>

                        <form action={handleInviteUser} className="flex items-end gap-4">
                            <div className="flex-grow">
                                <label className="block text-sm font-medium">Email</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    required
                                    className="mt-1 w-full border p-2 rounded"
                                    placeholder="staff@company.com"
                                />
                            </div>

                            <button className="h-10 px-6 bg-blue-600 text-white rounded-md">
                                Send Invite
                            </button>
                        </form>
                    </div>

                    {/* Staff list */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Members</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {staff?.map((member) => (
                                <div key={member.id} className="bg-gray-50 p-5 rounded-lg shadow-sm">

                                    <h3 className="text-lg font-bold">{member.full_name || "Pending Invite"}</h3>
                                    <p className="text-sm text-gray-600">{member.email}</p>

                                    {/* Role Selector */}
                                    <form action={assignRole} className="mt-4">
                                        <input type="hidden" name="staffId" value={member.id} />

                                        <select
                                            name="roleId"
                                            defaultValue={member.role_id || ""}
                                            className="w-full border p-2 rounded"
                                            onChange={(e) => e.currentTarget.form?.requestSubmit()}
                                        >
                                            <option value="">No Role</option>
                                            {roles?.map((role) => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </form>

                                    <div className="mt-4 pt-4 border-t flex justify-between">
                                        <Link href={`/staff/${member.id}`} className="text-blue-600 text-sm">
                                            View Profile
                                        </Link>
                                    </div>
                                </div>
                            ))}

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}