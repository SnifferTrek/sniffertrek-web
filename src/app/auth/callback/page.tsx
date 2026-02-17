"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.getSession();
      if (error) {
        router.push("/login?error=auth_failed");
      } else {
        router.push("/planer");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20 animate-pulse">
          <Globe className="w-7 h-7 text-white" />
        </div>
        <p className="text-gray-500 text-sm">Anmeldung wird verarbeitet...</p>
      </div>
    </div>
  );
}
