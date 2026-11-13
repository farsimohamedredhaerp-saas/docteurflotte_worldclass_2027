/**
 * Magasin de Grand Livre en Mémoire & Gestionnaire d'Événements (Data Plane)
 * 
 * Implémente l'ensemble des règles comptables et cryptographiques du Grand Livre :
 * 1. Idempotence absolue des événements d'activité
 * 2. Numérotation continue des pièces sous verrou
 * 3. Équilibre comptable strict Débit = Crédit
 * 4. Immuabilité totale (interdiction de suppression ou modification d'écritures)
 * 5. Refus catégorique d'écritures en période close (CLOSED)
 * 6. Chaînage SHA-256 continu et scellement d'ancrage Merkle quotidien
 */

import { AlgeriaCalendar } from '../time/algeria-time.js';
import { EngineDecimal } from '../math/decimal.js';
import {
  EntityProfile,
  AccountingPeriod,
  PieceSequence,
  LedgerEntry,
  BusinessEvent,
  PostingSchemaItem,
  ChartOfAccounts,
  LedgerAnchor,
  JournalCode,
  ChainVerificationResult,
} from './ledger-types.js';
import { GENESIS_HASH, verifyChain, computeMerkleRoot, computeEntryHash } from './hashing.js';
import { PostingEngine, UnbalancedPieceError } from './posting-engine.js';

export class ClosedPeriodError extends Error {
  constructor(public readonly periodCode: string) {
    super(`REFUS D ÉCRITURE : La période comptable '${periodCode}' est définitivement clôturée (CLOSED). Aucune écriture ne peut y être enregistrée.`);
    this.name = 'ClosedPeriodError';
  }
}

export class DuplicateEventIgnoredResult {
  public readonly status = 'IGNORED_DUPLICATE';
  constructor(
    public readonly eventId: string,
    public readonly existingPieceNumber: string,
    public readonly entries: LedgerEntry[]
  ) {}
}

export interface ProcessEventResult {
  status: 'PROCESSED' | 'IGNORED_DUPLICATE';
  pieceNumber: string;
  entriesCreated: number;
  entries: LedgerEntry[];
}

export class InMemoryLedger {
  private profiles = new Map<string, EntityProfile>();
  private periods = new Map<string, AccountingPeriod>();
  private sequences = new Map<string, PieceSequence>();
  private events = new Map<string, { event: BusinessEvent; pieceNumber: string; entries: LedgerEntry[] }>();
  private entries: LedgerEntry[] = [];
  private anchors = new Map<string, LedgerAnchor>();
  private postingEngine = new PostingEngine();

  // 1. Profils d'entité
  public setProfile(profile: EntityProfile): void {
    this.profiles.set(profile.tenantId, profile);
  }

  public getProfile(tenantId: string): EntityProfile | undefined {
    return this.profiles.get(tenantId);
  }

  // 2. Périodes comptables
  public createPeriod(period: AccountingPeriod): void {
    this.periods.set(period.id, period);
  }

  public getPeriod(periodId: string): AccountingPeriod | undefined {
    return this.periods.get(periodId);
  }

  public findPeriodForDate(tenantId: string, localDate: string): AccountingPeriod | undefined {
    for (const period of this.periods.values()) {
      if (period.tenantId === tenantId && period.startDate <= localDate && period.endDate >= localDate) {
        return period;
      }
    }
    return undefined;
  }

  public closePeriod(periodId: string, closedBy: string): void {
    const period = this.periods.get(periodId);
    if (!period) throw new Error(`Période ${periodId} introuvable.`);
    period.status = 'CLOSED';
    period.closedAt = new Date().toISOString();
    period.closedBy = closedBy;
  }

  public softClosePeriod(periodId: string): void {
    const period = this.periods.get(periodId);
    if (!period) throw new Error(`Période ${periodId} introuvable.`);
    period.status = 'SOFT_CLOSED';
  }

  // 3. Séquenceur de numérotation continue
  public nextPieceNumber(tenantId: string, fiscalYear: number, journalCode: JournalCode): string {
    const seqKey = `${tenantId}:${fiscalYear}:${journalCode}`;
    let seq = this.sequences.get(seqKey);
    if (!seq) {
      seq = { tenantId, fiscalYear, journalCode, lastNumber: 0 };
      this.sequences.set(seqKey, seq);
    }

    seq.lastNumber += 1;
    const numStr = String(seq.lastNumber).padStart(6, '0');
    return `${journalCode}-${fiscalYear}-${numStr}`;
  }

  // 4. Dernier hash pour un tenant
  public getLastHash(tenantId: string): string {
    const tenantEntries = this.entries.filter((e) => e.tenantId === tenantId);
    if (tenantEntries.length === 0) {
      return GENESIS_HASH;
    }
    return tenantEntries[tenantEntries.length - 1].hash;
  }

  // 5. Traitement d'un événement d'activité
  public processEvent(
    event: BusinessEvent,
    schema: PostingSchemaItem,
    chart: ChartOfAccounts,
    packHash: string
  ): ProcessEventResult {
    const eventKey = `${event.tenantId}:${event.eventId}`;

    // A. Idempotence : si l'événement a déjà été traité, ne rien dupliquer
    const existing = this.events.get(eventKey);
    if (existing) {
      return {
        status: 'IGNORED_DUPLICATE',
        pieceNumber: existing.pieceNumber,
        entriesCreated: 0,
        entries: existing.entries,
      };
    }

    // B. Détermination de la date locale Africa/Algiers
    const localDate = event.localDate || AlgeriaCalendar.toLocalDate(event.occurredAt);

    // C. Résolution de la période comptable
    const period = this.findPeriodForDate(event.tenantId, localDate);
    if (!period) {
      throw new Error(`Aucune période comptable ouverte trouvée pour le tenant ${event.tenantId} à la date locale ${localDate}.`);
    }

    // D. Refus en période close
    if (period.status === 'CLOSED') {
      throw new ClosedPeriodError(period.periodCode);
    }

    // E. Attribution du numéro de pièce séquentiel
    const pieceNumber = this.nextPieceNumber(event.tenantId, period.fiscalYear, schema.journalCode);

    // F. Génération des écritures équilibrées et chaînées
    const lastHash = this.getLastHash(event.tenantId);
    const context = {
      tenantId: event.tenantId,
      periodId: period.id,
      pieceNumber,
      localDate,
      recordedAt: new Date().toISOString(),
      packHash: period.packHash || packHash,
      lastHash,
    };

    const newEntries = this.postingEngine.generateEntries(event, schema, chart, context);

    // G. Enregistrement en Grand Livre (append-only)
    for (const entry of newEntries) {
      this.entries.push(entry);
    }

    // H. Enregistrement de l'événement pour l'idempotence
    this.events.set(eventKey, {
      event,
      pieceNumber,
      entries: newEntries,
    });

    return {
      status: 'PROCESSED',
      pieceNumber,
      entriesCreated: newEntries.length,
      entries: newEntries,
    };
  }

  // 6. Insertion manuelle d'une pièce avec vérification d'équilibre
  public insertPiece(
    tenantId: string,
    periodId: string,
    pieceNumber: string,
    localDate: string,
    packHash: string,
    lines: Array<{
      accountRole: any;
      accountNumber: string;
      label: string;
      debit: string | null;
      credit: string | null;
      amountHt?: string | null;
      vatAmount?: string | null;
      paymentMode?: any;
      collectionDate?: string;
      segmentCode?: string;
    }>
  ): LedgerEntry[] {
    const period = this.periods.get(periodId);
    if (!period) throw new Error(`Période introuvable : ${periodId}`);
    if (period.status === 'CLOSED') {
      throw new ClosedPeriodError(period.periodCode);
    }

    let totalDebit = new EngineDecimal('0');
    let totalCredit = new EngineDecimal('0');

    for (const l of lines) {
      if (l.debit) totalDebit = totalDebit.plus(new EngineDecimal(l.debit));
      if (l.credit) totalCredit = totalCredit.plus(new EngineDecimal(l.credit));
    }

    const diff = totalDebit.minus(totalCredit).abs();
    if (!diff.isZero()) {
      throw new UnbalancedPieceError(pieceNumber, totalDebit.toFixed(2), totalCredit.toFixed(2), diff.toFixed(2));
    }

    const created: LedgerEntry[] = [];
    let currentHash = this.getLastHash(tenantId);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      const hash = computeEntryHash({
        prevHash: currentHash,
        tenantId,
        pieceNumber,
        lineNumber,
        localDate,
        accountNumber: line.accountNumber,
        accountRole: line.accountRole,
        debit: line.debit,
        credit: line.credit,
        amountHt: line.amountHt ?? null,
        vatAmount: line.vatAmount ?? null,
        paymentMode: line.paymentMode ?? null,
        collectionDate: line.collectionDate ?? null,
        segmentCode: line.segmentCode ?? null,
        packHash,
      });

      const entry: LedgerEntry = {
        id: `${pieceNumber}-${lineNumber}`,
        tenantId,
        periodId,
        pieceNumber,
        lineNumber,
        localDate,
        recordedAt: new Date().toISOString(),
        accountRole: line.accountRole,
        accountNumber: line.accountNumber,
        label: line.label,
        debit: line.debit,
        credit: line.credit,
        amountHt: line.amountHt ?? null,
        vatAmount: line.vatAmount ?? null,
        paymentMode: line.paymentMode,
        collectionDate: line.collectionDate,
        segmentCode: line.segmentCode,
        tags: [],
        prevHash: currentHash,
        hash,
        status: 'VALIDATED',
        packHash,
      };

      this.entries.push(entry);
      created.push(entry);
      currentHash = hash;
    }

    return created;
  }

  // 7. Contre-passation d'une pièce comptable (correction sans suppression)
  public reversePiece(
    tenantId: string,
    originalPieceNumber: string,
    reason: string
  ): LedgerEntry[] {
    const origEntries = this.entries.filter(
      (e) => e.tenantId === tenantId && e.pieceNumber === originalPieceNumber && e.status === 'VALIDATED'
    );

    if (origEntries.length === 0) {
      throw new Error(`Aucune écriture validée trouvée pour la pièce ${originalPieceNumber} à contre-passer.`);
    }

    const firstEntry = origEntries[0];
    const period = this.periods.get(firstEntry.periodId);
    if (!period) throw new Error(`Période introuvable pour la pièce ${originalPieceNumber}.`);
    if (period.status === 'CLOSED') {
      throw new ClosedPeriodError(period.periodCode);
    }

    // Marquer les écritures originales comme REVERSED
    for (const e of origEntries) {
      e.status = 'REVERSED';
    }

    // Créer la nouvelle pièce de contre-passation (inversion stricte des débits et crédits)
    const revPieceNumber = `REV-${originalPieceNumber}`;
    const newEntries: LedgerEntry[] = [];
    let currentPrevHash = this.getLastHash(tenantId);
    const recordedAt = new Date().toISOString();

    for (let i = 0; i < origEntries.length; i++) {
      const orig = origEntries[i];
      const lineNumber = i + 1;
      const revDebit = orig.credit; // Inversion : l'ancien crédit devient débit
      const revCredit = orig.debit; // L'ancien débit devient crédit

      const hash = computeEntryHash({
        prevHash: currentPrevHash,
        tenantId,
        pieceNumber: revPieceNumber,
        lineNumber,
        localDate: orig.localDate,
        accountNumber: orig.accountNumber,
        accountRole: orig.accountRole,
        debit: revDebit,
        credit: revCredit,
        amountHt: orig.amountHt,
        vatAmount: orig.vatAmount,
        paymentMode: orig.paymentMode ?? null,
        collectionDate: orig.collectionDate ?? null,
        segmentCode: orig.segmentCode ?? null,
        packHash: orig.packHash,
      });

      const revEntry: LedgerEntry = {
        id: `${revPieceNumber}-${lineNumber}`,
        tenantId,
        periodId: orig.periodId,
        pieceNumber: revPieceNumber,
        lineNumber,
        localDate: orig.localDate,
        recordedAt,
        accountRole: orig.accountRole,
        accountNumber: orig.accountNumber,
        label: `CONTRE-PASSATION [${originalPieceNumber}] : ${reason}`,
        debit: revDebit,
        credit: revCredit,
        amountHt: orig.amountHt,
        vatAmount: orig.vatAmount,
        paymentMode: orig.paymentMode,
        collectionDate: orig.collectionDate,
        segmentCode: orig.segmentCode,
        tags: ['REVERSAL'],
        prevHash: currentPrevHash,
        hash,
        status: 'VALIDATED',
        reversedEntryId: orig.id,
        packHash: orig.packHash,
      };

      this.entries.push(revEntry);
      newEntries.push(revEntry);
      currentPrevHash = hash;
    }

    return newEntries;
  }

  // 8. Consultation du Grand Livre (filtrage multi-tenant)
  public getEntries(tenantId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.tenantId === tenantId);
  }

  // 9. Vérification de la chaîne SHA-256
  public verifyTenantChain(tenantId: string): ChainVerificationResult {
    const tenantEntries = this.entries.filter((e) => e.tenantId === tenantId);
    return verifyChain(tenantEntries);
  }

  // 10. Scellement Merkle quotidien
  public sealDailyAnchor(tenantId: string, anchorDate: string): LedgerAnchor {
    const dailyEntries = this.entries.filter((e) => e.tenantId === tenantId && e.localDate === anchorDate);
    if (dailyEntries.length === 0) {
      throw new Error(`Aucune écriture comptable trouvée au ${anchorDate} pour scellement Merkle.`);
    }

    const hashes = dailyEntries.map((e) => e.hash);
    const merkleRoot = computeMerkleRoot(hashes);
    const lastHash = dailyEntries[dailyEntries.length - 1].hash;

    const anchor: LedgerAnchor = {
      id: `ANCHOR-${tenantId}-${anchorDate}`,
      tenantId,
      anchorDate,
      merkleRoot,
      entriesCount: dailyEntries.length,
      lastEntryHash: lastHash,
      sealedAt: new Date().toISOString(),
    };

    this.anchors.set(`${tenantId}:${anchorDate}`, anchor);
    return anchor;
  }

  public getDailyAnchor(tenantId: string, anchorDate: string): LedgerAnchor | undefined {
    return this.anchors.get(`${tenantId}:${anchorDate}`);
  }

  // 11. Invariant mathématique global (Somme des débits == Somme des crédits)
  public computeTotals(tenantId: string): { totalDebit: string; totalCredit: string; isBalanced: boolean } {
    const tenantEntries = this.entries.filter((e) => e.tenantId === tenantId && e.status !== 'VOID');
    let sumDebit = new EngineDecimal('0');
    let sumCredit = new EngineDecimal('0');

    for (const e of tenantEntries) {
      if (e.debit) sumDebit = sumDebit.plus(new EngineDecimal(e.debit));
      if (e.credit) sumCredit = sumCredit.plus(new EngineDecimal(e.credit));
    }

    return {
      totalDebit: sumDebit.toFixed(2),
      totalCredit: sumCredit.toFixed(2),
      isBalanced: sumDebit.equals(sumCredit),
    };
  }

  // 12. Simulation d'altération (pour les tests de détection de rupture d'intégrité)
  public tamperEntryForTesting(tenantId: string, pieceNumber: string, lineNumber: number, newDebit: string): void {
    const target = this.entries.find(
      (e) => e.tenantId === tenantId && e.pieceNumber === pieceNumber && e.lineNumber === lineNumber
    );
    if (target) {
      target.debit = newDebit;
    }
  }
}
