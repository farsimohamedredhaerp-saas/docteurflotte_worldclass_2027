-- Migration 06 : Anomaly Cooldown Ledger & Zero-Prompt Copilot
-- Auteur : DocteurFlotte Engineering
-- Conforme : Pilier 7 (Anti-Echo Storm 72h & Verrou Dédoublonnage Ordres de Travail)

CREATE TABLE IF NOT EXISTS anomaly_cooldown_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_plate VARCHAR(50) NOT NULL,
  subsystem VARCHAR(50) NOT NULL,
  anomaly_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'WARNING',
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE_CARD', -- 'ACTIVE_CARD', 'SNOOZED', 'WORK_ORDER_CREATED', 'RESOLVED'
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_emitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cooldown_until TIMESTAMPTZ NOT NULL,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour recherche rapide du cooldown actif
CREATE INDEX IF NOT EXISTS idx_anomaly_cooldown_active 
  ON anomaly_cooldown_ledger (tenant_id, vehicle_plate, subsystem, anomaly_type, cooldown_until);

-- Index pour audit des cartes par statut
CREATE INDEX IF NOT EXISTS idx_anomaly_status 
  ON anomaly_cooldown_ledger (tenant_id, status);

-- Activer RLS
ALTER TABLE anomaly_cooldown_ledger ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'anomaly_cooldown_ledger' AND policyname = 'tenant_isolation_anomaly_ledger'
  ) THEN
    CREATE POLICY tenant_isolation_anomaly_ledger ON anomaly_cooldown_ledger
      USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
      )
      WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
      );
  END IF;
END $$;

