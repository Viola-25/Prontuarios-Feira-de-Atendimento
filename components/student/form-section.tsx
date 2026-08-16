import { type ReactNode } from "react";

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}