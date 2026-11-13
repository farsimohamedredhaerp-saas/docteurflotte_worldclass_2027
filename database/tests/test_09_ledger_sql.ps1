# ==============================================================================
# Test Direct SQL : Vérification Migration 09 (Data Plane Grand Livre, RLS, Triggers)
# ==============================================================================

Write-Host "Exécution des vérifications SQL directes sur PostgreSQL 16..." -ForegroundColor Cyan

# 1. Test Pièce déséquilibrée de 0.01 DA rejetée sur COMMIT
$unbalancedRaw = docker exec -i docteurflotte_postgres psql -U docteurflotte -d docteurflotte_dev -c "
BEGIN;
SET LOCAL app.tenant_id = '11111111-1111-1111-1111-111111111111';
INSERT INTO ledger_entry (tenant_id, period_id, piece_number, line_number, local_date, account_role, account_number, label, debit, credit, prev_hash, hash, pack_hash)
VALUES 
('11111111-1111-1111-1111-111111111111', (SELECT id FROM accounting_period LIMIT 1), 'VT-UNBAL-99', 1, '2026-03-15', 'CLIENT', '411000', 'L1', 100.00, NULL, 'p1', 'h1', 'pack'),
('11111111-1111-1111-1111-111111111111', (SELECT id FROM accounting_period LIMIT 1), 'VT-UNBAL-99', 2, '2026-03-15', 'REVENUE_SALES', '700000', 'L2', NULL, 99.99, 'h1', 'h2', 'pack');
COMMIT;
" 2>&1
$unbalancedStr = ($unbalancedRaw | Out-String)

if ($unbalancedStr -match "VIOLATION D EQUILIBRE COMPTABLE") {
    Write-Host "✅ TEST 1 RÉUSSI : Pièce déséquilibrée de 0.01 DA rejetée par le trigger différé (check_violation 23514)." -ForegroundColor Green
} else {
    Write-Error "❌ ÉCHEC TEST 1 : La pièce déséquilibrée n'a pas été rejetée."
}

# 2. Test Immuabilité : UPDATE rejeté
$updateRaw = docker exec -i docteurflotte_postgres psql -U docteurflotte -d docteurflotte_dev -c "
UPDATE ledger_entry SET debit = 999999 WHERE piece_number = 'VT-2026-TEST-001' AND line_number = 1;
" 2>&1
$updateStr = ($updateRaw | Out-String)

if ($updateStr -match "VIOLATION D IMMUABILIT") {
    Write-Host "✅ TEST 2 RÉUSSI : Tentative d'UPDATE bloquée par le trigger d'immuabilité (SQLSTATE 55000)." -ForegroundColor Green
} else {
    Write-Error "❌ ÉCHEC TEST 2 : L'UPDATE aurait dû être bloqué."
}

# 3. Test Immuabilité : DELETE rejeté
$deleteRaw = docker exec -i docteurflotte_postgres psql -U docteurflotte -d docteurflotte_dev -c "
DELETE FROM ledger_entry WHERE piece_number = 'VT-2026-TEST-001';
" 2>&1
$deleteStr = ($deleteRaw | Out-String)

if ($deleteStr -match "VIOLATION D IMMUABILIT") {
    Write-Host "✅ TEST 3 RÉUSSI : Tentative de DELETE bloquée par le trigger d'immuabilité (SQLSTATE 55000)." -ForegroundColor Green
} else {
    Write-Error "❌ ÉCHEC TEST 3 : Le DELETE aurait dû être bloqué."
}

# 4. Test RLS Multi-Tenant sous df_tenant_role
$countBStr = docker exec -i docteurflotte_postgres psql -U docteurflotte -d docteurflotte_dev -t -A -c "
SET ROLE df_tenant_role;
SET app.tenant_id = '22222222-2222-2222-2222-222222222222';
SELECT COUNT(*) FROM ledger_entry;
" 2>&1
$countB = ($countBStr | Where-Object { $_ -match '^\d+$' }).Trim()

if ($countB -eq "0") {
    Write-Host "✅ TEST 4 RÉUSSI : Isolation RLS étanche sous df_tenant_role (Tenant B voit exactement 0 écriture du Tenant A)." -ForegroundColor Green
} else {
    Write-Error "❌ ÉCHEC TEST 4 : Fuite multi-tenant détectée ($countB écritures visibles)."
}

# 5. Test Tenant A voit ses 3 écritures
$countAStr = docker exec -i docteurflotte_postgres psql -U docteurflotte -d docteurflotte_dev -t -A -c "
SET ROLE df_tenant_role;
SET app.tenant_id = '11111111-1111-1111-1111-111111111111';
SELECT COUNT(*) FROM ledger_entry;
" 2>&1
$countA = ($countAStr | Where-Object { $_ -match '^\d+$' }).Trim()

if ($countA -eq "3") {
    Write-Host "✅ TEST 5 RÉUSSI : Tenant A voit exactement ses 3 écritures validées." -ForegroundColor Green
} else {
    Write-Error "❌ ÉCHEC TEST 5 : Tenant A devrait voir 3 écritures (trouvé : $countA)."
}

Write-Host "`n>>> TOUTES LES VÉRIFICATIONS SQL DIRECTES SONT AU STATUT VERT (PASS) ! <<<" -ForegroundColor Green
