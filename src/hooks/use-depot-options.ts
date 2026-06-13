"use client";

import { useEffect, useState } from "react";

export type DepotOption = { id: string; name: string };

/** Charge les dépôts actifs via /api/depots/options (fallback sur la liste serveur). */
export function useDepotOptions(initial: DepotOption[] = []) {
  const [depots, setDepots] = useState<DepotOption[]>(initial);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/depots/options");
        if (res.ok) {
          const rows = (await res.json()) as DepotOption[];
          if (!cancelled && Array.isArray(rows)) {
            setDepots(rows.length > 0 ? rows : initial);
            return;
          }
        }
        if (!cancelled) setDepots(initial);
      } catch {
        if (!cancelled) setDepots(initial);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // initial : valeur SSR au premier rendu uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { depots, loading };
}
