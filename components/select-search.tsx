"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Item = { value: string; label: string; keywords?: string };

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  emptyLabel?: string; // ex: "Sem cliente"
  emptyValue?: string; // ex: "0"
  items: Item[];
  searchPlaceholder?: string;
  maxVisible?: number; // ex: 80
};

export function SelectSearch({
  value,
  onChange,
  placeholder = "Selecione",
  emptyLabel,
  emptyValue = "0",
  items,
  searchPlaceholder = "Buscar...",
  maxVisible = 80,
}: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items.slice(0, maxVisible);

    const res = items.filter((it) => {
      const base = (it.label + " " + (it.keywords || "")).toLowerCase();
      return base.includes(term);
    });

    return res.slice(0, maxVisible);
  }, [q, items, maxVisible]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent>
        <div className="p-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9"
          />
          <div className="mt-2 text-xs text-muted-foreground">
            Mostrando {filtered.length} de {items.length}
          </div>
        </div>

        {emptyLabel && <SelectItem value={emptyValue}>{emptyLabel}</SelectItem>}

        {filtered.length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum resultado</div>
        ) : (
          filtered.map((it) => (
            <SelectItem key={it.value} value={it.value}>
              {it.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
