-- =============================================================================
-- FICHIER : database/migrations/20_fiscal_rules_control_5_8.sql
-- OBJET   : Extension Module G : Règles de Contrôle Fiscal Section 5 (Règles 5 à 8)
-- SOUVERAINETÉ : DGI Algérie, Art. 64 CPF, Art. 13/14 TCA (Fait Générateur Débit/Encaissement),
--               Art. 30 TCA & CIDTA (Plafond Espèces 1 000 000 DZD),
--               Art. 141-2 CIDTA (Plafond Amortissement VP 3 000 000 DZD) & Tableau 9 SCF
-- =============================================================================

BEGIN;

-- 1. Fait Générateur Hybride & Statut d'Encaissement sur fiscal_documents (Règle 7)
ALTER TABLE fiscal_documents
    ADD COLUMN IF NOT EXISTS vat_tax_point VARCHAR(20) NOT NULL DEFAULT 'DEBIT', -- 'DEBIT' ou 'ENCAISSEMENT'
    ADD COLUMN IF NOT EXISTS is_settled BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE si encaissé/réglé, FALSE si attente
    ADD COLUMN IF NOT EXISTS settlement_date DATE;

CREATE INDEX IF NOT EXISTS idx_fiscal_documents_tax_point ON fiscal_documents(tenant_id, vat_tax_point, is_settled);

-- 2. Fait Générateur & Réintégrations Fiscales sur fiscal_events (Règles 7 et 8)
ALTER TABLE fiscal_events
    ADD COLUMN IF NOT EXISTS vat_tax_point VARCHAR(20) NOT NULL DEFAULT 'DEBIT',
    ADD COLUMN IF NOT EXISTS is_settled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS reintegration_type VARCHAR(50); -- 'EXCESS_DEPRECIATION_VP_ART_141_2', 'CASH_PAYMENT_EXCESS_ART_30', 'AMENDE_PENALITE_ART_169'

CREATE INDEX IF NOT EXISTS idx_fiscal_events_reintegration ON fiscal_events(tenant_id, reintegration_type);

COMMIT;

