import { FormSection } from "./form-section";
import { inputClass, labelClass } from "@/components/field-classes";
import { ANMNESIS_LABELS, type AnamnesisData } from "./anamnesis-data";

export type { AnamnesisData } from "./anamnesis-data";

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
        {ANMNESIS_LABELS.map((field) => (
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