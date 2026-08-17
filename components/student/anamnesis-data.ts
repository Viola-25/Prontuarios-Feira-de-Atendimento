export type AnamnesisData = {
  chiefComplaint: string;
  hma: string;
  hmp: string;
  medications: string;
};

export const ANMNESIS_LABELS: Array<{
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

export function buildAnamnesisText(a: AnamnesisData): string {
  return ANMNESIS_LABELS.filter(({ key }) => a[key].trim().length > 0)
    .map(({ key, label }) => `${label}:\n${a[key]}`)
    .join("\n\n");
}

const LABEL_RE =
  /^(Queixa Principal|HMA — História da Moléstia Atual|HMP — História Médica Pregressa|Medicamentos em Uso):\n([\s\S]*)$/;

export function parseAnamnesisText(text: string): AnamnesisData {
  const empty: AnamnesisData = {
    chiefComplaint: "",
    hma: "",
    hmp: "",
    medications: "",
  };
  const result: AnamnesisData = { ...empty };
  let current: keyof AnamnesisData | null = null;

  for (const chunk of (text || "").split(/\n\n/)) {
    const m = chunk.match(LABEL_RE);
    if (m) {
      const entry = ANMNESIS_LABELS.find(({ label }) => label === m[1]);
      if (entry) {
        current = entry.key;
        result[current] = m[2].trim();
      }
    } else if (current) {
      result[current] = [result[current], chunk].filter(Boolean).join("\n\n");
    }
  }

  return result;
}