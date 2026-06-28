/** Affiche « Organisme (Client) » sur factures et proformas. */
export function formatInvoiceClientName(
  clientName: string,
  creditOrganizationName?: string | null,
): string {
  const client = clientName.trim();
  const org = creditOrganizationName?.trim();
  if (!org) return client;
  return `${org} (${client})`;
}
