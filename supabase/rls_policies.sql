-- Helper function to get the organization ID of the currently authenticated user.
create or replace function auth.get_org_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select organization_id from users where id = auth.uid();
$$;

-- Enable RLS and define policies for each table

-- Organizations Table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to see their own organization" ON organizations FOR SELECT USING (id = auth.get_org_id());

-- Users Table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow users to see other users in their own organization" ON users FOR SELECT USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow users to update their own profile" ON users FOR UPDATE USING (id = auth.uid());

-- Staff Profiles Table
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow org members to read staff profiles" ON staff_profiles FOR SELECT USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to create staff profiles" ON staff_profiles FOR INSERT WITH CHECK (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to update staff profiles" ON staff_profiles FOR UPDATE USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to delete staff profiles" ON staff_profiles FOR DELETE USING (organization_id = auth.get_org_id());

-- Tasks Table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow org members to read tasks" ON tasks FOR SELECT USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to create tasks" ON tasks FOR INSERT WITH CHECK (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to update tasks" ON tasks FOR UPDATE USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to delete tasks" ON tasks FOR DELETE USING (organization_id = auth.get_org_id());

-- Milestones Table
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow org members to read milestones" ON milestones FOR SELECT USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to create milestones" ON milestones FOR INSERT WITH CHECK (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to update milestones" ON milestones FOR UPDATE USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to delete milestones" ON milestones FOR DELETE USING (organization_id = auth.get_org_id());

-- Jobs Table
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow org members to read jobs" ON jobs FOR SELECT USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to create jobs" ON jobs FOR INSERT WITH CHECK (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to update jobs" ON jobs FOR UPDATE USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to delete jobs" ON jobs FOR DELETE USING (organization_id = auth.get_org_id());

-- Sales Table
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow org members to read sales" ON sales FOR SELECT USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to create sales" ON sales FOR INSERT WITH CHECK (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to update sales" ON sales FOR UPDATE USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to delete sales" ON sales FOR DELETE USING (organization_id = auth.get_org_id());

-- Expenses Table
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow org members to read expenses" ON expenses FOR SELECT USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to create expenses" ON expenses FOR INSERT WITH CHECK (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to update expenses" ON expenses FOR UPDATE USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to delete expenses" ON expenses FOR DELETE USING (organization_id = auth.get_org_id());

-- Attendance Logs Table
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow org members to read attendance logs" ON attendance_logs FOR SELECT USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to create attendance logs" ON attendance_logs FOR INSERT WITH CHECK (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to update attendance logs" ON attendance_logs FOR UPDATE USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to delete attendance logs" ON attendance_logs FOR DELETE USING (organization_id = auth.get_org_id());

-- Inventory Table
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow org members to read inventory" ON inventory FOR SELECT USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to create inventory" ON inventory FOR INSERT WITH CHECK (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to update inventory" ON inventory FOR UPDATE USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to delete inventory" ON inventory FOR DELETE USING (organization_id = auth.get_org_id());

-- Inventory Movements Table
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow org members to read inventory movements" ON inventory_movements FOR SELECT USING (id IN (SELECT id FROM inventory WHERE organization_id = auth.get_org_id()));
CREATE POLICY "Allow org members to create inventory movements" ON inventory_movements FOR INSERT WITH CHECK (inventory_id IN (SELECT id FROM inventory WHERE organization_id = auth.get_org_id()));
CREATE POLICY "Allow org members to update inventory movements" ON inventory_movements FOR UPDATE USING (inventory_id IN (SELECT id FROM inventory WHERE organization_id = auth.get_org_id()));
CREATE POLICY "Allow org members to delete inventory movements" ON inventory_movements FOR DELETE USING (inventory_id IN (SELECT id FROM inventory WHERE organization_id = auth.get_org_id()));

-- Notifications Table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow org members to read notifications" ON notifications FOR SELECT USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to create notifications" ON notifications FOR INSERT WITH CHECK (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to update notifications" ON notifications FOR UPDATE USING (organization_id = auth.get_org_id());
CREATE POLICY "Allow org members to delete notifications" ON notifications FOR DELETE USING (organization_id = auth.get_org_id());
