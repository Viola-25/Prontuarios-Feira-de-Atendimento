"use client";

import { AppointmentWizard } from "./appointment-wizard";
import { parseAnamnesisText } from "./anamnesis-data";
import {
  btnPrimary,
  btnSecondary,
  cardClass,
  formatCpf,
  pageSubtitleClass,
  pageTitleClass,
} from "@/components/field-classes";
import { createClient } from "@/utils/supabase/client";
import {
  AlertTriangle,
  ChevronDown,
  ClipboardList,
  Loader2,
  PhoneOff,
  PlusCircle,
  Stethoscope,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type PendingPatient = {
  id: string;
  name: string;
  document_id: string | null;
  birth_date: string | null;
  phone: string | null;
};

export type PendingRecord = {
  id: string;
  status: string;
  anamnesis: string | null;
  physical_exam: string | null;
  patients: PendingPatient | PendingPatient[] | null;
};

export type HistoryRecord = {
  id: string;
  created_at: string;
  status: string;
  anamnesis: string | null;
  physical_exam: string | null;
  management_plan: string | null;
  patients: { id: string; name: string } | { id: string; name: string }[] | null;
  profiles:
    | { full_name: string }
    | { full_name: string }[]
    | null;
};

function single<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

type View = "active" | "new" | "history";

function navClass(active: boolean) {
  return `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
    active
      ? "bg-teal-50 text-teal-800 ring-1 ring-teal-200"
      : "text-slate-600 hover:bg-slate-50"
  }`;
}

export function StudentWorkspace({
  studentId,
  studentName,
  pendingRecord,
  history,
}: {
  studentId: string;
  studentName: string | null;
  pendingRecord: PendingRecord | null;
  history: HistoryRecord[];
}) {
  const router = useRouter();
  const [view, setView] = useState<View>(pendingRecord ? "active" : "new");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [patientPickKey, setPatientPickKey] = useState(0);

  const pendingPatient = single(pendingRecord?.patients);
  const pendingStatus = pendingRecord?.status ?? "draft";

  function handlePickSidebarPatient() {
    setView("active");
    setPatientPickKey((k) => k + 1);
  }

  const initials = (studentName ?? "A")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

  async function handleCancelCall() {
    if (!pendingRecord) return;
    setCanceling(true);
    setCancelError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("student_cancel_pending", {
        record_id: pendingRecord.id,
      });
      if (error) {
        throw new Error(
          "Não foi possível cancelar o chamado. Tente novamente."
        );
      }
      router.refresh();
    } catch (err) {
      setCancelError(
        err instanceof Error ? err.message : "Erro inesperado."
      );
      setCanceling(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
      <aside className="mb-6 lg:mb-0">
        <nav className="flex flex-col gap-1 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/50">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {studentName ?? "Aluno"}
              </p>
              <p className="text-xs text-slate-500">Aluno de medicina</p>
            </div>
          </div>

          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>

          {pendingRecord ? (
            <button
              type="button"
              onClick={handlePickSidebarPatient}
              className={navClass(view === "active")}
            >
              <Stethoscope className="h-5 w-5 shrink-0" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-semibold">
                  Em Atendimento
                </span>
                <span className="block truncate text-xs text-slate-500">
                  {pendingPatient?.name ?? "—"}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  pendingStatus === "draft"
                    ? "bg-slate-200 text-slate-600"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {pendingStatus === "draft" ? "Rascunho" : "Aguardando"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setView("new")}
              className={navClass(view === "new")}
            >
              <PlusCircle className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left text-sm font-semibold">
                Novo Atendimento
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setView("history")}
            className={navClass(view === "history")}
          >
            <ClipboardList className="h-5 w-5 shrink-0" />
            <span className="flex-1 text-left text-sm font-semibold">
              Pacientes Atendidos
            </span>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {history.length}
            </span>
          </button>
        </nav>
      </aside>

      <div className="min-w-0">
        {view === "active" && pendingRecord ? (
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className={pageTitleClass}>Em Atendimento</h1>
              {pendingStatus === "draft" ? (
                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  Rascunho
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  Aguardando preceptor
                </span>
              )}
            </div>

            {pendingStatus === "draft" ? (
              <>
                <p className={pageSubtitleClass}>
                  Prontuário em rascunho, ainda não enviado ao preceptor.
                </p>
                <div className="mt-6">
                  <AppointmentWizard
                    key={`${pendingRecord.id}-${patientPickKey}`}
                    mode="edit"
                    studentId={studentId}
                    recordId={pendingRecord.id}
                    initialPatient={pendingPatient}
                    initialAnamnesis={parseAnamnesisText(
                      pendingRecord.anamnesis ?? ""
                    )}
                    initialPhysicalExam={pendingRecord.physical_exam ?? ""}
                    onSaved={() => router.refresh()}
                  />
                </div>
              </>
            ) : (
              <>
                <p className={pageSubtitleClass}>
                  Este prontuário já foi chamado ao preceptor e está em
                  revisão. Para alterar algum dado, cancele o chamado
                  primeiro.
                </p>

                <section className={`${cardClass} mt-6 p-4 sm:p-5`}>
                  <h2 className="mb-3 text-base font-semibold text-slate-900">
                    Paciente
                  </h2>
                  <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">Nome</dt>
                      <dd className="font-medium text-slate-900">
                        {pendingPatient?.name ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Documento</dt>
                      <dd className="font-medium text-slate-900">
                        {pendingPatient?.document_id
                          ? formatCpf(pendingPatient.document_id)
                          : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Data de Nascimento</dt>
                      <dd className="font-medium text-slate-900">
                        {pendingPatient?.birth_date ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Telefone</dt>
                      <dd className="font-medium text-slate-900">
                        {pendingPatient?.phone ?? "—"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className={`${cardClass} mt-4 p-4 sm:p-5`}>
                  <h2 className="mb-3 text-base font-semibold text-slate-900">
                    Anamnese
                  </h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {pendingRecord.anamnesis || "—"}
                  </p>
                </section>

                <section className={`${cardClass} mt-4 p-4 sm:p-5`}>
                  <h2 className="mb-3 text-base font-semibold text-slate-900">
                    Exame Físico
                  </h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {pendingRecord.physical_exam || "—"}
                  </p>
                </section>

                {cancelError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                  >
                    {cancelError}
                  </p>
                )}

                {confirmCancel ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="flex items-start gap-2 text-sm text-amber-800">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                      <span>
                        O preceptor deixará de ver este prontuário. Você poderá
                        editar e chamar o preceptor novamente.
                      </span>
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(false)}
                        disabled={canceling}
                        className={`${btnSecondary} flex-1`}
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelCall}
                        disabled={canceling}
                        className={`${btnPrimary} flex-1`}
                      >
                        {canceling ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <PhoneOff className="h-5 w-5" />
                        )}
                        {canceling ? "Cancelando..." : "Confirmar cancelamento"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    className={`${btnSecondary} mt-6`}
                  >
                    <PhoneOff className="h-5 w-5" />
                    Cancelar chamado do preceptor
                  </button>
                )}
              </>
            )}
          </div>
        ) : view === "new" ? (
          <div>
            <h1 className={pageTitleClass}>Novo Atendimento</h1>
            <p className={pageSubtitleClass}>
              Primeiro cadastre ou selecione o paciente e depois preencha a
              anamnese.
            </p>
            <div className="mt-6">
              <AppointmentWizard
                mode="create"
                studentId={studentId}
                onSaved={() => {
                  setView("active");
                  router.refresh();
                }}
              />
            </div>
          </div>
        ) : (
          <div>
            <h1 className={pageTitleClass}>Pacientes Atendidos</h1>
            <p className={pageSubtitleClass}>
              {history.length === 0
                ? "Nenhum atendimento concluído até o momento."
                : `${history.length} atendimento(s) concluído(s).`}
            </p>

            {history.length === 0 ? (
              <div className={`${cardClass} mt-6 p-8 text-center`}>
                <ClipboardList className="mx-auto h-10 w-10 text-teal-300" />
                <p className="mt-3 text-sm text-slate-500">
                  Os atendimentos finalizados aparecerão aqui.
                </p>
              </div>
            ) : (
              <ul className="mt-6 space-y-3">
                {history.map((record) => {
                  const patient = single(record.patients);
                  const doctor = single(record.profiles);
                  const expanded = expandedId === record.id;

                  return (
                    <li key={record.id}>
                      <div className={`${cardClass} overflow-hidden`}>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expanded ? null : record.id)
                          }
                          className="flex w-full items-center gap-3 p-4 text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-semibold text-slate-900">
                              {patient?.name ?? "Paciente"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(record.created_at).toLocaleDateString(
                                "pt-BR"
                              )}
                              {doctor?.full_name
                                ? ` · Finalizado por ${doctor.full_name}`
                                : ""}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-semibold text-green-700">
                            Concluído
                          </span>
                          <ChevronDown
                            className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                              expanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {expanded && (
                          <div className="space-y-4 border-t border-slate-100 p-4 text-sm">
                            <div>
                              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Anamnese
                              </h3>
                              <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                                {record.anamnesis || "—"}
                              </p>
                            </div>
                            <div>
                              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Exame Físico
                              </h3>
                              <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                                {record.physical_exam || "—"}
                              </p>
                            </div>
                            <div>
                              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Conduta / Plano
                              </h3>
                              <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                                {record.management_plan || "—"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}