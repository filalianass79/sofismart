export type DocumentPreviewType = "exit-voucher" | "delivery-note" | "sales-invoice" | "proforma";

export type CompanyDocumentBlock = {
  legalName: string;
  tradeName: string | null;
  legalForm: string | null;
  ice: string | null;
  rc: string | null;
  taxId: string | null;
  patent: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  bankName: string | null;
  bankAccount: string | null;
  logoUrl: string | null;
  documentNotes: string | null;
};

export type ClientDocumentBlock = {
  name: string;
  type: string;
  cin: string | null;
  ice: string | null;
  rc: string | null;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type VehicleDocumentBlock = {
  title: string;
  brand: string;
  model: string;
  version: string | null;
  year: number;
  mileage: number;
  color: string | null;
  plate: string | null;
  vin: string | null;
  fuel: string | null;
  transmission: string | null;
  origin: string | null;
  internalRef: string | null;
};

export type DocumentMetaItem = { label: string; value: string };

export type DocumentChecklistItem = { label: string; checked?: boolean };

export type ExitVoucherDocumentData = {
  type: "exit-voucher";
  company: CompanyDocumentBlock;
  id: string;
  reference: string;
  status: string;
  statusLabel: string;
  generatedAt: string;
  saleReference: string;
  depotName: string;
  warehouseUser: string | null;
  commercialName: string | null;
  instruction: string;
  client: ClientDocumentBlock;
  vehicle: VehicleDocumentBlock;
  meta: DocumentMetaItem[];
  checklist: DocumentChecklistItem[];
  qrScanUrl: string;
  pdfUrl: string | null;
  saleId: string;
};

export type DeliveryNoteDocumentData = {
  type: "delivery-note";
  company: CompanyDocumentBlock;
  id: string;
  reference: string;
  status: string;
  statusLabel: string;
  generatedAt: string;
  saleReference: string;
  exitVoucherReference: string | null;
  depotName: string;
  depotAddress: string | null;
  warehouseUser: string | null;
  clientMessage: string;
  client: ClientDocumentBlock;
  vehicle: VehicleDocumentBlock;
  meta: DocumentMetaItem[];
  checklist: DocumentChecklistItem[];
  qrScanUrl: string;
  pdfUrl: string | null;
  saleId: string;
};

export type SalesInvoiceLine = {
  designation: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  totalHt: number;
};

export type SalesInvoicePayment = {
  date: string;
  method: string;
  amount: number;
  reference: string | null;
};

export type SalesInvoiceDocumentData = {
  type: "sales-invoice";
  id: string;
  saleId: string;
  reference: string;
  invoiceNumber: string;
  status: string;
  statusLabel: string;
  invoiceDate: string;
  saleReference: string;
  saleType: string;
  commercialName: string | null;
  company: CompanyDocumentBlock;
  client: ClientDocumentBlock;
  vehicle: VehicleDocumentBlock;
  lines: SalesInvoiceLine[];
  totals: {
    priceHt: number;
    discount: number;
    baseHt: number;
    taxAmount: number;
    totalTtc: number;
    paid: number;
    balance: number;
  };
  payments: SalesInvoicePayment[];
  warranty: string | null;
  specialConditions: string | null;
  legalMentions: string[];
  pdfUrl: string | null;
};

export type ProformaDocumentLine = {
  designation: string;
  quantity: number;
  unitPriceHT: number;
  discount: number;
  taxRate: number;
  totalHT: number;
  totalTTC: number;
};

export type ProformaDocumentData = {
  type: "proforma";
  id: string;
  reference: string;
  status: string;
  statusLabel: string;
  proformaDate: string;
  validityDate: string;
  commercialName: string | null;
  company: CompanyDocumentBlock;
  client: ClientDocumentBlock;
  vehicle: VehicleDocumentBlock;
  lines: ProformaDocumentLine[];
  totals: {
    priceHT: number;
    accessoryFees: number;
    discount: number;
    baseHT: number;
    taxAmount: number;
    totalTTC: number;
  };
  paymentTerms: string | null;
  observations: string | null;
  legalMentions: string[];
  pdfUrl: string | null;
};

export type CommercialDocumentData =
  | ExitVoucherDocumentData
  | DeliveryNoteDocumentData
  | SalesInvoiceDocumentData
  | ProformaDocumentData;

export function parseDocumentPreviewType(raw: string): DocumentPreviewType | null {
  if (raw === "exit-voucher" || raw === "delivery-note" || raw === "sales-invoice" || raw === "proforma")
    return raw;
  return null;
}
