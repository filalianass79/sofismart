"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ProformaPrintPage() {
  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    fetch(`/api/proformas/${id}/print`, { method: "POST" }).finally(() => {
      window.print();
    });
  }, [id]);

  return (
    <div className="p-6 print:hidden">
      <p className="text-sm text-navy-600">Préparation impression…</p>
      <iframe
        title="Proforma PDF"
        src={`/api/proformas/${id}/download`}
        className="mt-4 h-[80vh] w-full rounded border"
      />
      <Link href={`/dashboard/proformas/${id}`} className="mt-4 inline-block text-sm text-gold-800">
        Retour
      </Link>
    </div>
  );
}
