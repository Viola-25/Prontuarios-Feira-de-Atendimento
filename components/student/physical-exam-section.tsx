import { FormSection } from "./form-section";
import { inputClass, labelClass } from "@/components/field-classes";

export function PhysicalExamSection({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FormSection title="Exame Físico">
      <label htmlFor="physical_exam" className={labelClass}>
        Dados Vitais e Exame Geral
      </label>
      <textarea
        id="physical_exam"
        name="physical_exam"
        rows={8}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="PA, FC, FR, temperatura, peso, e descrição do exame geral..."
        className={inputClass}
      />
    </FormSection>
  );
}