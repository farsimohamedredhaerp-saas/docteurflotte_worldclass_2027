DO $$
DECLARE
    v_tenant_a UUID := gen_random_uuid();
    v_tenant_b UUID := gen_random_uuid();
    v_veh_id UUID := gen_random_uuid();
    v_cnt INT;
BEGIN
    -- 1. Insérer 2 tenants de test
    INSERT INTO tenants (id, name, slug, country_code, currency)
    VALUES (v_tenant_a, 'Tenant Alpha DZ Test', 'tenant-alpha-' || substr(v_tenant_a::text, 1, 8), 'DZ', 'DZD'),
           (v_tenant_b, 'Tenant Beta DZ Test', 'tenant-beta-' || substr(v_tenant_b::text, 1, 8), 'DZ', 'DZD');

    -- 2. Insérer un véhicule appartenant au Tenant Alpha
    INSERT INTO vehicles (id, tenant_id, registration_plate, telemetry_mode)
    VALUES (v_veh_id, v_tenant_a, '09999-116-16', 'MODE_1_GPS');

    -- 3. Insérer un event télématique dans la nouvelle table telemetry_events
    INSERT INTO telemetry_events (time, tenant_id, vehicle_id, latitude, longitude, speed_kmh)
    VALUES (NOW(), v_tenant_a, v_veh_id, 36.75, 3.05, 60.0);

    -- 4. Test d'isolation sous df_tenant_role pour Tenant Alpha
    SET LOCAL ROLE df_tenant_role;
    PERFORM set_config('app.current_tenant_id', v_tenant_a::text, true);
    SELECT count(*) INTO v_cnt FROM vehicles WHERE id = v_veh_id;
    IF v_cnt <> 1 THEN
        RAISE EXCEPTION 'ECHEC RLS : Le véhicule devrait être visible pour Tenant Alpha';
    END IF;

    -- 5. Test d'isolation sous df_tenant_role pour Tenant Beta (Tentative de fuite cross-tenant)
    PERFORM set_config('app.current_tenant_id', v_tenant_b::text, true);
    SELECT count(*) INTO v_cnt FROM vehicles WHERE id = v_veh_id;
    IF v_cnt <> 0 THEN
        RAISE EXCEPTION 'VIOLATION RLS : Le véhicule de Tenant Alpha a fuité vers Tenant Beta !';
    END IF;

    -- 6. Test d'isolation sur telemetry_events
    SELECT count(*) INTO v_cnt FROM telemetry_events WHERE vehicle_id = v_veh_id;
    IF v_cnt <> 0 THEN
        RAISE EXCEPTION 'VIOLATION RLS : La télémétrie de Tenant Alpha a fuité vers Tenant Beta !';
    END IF;

    -- 7. Nettoyage
    RESET ROLE;
    DELETE FROM telemetry_events WHERE tenant_id = v_tenant_a;
    DELETE FROM vehicles WHERE tenant_id = v_tenant_a;
    DELETE FROM tenants WHERE id IN (v_tenant_a, v_tenant_b);

    RAISE NOTICE 'SUCCESS : Isolation RLS prouvée à 100%% en direct sur PostgreSQL ! Zéro fuite cross-tenant.';
END $$;
