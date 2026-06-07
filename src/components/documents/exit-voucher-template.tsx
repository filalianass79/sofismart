import type { ExitVoucherDocumentData } from "@/lib/documents/types";
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

export function ExitVoucherTemplate({
  data,
  scale = 1,
}: {
  data: ExitVoucherDocumentData;
  scale?: number;
}) {
  return (
    <DocumentLayout scale={scale}>
      <DocumentHeader
        company={data.company}
        title="BON DE SORTIE VÉHICULE"
        subtitle={data.reference}
        statusLabel={data.statusLabel}
        qrUrl={data.qrScanUrl}
      />
      <DocumentInfoGrid items={data.meta} />
      <DocumentSection title="Client">
        <DocumentClientBlock client={data.client} />
      </DocumentSection>
      <DocumentSection title="Véhicule">
        <DocumentVehicleBlock
          vehicle={data.vehicle}
          extra={[{ label: "Dépôt actuel", value: data.depotName }]}
        />
      </DocumentSection>
      <DocumentInstructionBox>{data.instruction}</DocumentInstructionBox>
      <DocumentSection title="Checklist magasinier">
        <DocumentChecklist items={data.checklist} />
      </DocumentSection>
      <DocumentSignatureBox
        labels={[
          "Signature magasinier",
          "Signature responsable / commercial",
          "Date & heure de sortie",
        ]}
      />
      <DocumentFooter company={data.company} />
    </DocumentLayout>
  );
}
