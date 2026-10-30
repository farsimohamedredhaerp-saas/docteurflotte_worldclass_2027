# Directives Locales — API NestJS (`apps/api`)

**Rôle :** Backend API modulaire, gestionnaire d'accès et moteur d'orchestration métier.

## Règles d'Implémentation
1. **Architecture Modulaire :** Chaque domaine métier dispose de son propre module NestJS (ex: `HealthModule`, `AssetsModule`, `MaintenanceModule`), exportant uniquement les services nécessaires.
2. **Validation des Entrées :** Tout DTO exposé aux contrôleurs doit utiliser `class-validator` et être validé via le `ValidationPipe` global avec `whitelist: true` et `forbidNonWhitelisted: true`.
3. **Multi-Tenant & Sécurité :** Aucun accès base sans vérification du `tenant_id`. Utiliser les intercepteurs/guards pour injecter `app.current_tenant_id` dans la session de transaction PostgreSQL.
4. **Pas d'Exception Non Gérée :** Transformer toute erreur d'infrastructure en exception HTTP typée (`NotFoundException`, `ConflictException`, `ForbiddenException`).
5. **Tests Obligatoires :** Tout nouveau contrôleur ou service requiert au minimum un test unitaire `.spec.ts` et une couverture e2e sur les cas nominaux et d'erreur.
