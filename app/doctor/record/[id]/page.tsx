import { CompleteRecordForm } from "@/components/doctor/complete-record-form";
import { formatCpf } from "@/components/field-classes";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DoctorRecordPage({ params }: Props) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data } = await supabase
    .from("medical_records")
    .select(
      "id, status, anamnesis, physical_exam, management_plan, patients(id, name, document_id, birth_date, phone), profiles!medical_records_student_id_fkey(full_name)"
    )
    .eq("id", id)
    .single();

  const record = data as {
    id: string;
    status: string;
    anamnesis: string | null;
    physical_exam: string | null;
    management_plan: string | null;
    patients: {
      id: string;
      name: string;
      document_id: string | null;
      birth_date: string | null;
      phone: string | null;
    } | null;
    profiles: { full_name: string } | null;
  } | null;

  if (!record) {
    notFound();
  }

  const patient = record.patients;
  const studentName = record.profiles?.full_name ?? "—";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
      <Link
        href="/doctor/dashboard"
        className="text-sm font-medium text-teal-700 hover:underline"
      >
        ← Voltar ao dashboard
      </Link>

      <h1 className="mt-2 text-xl font-semibold text-gray-900">
        Atendimento do Paciente
      </h1>

      <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          Dados do Paciente
        </h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Nome</dt>
            <dd className="font-medium text-gray-900">
              {patient?.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Documento</dt>
            <dd className="font-medium text-gray-900">
              {patient?.document_id ? formatCpf(patient.document_id) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Data de Nascimento</dt>
            <dd className="font-medium text-gray-900">
              {patient?.birth_date ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Telefone</dt>
            <dd className="font-medium text-gray-900">
              {patient?.phone ?? "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-500">Aluno responsável</dt>
            <dd className="font-medium text-gray-900">{studentName}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          Anamnese
        </h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
          {record.anamnesis || "—"}
        </p>
      </section>

      <section className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          Exame Físico
        </h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
          {record.physical_exam || "—"}
        </p>
      </section>

      <CompleteRecordForm
        recordId={record.id}
        initialPlan={record.management_plan ?? ""}
        isCompleted={record.status === "completed"}
      />
    </div>
  );
}