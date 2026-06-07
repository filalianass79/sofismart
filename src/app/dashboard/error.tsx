"use client";

import { useEffect } from "react";
import { DatabaseUnavailable } from "@/components/dashboard/database-unavailable";
import { databaseConnectionMessage, isDatabaseConnectionError } from "@/lib/prisma-errors";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDb = isDatabaseConnectionError(error);

  return (
    <div className="space-y-4">
      <DatabaseUnavailable message={isDb ? databaseConnectionMessage(error) : error.message} />
      {!isDb && (
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
