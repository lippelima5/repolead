type LeadIdentityCsv = {
  type: string;
  value: string;
};

type LeadCsvRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  tags_json: unknown;
  created_at: Date;
  updated_at: Date;
  identities: LeadIdentityCsv[];
};

const LEAD_CSV_HEADERS = [
  "id",
  "name",
  "email",
  "phone",
  "status",
  "tags",
  "created_at",
  "updated_at",
  "identities",
] as const;

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const base = String(value).replaceAll('"', '""');
  return /[",;\n]/.test(base) ? `"${base}"` : base;
}

function mapTags(value: unknown) {
  if (!Array.isArray(value)) {
    return "";
  }

  return value.filter((item) => typeof item === "string").join("|");
}

function mapIdentities(identities: LeadIdentityCsv[]) {
  return identities.map((item) => `${item.type}:${item.value}`).join("|");
}

export function serializeLeadsToCsv(rows: LeadCsvRow[]) {
  const lines = rows.map((row) =>
    [
      row.id,
      row.name ?? "",
      row.email ?? "",
      row.phone ?? "",
      row.status,
      mapTags(row.tags_json),
      row.created_at.toISOString(),
      row.updated_at.toISOString(),
      mapIdentities(row.identities),
    ]
      .map((value) => stringifyValue(value))
      .join(","),
  );

  return `\uFEFF${LEAD_CSV_HEADERS.join(",")}\n${lines.join("\n")}`;
}
