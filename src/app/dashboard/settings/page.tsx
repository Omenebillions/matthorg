"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../../utils/supabase/client";
import Image from "next/image";

const supabase = createClient();

export default function SettingsPage() {
  const [org, setOrg] = useState<any>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [address, setAddress] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!error) {
      setOrg(data);
      setAddress(data.address || "");
    }
  };

  const uploadLogo = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (1MB max)
    if (file.size > 1 * 1024 * 1024) {
      alert("Logo too large! Max size allowed is 1MB.");
      return;
    }

    setLogoUploading(true);

    const ext = file.name.split(".").pop();
    const filePath = `org_${org.id}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("organization-logos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert(uploadError.message);
      setLogoUploading(false);
      return;
    }

    // Get public URL
    const { data: url } = supabase.storage
      .from("organization-logos")
      .getPublicUrl(filePath);

    // Save URL to database
    await supabase
      .from("organizations")
      .update({ logo_url: url.publicUrl })
      .eq("id", org.id);

    // Refresh UI
    loadOrganization();
    setLogoUploading(false);

    alert("Logo updated successfully!");
  };

  const saveAddress = async () => {
    if (!org) return;

    setSavingAddress(true);

    const { error } = await supabase
      .from("organizations")
      .update({ address })
      .eq("id", org.id);

    setSavingAddress(false);

    if (error) return alert(error.message);

    alert("Address updated!");
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* LOGO SECTION */}
      <div className="bg-white rounded-xl p-5 shadow">
        <h2 className="font-semibold text-lg mb-3">Organization Logo</h2>

        {org?.logo_url ? (
          <Image
            src={org.logo_url}
            alt="Organization Logo"
            width={120}
            height={120}
            className="rounded-lg border mb-4"
          />
        ) : (
          <p className="text-gray-500 mb-4">No logo uploaded yet.</p>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={uploadLogo}
          disabled={logoUploading}
          className="block"
        />

        {logoUploading && <p className="text-blue-500 mt-2">Uploading...</p>}
      </div>

      {/* ADDRESS SECTION */}
      <div className="bg-white rounded-xl p-5 shadow">
        <h2 className="font-semibold text-lg mb-3">Receipt Address</h2>

        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Organization Address for receipts"
          className="w-full border rounded-lg p-3 min-h-[120px]"
        />

        <button
          onClick={saveAddress}
          disabled={savingAddress}
          className="mt-3 bg-blue-600 text-white rounded-lg px-6 py-2"
        >
          {savingAddress ? "Saving..." : "Save Address"}
        </button>
      </div>
    </div>
  );
}