import { type ReactNode } from "react";
import { cardClass } from "@/components/field-classes";

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={`${cardClass} p-4 sm:p-5`}>
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}