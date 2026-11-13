-- Migration 11 : Étanchéité RLS pour naftal_card_statements et tenant_pack_pin

ALTER TABLE IF EXISTS naftal_card_statements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'naftal_card_statements' AND policyname = 'tenant_isolation_naftal_statements'
  ) THEN
    CREATE POLICY tenant_isolation_naftal_statements ON naftal_card_statements
      USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
      )
      WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
      );
  END IF;
END $$;

ALTER TABLE IF EXISTS tenant_pack_pin ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tenant_pack_pin' AND policyname = 'tenant_isolation_pack_pin'
  ) THEN
    CREATE POLICY tenant_isolation_pack_pin ON tenant_pack_pin
      USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')
        OR (current_user <> 'df_tenant_role' AND current_setting('app.system_context', true) = 'true')
      )
      WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')
      );
  END IF;
END $$;
