import { FormSection } from "./form-section";
import { inputClass, labelClass } from "@/components/field-classes";

export type AnamnesisData = {
  chiefComplaint: string;
  hma: string;
  hmp: string;
  medications: string;
};

const FIELDS: Array<{
  key: keyof AnamnesisData;
  label: string;
  placeholder: string;
  rows: number;
}> = [
  {
    key: "chiefComplaint",
    label: "Queixa Principal",
    placeholder: "Motivo da consulta em poucas palavras...",
    rows: 3,
  },
  {
    key: "hma",
    label: "HMA — História da Moléstia Atual",
    placeholder: "Evolução do quadro atual...",
    rows: 5,
  },
  {
    key: "hmp",
    label: "HMP — História Médica Pregressa",
    placeholder: "Doenças prévias, cirurgias, alergias...",
    rows: 5,
  },
  {
    key: "medications",
    label: "Medicamentos em Uso",
    placeholder: "Medicamentos, doses e posologia...",
    rows: 4,
  },
];

export function AnamnesisSection({
  value,
  onChange,
}: {
  value: AnamnesisData;
  onChange: (value: AnamnesisData) => void;
}) {
  return (
    <FormSection title="Anamnese">
      <div className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={field.key} className={labelClass}>
              {field.label}
            </label>
            <textarea
              id={field.key}
              name={field.key}
              rows={field.rows}
              value={value[field.key]}
              onChange={(e) =>
                onChange({ ...value, [field.key]: e.target.value })
              }
              placeholder={field.placeholder}
              className={inputClass}
            />
          </div>
        ))}
      </div>
    </FormSection>
  );
}