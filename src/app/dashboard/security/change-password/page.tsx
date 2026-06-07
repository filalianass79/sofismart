import { ChangePasswordForm } from "@/components/hr/change-password-form";

export default function ChangePasswordPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl text-navy-950">Changer le mot de passe</h2>
      <ChangePasswordForm />
    </div>
  );
}
