export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:cursor-not-allowed disabled:bg-slate-50";

export const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";

export const cardClass =
  "rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50";

export const pageTitleClass = "text-2xl font-bold tracking-tight text-slate-900";

export const pageSubtitleClass = "mt-1 text-sm text-slate-500";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-base font-semibold text-white shadow-sm shadow-teal-600/30 transition hover:bg-teal-700 hover:shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

export const formatCpf = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
};