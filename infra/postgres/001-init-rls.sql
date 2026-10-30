-- =============================================================================
-- FICHIER : infra/postgres/001-init-rls.sql
-- OBJET   : Initialisation PostgreSQL de production (Extensions & Rôle RLS)
--           Monté dans /docker-entrypoint-initdb.d/001-init-rls.sql par compose.prod.yaml
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'df_tenant_role') THEN
    CREATE ROLE df_tenant_role WITH NOINHERIT NOBYPASSRLS;
  END IF;
  GRANT USAGE ON SCHEMA public TO df_tenant_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO df_tenant_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO df_tenant_role;
END $$;
