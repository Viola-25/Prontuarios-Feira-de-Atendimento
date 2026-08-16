import { NewAppointmentForm } from "@/components/student/new-appointment-form";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function StudentDashboard() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: activeRecord } = await supabase
    .from("medical_records")
    .select("id")
    .eq("student_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
      <h1 className="text-xl font-semibold text-gray-900">
        Novo Atendimento
      </h1>

      {activeRecord ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Você já possui um prontuário ativo aguardando a revisão do
          preceptor. Aguarde a finalização para criar um novo atendimento.
        </div>
      ) : (
        <>
          <p className="mb-6 mt-1 text-sm text-gray-600">
            Preencha os dados do atendimento e envie para o preceptor revisar.
          </p>
          <NewAppointmentForm studentId={user.id} />
        </>
      )}
    </div>
  );
}