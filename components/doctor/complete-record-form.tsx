"use client";

import { createClient } from "@/utils/supabase/client";
import {
  btnPrimary,
  cardClass,
  inputClass,
  labelClass,
} from "@/components/field-classes";
import { CheckCircle2, Loader2, PenLine } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Props = {
  recordId: string;
  initialPlan: string;
  isCompleted: boolean;
  isCancelled: boolean;
};

export function CompleteRecordForm({
  recordId,
  initialPlan,
  isCompleted,
  isCancelled,
}: Props) {
  const [plan, setPlan] = useState(initialPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!plan.trim()) {
      setError(
        "Preencha a conduta / plano terapêutico antes de assinar o atendimento."
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: rpcError } = await supabase.rpc(
        "doctor_complete_record",
        {
          record_id: recordId,
          plan_text: plan.trim(),
        }
      );

      if (rpcError) {
        throw new Error(
          rpcError.message.includes("cancelado") ||
            rpcError.message.includes("indisponível")
            ? rpcError.message
            : "Erro ao finalizar o atendimento. Tente novamente."
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (isCompleted) {
    return (
      <section className={`${cardClass} mt-4 p-4 sm:p-5`}>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Conduta / Plano Terapêutico
        </h2>
        <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Este atendimento já foi finalizado.
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
          {plan || "—"}
        </p>
      </section>
    );
  }

  if (isCancelled) {
    return (
      <section className={`${cardClass} mt-4 p-4 sm:p-5`}>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          Conduta / Plano Terapêutico
        </h2>
        <p className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
          <PenLine className="h-4 w-4 shrink-0" />
          Este atendimento foi cancelado pelo aluno e não está mais
          disponível para finalização.
        </p>
      </section>
    );
  }

  return (
    <section className={`${cardClass} mt-4 p-4 sm:p-5`}>
      <h2 className="mb-3 text-base font-semibold text-slate-900">
        Conduta / Plano Terapêutico
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="management_plan" className={labelClass}>
            Conduta / Plano Terapêutico
          </label>
          <textarea
            id="management_plan"
            name="management_plan"
            rows={8}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="Descreva a conduta e o plano terapêutico a ser seguido..."
            className={inputClass}
            disabled={loading}
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {success ? (
          <div className="space-y-2">
            <p
              role="status"
              className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Atendimento assinado e finalizado com sucesso!
            </p>
            <Link
              href="/doctor/dashboard"
              className="block w-full rounded-xl border border-teal-600 px-4 py-3 text-center text-base font-semibold text-teal-700 transition hover:bg-teal-50"
            >
              Voltar ao dashboard
            </Link>
          </div>
        ) : (
          <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <PenLine className="h-5 w-5" />
            )}
            {loading ? "Finalizando..." : "Assinar e Finalizar Atendimento"}
          </button>
        )}
      </form>
    </section>
  );
}