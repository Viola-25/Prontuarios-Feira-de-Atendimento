"use client";

import { createClient } from "@/utils/supabase/client";
import { btnPrimary, inputClass, labelClass } from "@/components/field-classes";
import { Eye, EyeOff, HeartPulse, Loader2, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .single();

      if (!active) return;
      if (profile?.role === "doctor") {
        router.replace("/doctor/dashboard");
      } else if (profile?.role === "student") {
        router.replace("/student/dashboard");
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setError(error?.message ?? "Falha ao entrar. Verifique suas credenciais.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    setLoading(false);

    const role = profile?.role;

    if (role === "doctor") {
      router.push("/doctor/dashboard");
    } else if (role === "student") {
      router.push("/student/dashboard");
    } else {
      setError("Perfil sem papel (role) definido. Contate um administrador.");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-600/25">
          <HeartPulse className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Bem-vindo de volta
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Entre para acessar os prontuários da feira.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full space-y-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-8"
      >
        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className={`${inputClass} pl-10`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Senha
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} px-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <HeartPulse className="h-5 w-5" />
          )}
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}