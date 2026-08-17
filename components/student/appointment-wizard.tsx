"use client";

import { createClient } from "@/utils/supabase/client";
import {
  btnPrimary,
  btnSecondary,
  formatCpf,
} from "@/components/field-classes";
import { ArrowLeft, ArrowRight, Loader2, Save, Send } from "lucide-react";
import { useRef, useState } from "react";
import { AnamnesisSection, type AnamnesisData } from "./anamnesis-section";
import { buildAnamnesisText } from "./anamnesis-data";
import {
  PatientSection,
  type Patient,
  type PatientSectionHandle,
} from "./patient-section";
import { PhysicalExamSection } from "./physical-exam-section";

const EMPTY_ANAMNESIS: AnamnesisData = {
  chiefComplaint: "",
  hma: "",
  hmp: "",
  medications: "",
};

type Props = {
  studentId: string;
  mode: "create" | "edit";
  recordId?: string;
  initialPatient?: Patient | null;
  initialAnamnesis?: AnamnesisData;
  initialPhysicalExam?: string;
  onSaved?: () => void;
};

export function AppointmentWizard({
  studentId,
  mode,
  recordId,
  initialPatient,
  initialAnamnesis,
  initialPhysicalExam,
  onSaved,
}: Props) {
  const patientRef = useRef<PatientSectionHandle>(null);

  const [step, setStep] = useState<1 | 2>(1);
  const [resolvedPatient, setResolvedPatient] = useState<Patient | null>(
    initialPatient ?? null
  );
  const [anamnesis, setAnamnesis] = useState<AnamnesisData>(
    initialAnamnesis ?? EMPTY_ANAMNESIS
  );
  const [physicalExam, setPhysicalExam] = useState(
    initialPhysicalExam ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastAction, setLastAction] = useState<"pending" | "draft" | null>(
    null
  );

  async function handleContinue() {
    setError(null);
    try {
      const patient = await patientRef.current!.resolvePatient();
      setResolvedPatient(patient);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await save("pending");
  }

  async function save(targetStatus: "pending" | "draft") {
    if (!resolvedPatient) {
      setError("Selecione o paciente antes de salvar.");
      return;
    }

    if (!anamnesis.chiefComplaint.trim()) {
      setError("Preencha a queixa principal para salvar o prontuário.");
      return;
    }

    setError(null);
    setSuccess(false);
    setLoading(true);
    setLastAction(targetStatus);

    try {
      const supabase = createClient();
      const payload = {
        patient_id: resolvedPatient.id,
        anamnesis: buildAnamnesisText(anamnesis),
        physical_exam: physicalExam,
      };

      if (mode === "create") {
        const { error: insertError } = await supabase
          .from("medical_records")
          .insert({
            ...payload,
            student_id: studentId,
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
      } else if (recordId) {
        const { error: updateError } = await supabase
          .from("medical_records")
          .update({ ...payload, status: targetStatus })
          .eq("id", recordId);

        if (updateError) {
          throw new Error(
            "Erro ao atualizar o prontuário. Tente novamente."
          );
        }
      }

      setSuccess(true);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {step === 1 ? (
        <>
          <PatientSection
            ref={patientRef}
            initialPatient={initialPatient ?? null}
          />

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleContinue}
            className={`${btnPrimary} w-full`}
          >
            Continuar
            <ArrowRight className="h-5 w-5" />
          </button>
        </>
      ) : (
        <>
          {resolvedPatient && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-600">
                  Paciente
                </p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {resolvedPatient.name}
                </p>
                <p className="text-xs text-slate-500">
                  {resolvedPatient.document_id
                    ? formatCpf(resolvedPatient.document_id)
                    : ""}
                  {resolvedPatient.birth_date
                    ? ` · ${resolvedPatient.birth_date}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-teal-100"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Trocar
              </button>
            </div>
          )}

          <AnamnesisSection value={anamnesis} onChange={setAnamnesis} />
          <PhysicalExamSection
            value={physicalExam}
            onChange={setPhysicalExam}
          />

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700"
            >
              {mode === "edit"
                ? lastAction === "draft"
                  ? "Rascunho salvo!"
                  : "Prontuário enviado ao preceptor!"
                : "Prontuário salvo e enviado para o preceptor!"}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className={`${btnSecondary} sm:w-40`}
            >
              <ArrowLeft className="h-5 w-5" />
              Voltar
            </button>

            {mode === "edit" ? (
              <>
                <button
                  type="button"
                  onClick={() => save("draft")}
                  disabled={loading}
                  className={`${btnSecondary} flex-1`}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {loading ? "Salvando..." : "Salvar rascunho"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`${btnPrimary} flex-1`}
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  {loading ? "Enviando..." : "Salvar e Enviar ao Preceptor"}
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`${btnPrimary} flex-1`}
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
            )}
          </div>
        </>
      )}
    </form>
  );
}