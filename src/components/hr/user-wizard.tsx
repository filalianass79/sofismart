"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Stepper } from "@/components/ui/stepper";
import { WizardActions } from "@/components/ui/wizard-actions";
import { LoadingOverlay } from "@/components/ui/loading";
import { createUserSchema } from "@/lib/validations/user-account";
import { scrollPageToTop } from "@/lib/scroll-to-top";
import { useFormFeedback } from "@/hooks/use-form-feedback";

type FormValues = {
  employeeId: string;
  email: string;
  username?: string;
  roleId: string;
  password?: string;
  generateTemporary?: boolean;
};

const steps = [
  { id: "employee", label: "Salarié", hint: "Lier un salarié sans compte" },
  { id: "account", label: "Compte", hint: "Email et mot de passe" },
  { id: "role", label: "Rôle", hint: "Profil et droits par défaut" },
  { id: "summary", label: "Récapitulatif", hint: "Créer le compte" },
];

type Employee = {
  id: string;
  reference: string;
  firstName: string;
  lastName: string;
  professionalEmail: string | null;
  personalEmail: string | null;
  phone: string | null;
  jobFunction: string;
};

type Role = { id: string; code: string; name: string };

export function UserWizard({
  employees,
  roles,
  onSuccess,
  onCancel,
}: {
  employees: Employee[];
  roles: Role[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const { handleSubmitInvalid, reportApiError } = useFormFeedback();

  const form = useForm<FormValues>({
    resolver: zodResolver(createUserSchema) as never,
    defaultValues: { generateTemporary: true },
  });

  const { register, watch, handleSubmit } = form;
  const employeeId = watch("employeeId");
  const roleId = watch("roleId");
  const employee = employees.find((e) => e.id === employeeId);
  const role = roles.find((r) => r.id === roleId);
  const values = watch();

  const summaries = useMemo(
    () => [
      employee
        ? [`${employee.firstName} ${employee.lastName}`, employee.jobFunction]
        : [],
      [values.email, values.generateTemporary ? "Mot de passe temporaire" : "Mot de passe défini"],
      [role?.name ?? "—"],
      [employee ? `${employee.firstName} ${employee.lastName}` : "—", values.email, role?.name ?? "—"],
    ],
    [employee, values, role]
  );

  async function onSubmit(data: FormValues) {
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      reportApiError(j, "Erreur création compte");
      return;
    }
    const j = await res.json();
    if (j.temporaryPassword) {
      setTempPassword(j.temporaryPassword);
      scrollPageToTop();
    } else if (onSuccess) onSuccess();
    else router.push(`/dashboard/settings/users/${j.id}`);
    router.refresh();
  }

  if (tempPassword) {
    return (
      <div className="rounded-xl border border-gold-500/40 bg-gold-500/10 p-6 space-y-3">
        <p className="font-semibold text-navy-900">Compte créé</p>
        <p className="text-sm">
          Mot de passe temporaire : <code className="rounded bg-white px-2 py-1">{tempPassword}</code>
        </p>
        <button
          type="button"
          onClick={() => (onSuccess ? onSuccess() : router.push("/dashboard/settings/users"))}
          className="btn-sofi-primary"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, handleSubmitInvalid)} className="relative space-y-6">
      {loading && <LoadingOverlay label="Création du compte…" />}
      <Stepper steps={steps} current={step} summaries={summaries} onStepClick={(i) => setStep(i)} />

      {step === 0 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6">
          <label className="block text-sm">
            Salarié sans compte *
            <select {...register("employeeId")} className="input-sofi mt-1 w-full">
              <option value="">— Sélectionner —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.reference} — {e.firstName} {e.lastName}
                </option>
              ))}
            </select>
          </label>
          {employee && (
            <dl className="mt-4 text-sm text-navy-600 space-y-1">
              <p>Fonction : {employee.jobFunction}</p>
              <p>Tél. : {employee.phone ?? "—"}</p>
              <p>Email : {employee.professionalEmail ?? employee.personalEmail ?? "—"}</p>
            </dl>
          )}
        </section>
      )}

      {step === 1 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6 grid gap-3">
          <label className="text-sm">
            Email connexion *
            <input type="email" {...register("email")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="text-sm">
            Nom utilisateur
            <input {...register("username")} className="input-sofi mt-1 w-full" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("generateTemporary")} className="rounded" />
            Générer mot de passe temporaire
          </label>
          {!watch("generateTemporary") && (
            <label className="text-sm">
              Mot de passe
              <input type="password" {...register("password")} className="input-sofi mt-1 w-full" />
            </label>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="rounded-xl border border-navy-950/10 bg-white p-6">
          <label className="block text-sm">
            Rôle *
            <select {...register("roleId")} className="input-sofi mt-1 w-full">
              <option value="">—</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </label>
          <p className="mt-3 text-xs text-navy-500">
            Les permissions personnalisées peuvent être ajustées après création depuis la fiche utilisateur.
          </p>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-xl border border-gold-500/30 bg-gold-500/5 p-6 text-sm space-y-2">
          <p>
            <strong>Salarié :</strong> {employee ? `${employee.firstName} ${employee.lastName}` : "—"}
          </p>
          <p>
            <strong>Email :</strong> {values.email}
          </p>
          <p>
            <strong>Rôle :</strong> {role?.name ?? "—"}
          </p>
        </section>
      )}

      <WizardActions
        step={step}
        totalSteps={steps.length}
        onPrev={() => setStep((s) => s - 1)}
        onNext={() => setStep((s) => s + 1)}
        onCancel={() => (onCancel ? onCancel() : router.back())}
        loading={loading}
        showDraft={false}
        submitLabel="Créer l'utilisateur"
      />
    </form>
  );
}
