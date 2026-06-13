import { ChangePasswordForm } from "@/components/hr/change-password-form";
import Link from "next/link";

export default function ChangePasswordPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl text-navy-950">Changer le mot de passe</h2>
        <Link href="/dashboard/profile" className="text-sm font-medium text-gold-700 hover:underline">
          ← Retour au profil
        </Link>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
