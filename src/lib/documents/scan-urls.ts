function publicAppBaseUrl(): string {
  return process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

/** URLs de scan QR — sans dépendance serveur (safe pour loaders / client). */
export function exitVoucherScanUrl(secureToken: string): string {
  return `${publicAppBaseUrl()}/dashboard/warehouse/exit-vouchers/scan/${secureToken}`;
}

export function deliveryNoteScanUrl(qrToken: string): string {
  return `${publicAppBaseUrl()}/dashboard/warehouse/delivery-notes/scan/${qrToken}`;
}
