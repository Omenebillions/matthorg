"use client";

import React from "react";
import NavLinks from "./NavLinks";
import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [org, setOrg] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchOrg = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("organizations")
        .select("name, logo_url")
        .eq("user_id", user.id)
        .single();

      if (!error) setOrg(data);
    };

    fetchOrg();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white shadow z-50 flex items-center justify-between px-4 py-3">
        <button onClick={() => setSidebarOpen(true)}>
          <Bars3Icon className="h-7 w-7 text-gray-700" />
        </button>
        <h1 className="font-semibold text-lg">MatthOrg Dashboard</h1>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-xl border-r transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-5 h-20 border-b bg-gray-50">
            {org?.logo_url ? (
              <img
                src={org.logo_url}
                className="h-12 w-12 rounded-full object-cover border"
                alt="Org Logo"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-300 animate-pulse" />
            )}
            <span className="font-bold text-lg">{org?.name || "Loading..."}</span>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <NavLinks />
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-6 mt-14 md:mt-0">
        {children}
      </main>
    </div>
  );
}