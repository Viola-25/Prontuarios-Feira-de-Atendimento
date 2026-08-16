"use client";

import { createClient } from "@/utils/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(!!data.session);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!hasSession) return null;

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}