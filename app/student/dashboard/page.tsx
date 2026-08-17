import {
  StudentWorkspace,
  type HistoryRecord,
  type PendingRecord,
} from "@/components/student/student-workspace";
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

  const { data: pending } = await supabase
    .from("medical_records")
    .select(
      "id, status, anamnesis, physical_exam, patients(id, name, document_id, birth_date, phone)"
    )
    .eq("student_id", user.id)
    .in("status", ["draft", "pending"])
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: history } = await supabase
    .from("medical_records")
    .select(
      "id, created_at, status, anamnesis, physical_exam, management_plan, patients(id, name), profiles!medical_records_doctor_id_fkey(full_name)"
    )
    .eq("student_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  return (
    <StudentWorkspace
      studentId={user.id}
      studentName={profile?.full_name ?? null}
      pendingRecord={pending as PendingRecord | null}
      history={(history ?? []) as HistoryRecord[]}
    />
  );
}