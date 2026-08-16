"use client";

import { createClient } from "@/utils/supabase/client";
import { Loader2, Send } from "lucide-react";
import { useRef, useState } from "react";
import { AnamnesisSection, type AnamnesisData } from "./anamnesis-section";
import { PatientSection, type PatientSectionHandle } from "./patient-section";
import { PhysicalExamSection } from "./physical-exam-section";

type Props = {
  studentId: string;
};

const EMPTY_ANAMNESIS: AnamnesisData = {
  chiefComplaint: "",
  hma: "",
  hmp: "",
  medications: "",
};

function buildAnamnesisText(a: AnamnesisData): string {
  const parts: Array<[string, string]> = [
    ["Queixa Principal", a.chiefComplaint],
    ["HMA — História da Moléstia Atual", a.hma],
    ["HMP — História Médica Pregressa", a.hmp],
    ["Medicamentos em Uso", a.medications],
  ];

  return parts
    .filter(([, value]) => value.trim().length > 0)
    .map(([label, value]) => `${label}:\n${value}`)
    .join("\n\n");
}

export function NewAppointmentForm({ studentId }: Props) {
  const patientRef = useRef<PatientSectionHandle>(null);

  const [anamnesis, setAnamnesis] = useState(EMPTY_ANAMNESIS);
  const [physicalExam, setPhysicalExam] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!anamnesis.chiefComplaint.trim()) {
      setError("Preencha a queixa principal para salvar o prontuário.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data: existing } = await supabase
        .from("medical_records")
        .select("id")
        .eq("student_id", studentId)
        .eq("status", "pending")
        .maybeSingle();

      if (existing) {
        throw new Error(
          "Você já possui um prontuário ativo aguardando o preceptor."
        );
      }

      const patient = await patientRef.current!.resolvePatient();

      const { error: insertError } = await supabase.from("medical_records").insert({
        patient_id: patient.id,
        student_id: studentId,
        anamnesis: buildAnamnesisText(anamnesis),
        physical_exam: physicalExam,
        status: "pending",
      });

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error(
            "Você já possui um prontuário ativo aguardando o preceptor."
          );
        }
        throw new Error("Erro ao salvar o prontuário. Tente novamente.");
      }

      setAnamnesis(EMPTY_ANAMNESIS);
      setPhysicalExam("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <PatientSection ref={patientRef} />
      <AnamnesisSection value={anamnesis} onChange={setAnamnesis} />
      <PhysicalExamSection value={physicalExam} onChange={setPhysicalExam} />

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          Prontuário salvo e enviado para o preceptor!
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5" />
        )}
        {loading
          ? "Salvando..."
          : "Salvar Prontuário e Enviar para Preceptor"}
      </button>
    </form>
  );
}