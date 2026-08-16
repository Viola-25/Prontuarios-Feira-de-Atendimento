"use client";

import { createClient } from "@/utils/supabase/client";
import { Search, X } from "lucide-react";
import { useImperativeHandle, useRef, useState } from "react";
import { formatCpf, inputClass, labelClass } from "@/components/field-classes";
import { FormSection } from "./form-section";

type Patient = {
  id: string;
  name: string;
  document_id: string | null;
  birth_date: string | null;
  phone: string | null;
};

export type PatientSectionHandle = {
  resolvePatient: () => Promise<Patient>;
};

type Props = {
  ref: React.Ref<PatientSectionHandle>;
};

export function PatientSection({ ref }: Props) {
  const supabase = useRef(createClient()).current;

  const [searchCpf, setSearchCpf] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [quickReg, setQuickReg] = useState({
    name: "",
    cpf: "",
    birth_date: "",
  });

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cpf = searchCpf.replace(/\D/g, "");

    if (cpf.length !== 11) {
      setSearchMessage("Informe um CPF válido com 11 dígitos.");
      return;
    }

    setSearching(true);
    setSearchMessage(null);

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("document_id", cpf)
      .maybeSingle();

    setSearching(false);

    if (error) {
      setSearchMessage("Erro ao buscar paciente. Tente novamente.");
      return;
    }

    if (data) {
      setPatient(data);
      setQuickReg((prev) => ({ ...prev, cpf: "" }));
    } else {
      setPatient(null);
      setQuickReg((prev) => ({ ...prev, cpf: formatCpf(cpf) }));
      setSearchMessage("Paciente não encontrado. Preencha o cadastro rápido abaixo.");
    }
  }

  useImperativeHandle(ref, () => ({
    async resolvePatient() {
      if (patient) return patient;

      const cpf = (quickReg.cpf || searchCpf).replace(/\D/g, "");
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
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="search_cpf" className={labelClass}>
                Buscar por CPF
              </label>
              <input
                id="search_cpf"
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={searchCpf}
                onChange={(e) => setSearchCpf(formatCpf(e.target.value))}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="mt-6 inline-flex h-[50px] shrink-0 items-center gap-1.5 rounded-md bg-teal-700 px-4 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="h-4 w-4" />
              {searching ? "..." : "Buscar"}
            </button>
          </form>

          {searchMessage && (
            <p role="status" className="text-sm text-amber-700">
              {searchMessage}
            </p>
          )}

          <div className="rounded-md border border-dashed border-gray-300 p-3">
            <p className="mb-3 text-sm font-medium text-gray-700">
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