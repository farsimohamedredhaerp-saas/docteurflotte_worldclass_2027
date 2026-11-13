-- =============================================================================
-- TEST DIRECT SQL : Migration 09 (Data Plane Grand Livre, RLS & Triggers)
-- =============================================================================

-- 1. Nettoyage et initialisation
DELETE FROM ledger_entry WHERE piece_number LIKE '%TEST%';
DELETE FROM accounting_period WHERE period_code LIKE '2026-FY-%';
DELETE FROM entity_profile WHERE tenant_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

DO $$
DECLARE
    v_tenant_a UUID := '11111111-1111-1111-1111-111111111111';
    v_tenant_b UUID := '22222222-2222-2222-2222-222222222222';
    v_period_a UUID;
    v_period_b UUID;
BEGIN
    RAISE NOTICE '>>> TEST 1 : Création des entités et périodes pour Tenant A et Tenant B';

    INSERT INTO entity_profile (tenant_id, legal_name, legal_form, tax_regime)
    VALUES (v_tenant_a, 'Sarl Algiers Transport', 'SARL', 'REEL_NORMAL');

    INSERT INTO accounting_period (tenant_id, fiscal_year, period_code, start_date, end_date, status, pack_hash)
    VALUES (v_tenant_a, 2026, '2026-FY-A', '2026-01-01', '2026-12-31', 'OPEN', 'pack_hash_test_2026')
    RETURNING id INTO v_period_a;

    INSERT INTO entity_profile (tenant_id, legal_name, legal_form, tax_regime)
    VALUES (v_tenant_b, 'Eurl Oran Logistique', 'EURL', 'REEL_NORMAL');

    INSERT INTO accounting_period (tenant_id, fiscal_year, period_code, start_date, end_date, status, pack_hash)
    VALUES (v_tenant_b, 2026, '2026-FY-B', '2026-01-01', '2026-12-31', 'OPEN', 'pack_hash_test_2026')
    RETURNING id INTO v_period_b;

    RAISE NOTICE 'Périodes créées avec succès : A=%, B=%', v_period_a, v_period_b;
END;
$$;

-- 2. Test Équilibre Débit = Crédit (Pièce équilibrée : Débit 119 000 = Crédit 100 000 + 19 000)
BEGIN;
SET LOCAL app.tenant_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO ledger_entry (
    tenant_id, period_id, piece_number, line_number, local_date,
    account_role, account_number, label, debit, credit, prev_hash, hash, pack_hash
) VALUES 
(
    '11111111-1111-1111-1111-111111111111', 
    (SELECT id FROM accounting_period WHERE tenant_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
    'VT-2026-TEST-001', 1, '2026-03-15', 'CLIENT', '411000', 'Vente Facture 001', 119000.00, NULL,
    '0000000000000000000000000000000000000000000000000000000000000000', 'hash_line_1', 'pack_hash_test_2026'
),
(
    '11111111-1111-1111-1111-111111111111', 
    (SELECT id FROM accounting_period WHERE tenant_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
    'VT-2026-TEST-001', 2, '2026-03-15', 'REVENUE_SALES', '700000', 'Produit Vente', NULL, 100000.00,
    'hash_line_1', 'hash_line_2', 'pack_hash_test_2026'
),
(
    '11111111-1111-1111-1111-111111111111', 
    (SELECT id FROM accounting_period WHERE tenant_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
    'VT-2026-TEST-001', 3, '2026-03-15', 'VAT_COLLECTED', '445700', 'TVA Collectee 19%', NULL, 19000.00,
    'hash_line_2', 'hash_line_3', 'pack_hash_test_2026'
);

COMMIT;

-- 3. Test Rejet d'une Pièce Déséquilibrée de 0.01 DA (Trigger Différé)
-- On exécute dans un bloc anonyme avec savepoint pour intercepter l'erreur
DO $$
BEGIN
    SET LOCAL app.tenant_id = '11111111-1111-1111-1111-111111111111';

    BEGIN
        INSERT INTO ledger_entry (
            tenant_id, period_id, piece_number, line_number, local_date,
            account_role, account_number, label, debit, credit, prev_hash, hash, pack_hash
        ) VALUES 
        (
            '11111111-1111-1111-1111-111111111111', 
            (SELECT id FROM accounting_period WHERE tenant_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
            'VT-UNBALANCED-001', 1, '2026-03-15', 'CLIENT', '411000', 'Ligne debit', 100.00, NULL,
            'prev', 'h1', 'pack_hash_test_2026'
        ),
        (
            '11111111-1111-1111-1111-111111111111', 
            (SELECT id FROM accounting_period WHERE tenant_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
            'VT-UNBALANCED-001', 2, '2026-03-15', 'REVENUE_SALES', '700000', 'Ligne credit desequilibree', NULL, 99.99,
            'h1', 'h2', 'pack_hash_test_2026'
        );

        -- Le trigger différé trg_piece_balance_deferred s'exécute à la sortie du sous-bloc
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE '>>> SUCCÈS TEST 3 : Pièce déséquilibrée de 0.01 DA rejetée avec succès par le trigger d équilibre (check_violation 23514).';
        RETURN;
    END;

    RAISE EXCEPTION 'ERREUR : La pièce déséquilibrée aurait dû être rejetée !';
END;
$$;

-- 4. Test Immuabilité : Rejet strict des UPDATE et DELETE
DO $$
DECLARE
    v_entry_id UUID;
BEGIN
    SELECT id INTO v_entry_id FROM ledger_entry WHERE piece_number = 'VT-2026-TEST-001' LIMIT 1;

    -- Tentative d'UPDATE d'un montant
    BEGIN
        UPDATE ledger_entry SET debit = 120000.00 WHERE id = v_entry_id;
        RAISE EXCEPTION 'ERREUR : L UPDATE d une écriture comptable aurait dû être rejeté !';
    EXCEPTION WHEN SQLSTATE '55000' THEN
        RAISE NOTICE '>>> SUCCÈS TEST 4A : Tentative d UPDATE bloquée par le trigger d immuabilité (SQLSTATE 55000).';
    END;

    -- Tentative de DELETE
    BEGIN
        DELETE FROM ledger_entry WHERE id = v_entry_id;
        RAISE EXCEPTION 'ERREUR : Le DELETE d une écriture comptable aurait dû être rejeté !';
    EXCEPTION WHEN SQLSTATE '55000' THEN
        RAISE NOTICE '>>> SUCCÈS TEST 4B : Tentative de DELETE bloquée par le trigger d immuabilité (SQLSTATE 55000).';
    END;
END;
$$;

-- 5. Test RLS Multi-Tenant en SQL Direct sous rôle applicatif df_tenant_role
DO $$
DECLARE
    v_count_as_b INT;
    v_count_as_a INT;
BEGIN
    -- Basculer sous le rôle applicatif df_tenant_role (non-superuser)
    SET ROLE df_tenant_role;

    -- Session Tenant B : ne doit voir AUCUNE ligne de Tenant A
    PERFORM set_config('app.tenant_id', '22222222-2222-2222-2222-222222222222', true);
    SELECT COUNT(*) INTO v_count_as_b FROM ledger_entry;

    IF v_count_as_b <> 0 THEN
        RESET ROLE;
        RAISE EXCEPTION 'FUITE MULTI-TENANT : Tenant B peut voir % écriture(s) de Tenant A !', v_count_as_b;
    END IF;

    -- Session Tenant A : doit voir exactement ses 3 écritures
    PERFORM set_config('app.tenant_id', '11111111-1111-1111-1111-111111111111', true);
    SELECT COUNT(*) INTO v_count_as_a FROM ledger_entry;

    RESET ROLE;

    IF v_count_as_a <> 3 THEN
        RAISE EXCEPTION 'ERREUR RLS : Tenant A devrait voir 3 écritures (trouvé : %)', v_count_as_a;
    END IF;

    RAISE NOTICE '>>> SUCCÈS TEST 5 : Isolation multi-tenant RLS 100%% étanche sous df_tenant_role (Tenant B voit 0, Tenant A voit 3).';
END;
$$;

-- 6. Test Refus d'Écriture en Période Clôturée (CLOSED)
DO $$
DECLARE
    v_closed_period_id UUID;
BEGIN
    -- Clôturer la période de Tenant B
    UPDATE accounting_period SET status = 'CLOSED', closed_at = NOW(), closed_by = 'cac@dzerp.dz' 
    WHERE tenant_id = '22222222-2222-2222-2222-222222222222' RETURNING id INTO v_closed_period_id;

    BEGIN
        INSERT INTO ledger_entry (
            tenant_id, period_id, piece_number, line_number, local_date,
            account_role, account_number, label, debit, credit, prev_hash, hash, pack_hash
        ) VALUES (
            '22222222-2222-2222-2222-222222222222', v_closed_period_id, 'VT-CLOSED-001', 1, '2026-03-15',
            'CLIENT', '411000', 'Tentative en période close', 1000.00, NULL, 'prev', 'h', 'pack_hash_test_2026'
        );
        RAISE EXCEPTION 'ERREUR : L écriture en période close aurait dû être rejetée !';
    EXCEPTION WHEN SQLSTATE '55000' THEN
        RAISE NOTICE '>>> SUCCÈS TEST 6 : Écriture en période close rejetée par le trigger trg_ledger_entry_check_period (SQLSTATE 55000).';
    END;
END;
$$;
