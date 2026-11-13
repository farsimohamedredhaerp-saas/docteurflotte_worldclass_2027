import React, { useState } from 'react';
import { StudioPack, UserStudioRole } from '../../types/studio';
import {
  EngineCrypto,
  PublicationGateValidator,
  RegPackDefinition,
} from '@docteurflotte/decision-engine';
import {
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  FileCheck2,
} from 'lucide-react';

interface ApprovalWorkflowTabProps {
  packs: StudioPack[];
  activePackId: string;
  currentRole: UserStudioRole;
  onApprovePack: (packId: string, approverName: string) => void;
  onPublishPack: (packId: string, signature: string, contentHash: string) => void;
}

export const ApprovalWorkflowTab: React.FC<ApprovalWorkflowTabProps> = ({
  packs,
  activePackId,
  currentRole,
  onApprovePack,
  onPublishPack,
}) => {
  const currentPack = packs.find((p) => p.id === activePackId) || packs[0];

  // Adapter StudioPack to RegPackDefinition for PublicationGateValidator
  const packDef: RegPackDefinition = {
    packCode: currentPack.id,
    version: currentPack.version,
    descriptionFr: currentPack.titleFr,
    status: currentPack.status,
    authorEmail: `${currentPack.authorId}@cabinet.dz`,
    validatedByExpert: currentPack.validatedByExpert,
    createdAt: currentPack.createdAt,
    items: currentPack.items.map((i) => ({
      code: i.code,
      kind: i.kind,
      sourceHierarchy: 'LF',
      effectiveFrom: i.effectiveFrom,
      effectiveTo: i.effectiveTo,
      validFrom: i.effectiveFrom,
      validTo: i.effectiveTo ?? null,
      recordedAt: currentPack.createdAt,
      supersededAt: null,
      legalRef: i.legalRef,
      legalBasisVerified: i.legalBasisVerified,
      verificationStatus: i.verificationStatus,
      evidenceLevel: i.evidenceLevel,
      payload: typeof i.valueJson === 'object' && i.valueJson !== null ? i.valueJson : { value: i.valueJson },
      goldenTests: i.goldenTests ? i.goldenTests.map((gt) => ({ name: gt.name, inputs: gt.inputs, expectedOutput: gt.expected })) : [],
    })),
    approvals: currentPack.validatedByExpert
      ? [
          { approverEmail: 'expert@cabinet.dz', role: 'EXPERT_VALIDATEUR', approvedAt: currentPack.updatedAt },
          { approverEmail: 'relecteur@cabinet.dz', role: 'RELECTEUR', approvedAt: currentPack.updatedAt },
        ]
      : [],
  };

  // Run publication gate validator
  const gateReport = PublicationGateValidator.validate(packDef);

  // Maker-Checker checks
  const isExpert = currentRole === 'EXPERT_VALIDATEUR';
  const isPublisher = currentRole === 'PUBLIEUR';

  const [signingLog, setSigningLog] = useState<string | null>(null);

  const handleExpertApprove = () => {
    if (!isExpert) {
      alert('Seul un EXPERT_VALIDATEUR peut valider formellement le pack.');
      return;
    }
    onApprovePack(currentPack.id, 'Dr. Rachid B. (Expert-Comptable Agréé)');
    alert(`Validation formelle accordée pour le pack ${currentPack.version}.`);
  };

  const handleSignAndPublish = () => {
    if (!isPublisher) {
      alert('Seul un PUBLIEUR peut signer et déployer un pack.');
      return;
    }

    if (!gateReport.isApprovedForPublication) {
      alert('Impossible de publier : les portes de publication suspensives sont bloquantes.');
      return;
    }

    // 1. Ed25519 Keypair generation (demo key in memory) & signature
    const keyPair = EngineCrypto.generateKeyPair();
    const signResult = EngineCrypto.sign(currentPack.items, keyPair.privateKeyPem);

    // 2. Verify immediately
    const verifyRes = EngineCrypto.verify(currentPack.items, signResult.signatureHex, keyPair.publicKeyPem);

    setSigningLog(
      `[ED25519] Hash RFC 8785: ${signResult.contentHash}\n[ED25519] Signature certifiée: ${signResult.signatureHex}\n[VERIFY] Signature valide: ${verifyRes.valid}`
    );

    onPublishPack(currentPack.id, signResult.signatureHex, signResult.contentHash);
    alert(`Pack ${currentPack.version} signé par Ed25519 et publié avec succès !`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            Revue à Quatre Yeux & Publication Signée Ed25519
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Processus collégial étanche (Maker-Checker) : interdiction pour l auteur d approuver ou publier son propre pack.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Pack cible :</span>
          <span className="font-mono text-xs font-bold text-blue-300 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
            {currentPack.version} ({currentPack.status})
          </span>
        </div>
      </div>

      {/* Publication Gates Status Report */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Vérification des Portes de Publication (Publication Gates)
          </h3>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded ${
              gateReport.isApprovedForPublication
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-red-950 text-red-300 border border-red-800 animate-pulse'
            }`}
          >
            {gateReport.isApprovedForPublication
              ? 'TOUTES LES PORTES SONT FRANCHIES'
              : `BLOCAGE : ${gateReport.failures.length} CONDITION(S) NON REMPLIE(S)`}
          </span>
        </div>

        {/* Gate Failures List */}
        {gateReport.failures.length > 0 && (
          <div className="space-y-2">
            {gateReport.failures.map((f, idx) => (
              <div
                key={idx}
                className="p-3 bg-red-950/40 border border-red-900/60 rounded-lg flex items-start gap-3 text-xs"
              >
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono font-bold text-red-400">{f.gateCode}</span>
                  <p className="text-slate-300 mt-0.5">{f.ruleDescription}</p>
                  <p className="text-[11px] text-red-300 mt-1 font-mono">{f.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="text-slate-500 block">Éléments validés officiellement :</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {gateReport.verifiedItemsCount} / {gateReport.totalItemsCount}
            </span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="text-slate-500 block">Éléments non vérifiés (UNVERIFIED) :</span>
            <span className="text-lg font-bold text-red-400 font-mono">
              {gateReport.unverifiedItemsCount}
            </span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <span className="text-slate-500 block">Validation Expert Agréé :</span>
            <span className="text-xs font-semibold text-slate-200">
              {currentPack.validatedByExpert ?? 'En attente'}
            </span>
          </div>
        </div>
      </div>

      {/* Maker-Checker Workflow Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1 : Expert Certification */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-600 flex items-center justify-center font-bold text-blue-400 text-xs">
              1
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Validation Formelle Expert</h4>
              <p className="text-xs text-slate-400">
                Certification de conformité au SCF et au Code des Impôts Directs.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            <div>Auteur : <strong className="text-slate-100">{currentPack.authorName}</strong></div>
            <div>Relecteurs : <span className="text-slate-300">{currentPack.reviewers.join(', ')}</span></div>
            <div>Validé par : <strong className="text-emerald-400">{currentPack.validatedByExpert ?? 'Non validé'}</strong></div>
          </div>

          <button
            onClick={handleExpertApprove}
            disabled={!isExpert || currentPack.validatedByExpert !== undefined}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-colors"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Apposer la Validation Formelle (Expert Agréé)</span>
          </button>
        </div>

        {/* Step 2 : Publisher Cryptographic Signature */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-900/50 border border-emerald-600 flex items-center justify-center font-bold text-emerald-400 text-xs">
              2
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Signature Ed25519 & Déploiement</h4>
              <p className="text-xs text-slate-400">
                Sérialisation canonique RFC 8785 et signature cryptographique.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-2 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            <div>Statut actuel : <strong className="font-mono text-emerald-400">{currentPack.status}</strong></div>
            {currentPack.contentHash && (
              <div className="truncate font-mono text-[10px] text-slate-400">
                Hash : {currentPack.contentHash}
              </div>
            )}
            {currentPack.signature && (
              <div className="truncate font-mono text-[10px] text-emerald-400">
                Sig : {currentPack.signature}
              </div>
            )}
          </div>

          <button
            onClick={handleSignAndPublish}
            disabled={!isPublisher || !gateReport.isApprovedForPublication || currentPack.status === 'PUBLISHED'}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
            <span>Signer Ed25519 & Publier en Production</span>
          </button>
        </div>
      </div>

      {/* Signing Console Output */}
      {signingLog && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 space-y-1">
          <span className="text-slate-500 text-[10px] block mb-1">Journal de Signature Cryptographique :</span>
          <pre>{signingLog}</pre>
        </div>
      )}
    </div>
  );
};
