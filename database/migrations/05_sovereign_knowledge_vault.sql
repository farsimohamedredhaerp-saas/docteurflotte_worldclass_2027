-- Migration 05 : Sovereign Knowledge Vault (RAG Hybride Souverain & Index DTC/ENACTA)
-- Auteur : DocteurFlotte Engineering
-- Conforme : Loi 18-07 ANPDP & Architecture RRF Hybride

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE TABLE IF NOT EXISTS sovereign_knowledge_vault (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  manufacturer VARCHAR(50) NOT NULL,
  model_series VARCHAR(100) NOT NULL,
  subsystem VARCHAR(50) NOT NULL,
  section_title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  structured_specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding FLOAT8[] DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sovereign_knowledge_vault ADD COLUMN IF NOT EXISTS tsv_content TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('french', coalesce(section_title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(manufacturer, '') || ' ' || coalesce(model_series, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_skv_tsv ON sovereign_knowledge_vault USING gin(tsv_content);
CREATE INDEX IF NOT EXISTS idx_skv_specs ON sovereign_knowledge_vault USING gin(structured_specs);
CREATE INDEX IF NOT EXISTS idx_skv_trgm_title ON sovereign_knowledge_vault USING gin(section_title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_skv_meta ON sovereign_knowledge_vault(category, manufacturer, subsystem);
CREATE INDEX IF NOT EXISTS idx_skv_tenant ON sovereign_knowledge_vault(tenant_id);

ALTER TABLE sovereign_knowledge_vault ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sovereign_knowledge_vault' AND policyname = 'tenant_or_universal_isolation_skv'
  ) THEN
    CREATE POLICY tenant_or_universal_isolation_skv ON sovereign_knowledge_vault
      USING (
        tenant_id IS NULL 
        OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
      )
      WITH CHECK (
        tenant_id IS NOT NULL 
        AND tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
      );
  END IF;
END $$;
