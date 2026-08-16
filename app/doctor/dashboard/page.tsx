import { createClient } from "@/utils/supabase/server";
import { ClipboardList } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatCpf } from "@/components/field-classes";

export default async function DoctorDashboard() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

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
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="text-xl font-semibold text-gray-900">
        Dashboard do Médico
      </h1>
      <p className="mb-6 mt-1 text-sm text-gray-600">
        Atendimentos aguardando revisão e finalização.
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          Erro ao carregar os atendimentos. Tente novamente.
        </p>
      )}

      {!error && (!records || records.length === 0) && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-600">
            Nenhum atendimento pendente no momento.
          </p>
        </div>
      )}

      {records && records.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {records.map((record) => (
            <li key={record.id}>
              <Link
                href={`/doctor/record/${record.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-teal-300 hover:bg-teal-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-medium text-gray-900">
                    {record.patients?.name ?? "Paciente sem nome"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {record.patients?.document_id
                      ? formatCpf(record.patients.document_id)
                      : "Sem documento"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Aluno: {record.profiles?.full_name ?? "—"}
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-lg text-gray-400"
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