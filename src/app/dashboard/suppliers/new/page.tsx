import { SupplierWizard } from "@/components/suppliers/supplier-wizard";

export default function NewSupplierPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h2 className="font-display text-3xl text-navy-950">Nouveau fournisseur</h2>
      <SupplierWizard />
    </div>
  );
}
