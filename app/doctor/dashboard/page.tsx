import { createClient } from "@/utils/supabase/server";
import {
  cardClass,
  formatCpf,
  pageSubtitleClass,
  pageTitleClass,
} from "@/components/field-classes";
import { ClipboardList } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DoctorDashboard() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const doctorName = profile?.full_name ?? "Médico";

  const initials = doctorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]!.toUpperCase())
    .join("");

  const { data, error } = await supabase
    .from("medical_records")
    .select(
      "id, patient_id, created_at, patients(id, name, document_id), profiles!medical_records_student_id_fkey(full_name)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const records = data as Array<{
    id: string;
    patient_id: string;
    created_at: string;
    patients: { id: string; name: string; document_id: string | null } | null;
    profiles: { full_name: string } | null;
  }> | null;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/50 sm:gap-4 sm:p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">
            {doctorName}
          </p>
          <p className="text-xs text-slate-500">Médico preceptor</p>
        </div>
      </div>

      <h1 className={`${pageTitleClass} mt-6`}>Dashboard do Médico</h1>
      <p className={pageSubtitleClass}>
        Atendimentos aguardando revisão e finalização.
      </p>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          Erro ao carregar os atendimentos. Tente novamente.
        </p>
      )}

      {!error && (!records || records.length === 0) && (
        <div className={`${cardClass} mt-6 p-8 text-center`}>
          <ClipboardList className="mx-auto h-10 w-10 text-teal-300" />
          <p className="mt-3 text-sm text-slate-500">
            Nenhum atendimento pendente no momento.
          </p>
        </div>
      )}

      {records && records.length > 0 && (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {records.map((record) => (
            <li key={record.id}>
              <Link
                href={`/doctor/record/${record.id}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900">
                    {record.patients?.name ?? "Paciente sem nome"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {record.patients?.document_id
                      ? formatCpf(record.patients.document_id)
                      : "Sem documento"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Aluno: {record.profiles?.full_name ?? "—"}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl text-slate-300 transition group-hover:text-teal-500"
                >
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}