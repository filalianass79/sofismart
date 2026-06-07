import type { DeliveryNoteDocumentData } from "@/lib/documents/types";
import {
  DocumentChecklist,
  DocumentClientBlock,
  DocumentFooter,
  DocumentHeader,
  DocumentInfoGrid,
  DocumentInstructionBox,
  DocumentLayout,
  DocumentSection,
  DocumentSignatureBox,
  DocumentVehicleBlock,
} from "./document-primitives";

export function DeliveryNoteTemplate({
  data,
  scale = 1,
}: {
  data: DeliveryNoteDocumentData;
  scale?: number;
}) {
  return (
    <DocumentLayout scale={scale}>
      <DocumentHeader
        company={data.company}
        title="BON DE LIVRAISON VÉHICULE"
        subtitle={data.reference}
        statusLabel={data.statusLabel}
        qrUrl={data.qrScanUrl}
      />
      <DocumentInfoGrid items={data.meta} />
      <DocumentSection title="Client">
        <DocumentClientBlock client={data.client} />
      </DocumentSection>
      <DocumentSection title="Véhicule">
        <DocumentVehicleBlock vehicle={data.vehicle} />
      </DocumentSection>
      <DocumentSection title="Livraison">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div>
            <dt className="text-navy-500">Dépôt</dt>
            <dd className="font-medium">{data.depotName}</dd>
          </div>
          <div>
            <dt className="text-navy-500">Magasinier</dt>
            <dd>{data.warehouseUser ?? "—"}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-navy-500">Lieu</dt>
            <dd>{data.depotAddress ?? data.depotName}</dd>
          </div>
        </dl>
      </DocumentSection>
      <DocumentInstructionBox>{data.clientMessage}</DocumentInstructionBox>
      <DocumentSection title="Checklist livraison">
        <DocumentChecklist items={data.checklist} />
      </DocumentSection>
      <DocumentSignatureBox
        labels={["Signature client", "Signature magasinier", "Responsable SOFISMART"]}
      />
      <DocumentFooter company={data.company} />
    </DocumentLayout>
  );
}
