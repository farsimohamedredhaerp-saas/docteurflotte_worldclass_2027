import { WorkOrder } from '@docteurflotte/contracts';
import { DgiInvoiceData } from '@/components/finance/OfficialDgiInvoiceModal';

export interface BuildDgiInvoiceParams {
  workOrder: WorkOrder;
  hourlyRate: number;
  vatRateStandard: number;
  tenantCompanyName: string;
}

/**
 * Construit la structure de données d'une facture fiscale A4 conforme DGI Algérie
 * pour un ordre de travail clôturé ou en cours.
 */
export function buildWorkOrderDgiInvoice({
  workOrder: wo,
  hourlyRate,
  vatRateStandard,
  tenantCompanyName,
}: BuildDgiInvoiceParams): DgiInvoiceData {
  const laborHours = wo.actualLaborHours || wo.estimatedLaborHours || 2;
  const partsTotal = wo.partsCost || 0;

  const items = [
    {
      description: `Main d'œuvre atelier qualifiée : ${wo.title} (${wo.assetName || wo.assetCode})`,
      oemReference: 'MO-MEC-ATELIER-DZ',
      quantity: laborHours,
      unitPriceHtDzd: hourlyRate,
      totalHtDzd: laborHours * hourlyRate,
    },
  ];

  if (partsTotal > 0) {
    items.push({
      description: `Lot de pièces détachées d'origine et consommables certifiés OEM`,
      oemReference: wo.oemPartReference || 'OEM-KIT-PREVENTIF-DZ',
      quantity: 1,
      unitPriceHtDzd: partsTotal,
      totalHtDzd: partsTotal,
    });
  }

  const vatRatePercent = vatRateStandard ? Math.round(vatRateStandard * 100) : 19;

  return {
    invoiceNumber: `FAC-DGI-${new Date().getFullYear()}-${wo.id.slice(-5).toUpperCase()}`,
    issueDate: wo.completedAt || new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    paymentMode: 'VIREMENT_BANCAIRE',
    company: {
      legalName: tenantCompanyName || 'SOCIÉTÉ ALGÉRIENNE DE MAINTENANCE & SERVICES INDUSTRIELS EURL',
      tradeName: 'ATELIER MÉCANIQUE CENTRAL DOCTEURFLOTTE',
      address: 'Zone Industrielle Oued Smar, Voie B N° 14',
      wilayaName: 'Alger',
      wilayaCode: 16,
      nif: '001616098765432',
      nis: '00161609876',
      rcNumber: '16/00-9876543B22',
      aiNumber: '16098765432',
      bankAccountRib: '002 00016 1600012345 67 (BEA Rouiba)',
    },
    client: {
      legalName: 'ENTREPRISE NATIONALE DE LOGISTIQUE & TRANSPORT ROUTIER SPA',
      address: 'Zone d’Activité Dar El Beïda, Lot 42',
      wilayaName: 'Alger (16)',
      nif: '001616012345678',
      nis: '00161601234',
      rcNumber: '16/00-1234567B22',
      aiNumber: '16012345678',
    },
    items,
    vatRatePercent,
    applyStampDuty: false,
    discountDzd: 0,
  };
}

