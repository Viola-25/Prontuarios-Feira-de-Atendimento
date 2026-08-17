"use client";

import { createClient } from "@/utils/supabase/client";
import { formatCpf, inputClass, labelClass } from "@/components/field-classes";
import { Search, X } from "lucide-react";
import { useEffect, useImperativeHandle, useMemo, useState } from "react";
import { FormSection } from "./form-section";

export type Patient = {
  id: string;
  name: string;
  document_id: string | null;
  birth_date: string | null;
  phone: string | null;
};

export type PatientSectionHandle = {
  resolvePatient: () => Promise<Patient>;
  selectPatient: (p: Patient) => void;
};

type Props = {
  ref: React.Ref<PatientSectionHandle>;
  initialPatient?: Patient | null;
};

export function PatientSection({ ref, initialPatient }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Patient[] | null>(null);
  const [patient, setPatient] = useState<Patient | null>(
    initialPatient ?? null
  );
  const [quickReg, setQuickReg] = useState({
    name: "",
    cpf: "",
    birth_date: "",
  });

  useEffect(() => {
    if (patient) return;

    const term = query.trim();
    let active = true;

    const timer = setTimeout(async () => {
      if (!term) {
        setSearching(false);
        setResults(null);
        return;
      }

      setSearching(true);
      const digits = term.replace(/\D/g, "");
      let queryBuilder;
      if (digits.length === 11) {
        queryBuilder = supabase
          .from("patients")
          .select("id, name, document_id, birth_date, phone")
          .eq("document_id", digits);
      } else {
        queryBuilder = supabase
          .from("patients")
          .select("id, name, document_id, birth_date, phone")
          .ilike("name", `%${term}%`);
      }

      const { data, error } = await queryBuilder.limit(10);

      if (!active) return;
      setSearching(false);
      if (error) {
        setResults([]);
        return;
      }
      setResults((data ?? []) as Patient[]);
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, patient, supabase]);

  function selectPatientInternal(p: Patient) {
    setPatient(p);
    setResults(null);
    setQuery("");
    setQuickReg((prev) => ({ ...prev, cpf: "" }));
  }

  useImperativeHandle(ref, () => ({
    selectPatient(p: Patient) {
      selectPatientInternal(p);
    },
    async resolvePatient() {
      if (patient) return patient;

      const cpf = (quickReg.cpf || query).replace(/\D/g, "");
      if (!quickReg.name.trim() || cpf.length !== 11 || !quickReg.birth_date) {
        throw new Error(
          "Selecione um paciente pela busca ou preencha nome, CPF e data de nascimento no cadastro rápido."
        );
      }

      const { data, error } = await supabase
        .from("patients")
        .insert({
          name: quickReg.name.trim(),
          document_id: cpf,
          birth_date: quickReg.birth_date,
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error("Erro ao cadastrar o paciente. Tente novamente.");
      }

      setPatient(data);
      setResults(null);
      return data;
    },
  }));

  return (
    <FormSection title="Paciente">
      {patient ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-teal-200 bg-teal-50 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {patient.name}
            </p>
            <p className="text-xs text-gray-600">
              {patient.document_id ? formatCpf(patient.document_id) : "—"}
              {patient.birth_date ? ` · ${patient.birth_date}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPatient(null)}
            aria-label="Trocar paciente"
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
            Trocar
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="patient_query" className={labelClass}>
              Buscar paciente
            </label>
            <input
              id="patient_query"
              type="text"
              placeholder="Digite o nome ou CPF do paciente"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={inputClass}
            />
          </div>

          {searching && (
            <p className="text-sm text-slate-500">Buscando...</p>
          )}

          {!searching && results !== null && results.length > 0 && (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => selectPatientInternal(p)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors hover:bg-teal-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {p.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {p.document_id ? formatCpf(p.document_id) : "—"}
                        {p.birth_date ? ` · ${p.birth_date}` : ""}
                      </span>
                    </span>
                    <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!searching && results !== null && results.length === 0 && (
            <p role="status" className="text-sm text-amber-700">
              Nenhum paciente encontrado com esse termo. Use o cadastro
              rápido abaixo.
            </p>
          )}

          <div className="rounded-xl border border-dashed border-slate-300 p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Cadastro rápido (paciente novo)
            </p>
            <div className="space-y-3">
              <div>
                <label htmlFor="qr_name" className={labelClass}>
                  Nome
                </label>
                <input
                  id="qr_name"
                  type="text"
                  value={quickReg.name}
                  onChange={(e) =>
                    setQuickReg((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nome completo do paciente"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="qr_cpf" className={labelClass}>
                  CPF
                </label>
                <input
                  id="qr_cpf"
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={quickReg.cpf}
                  onChange={(e) =>
                    setQuickReg((prev) => ({
                      ...prev,
                      cpf: formatCpf(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="qr_birth" className={labelClass}>
                  Data de Nascimento
                </label>
                <input
                  id="qr_birth"
                  type="date"
                  value={quickReg.birth_date}
                  onChange={(e) =>
                    setQuickReg((prev) => ({
                      ...prev,
                      birth_date: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </FormSection>
  );
}