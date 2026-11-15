'use client';

import React from 'react';
import { Button } from '@/components/Button';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { IconAlertTriangle, IconEye } from '@/components/navigation/TechIcons';
import { ActivityPack, ALGERIA_58_WILAYAS_PROFILES } from '@docteurflotte/contracts';
import { UseRegisterFormReturn } from '../types';

interface RegisterFormProps {
  form: UseRegisterFormReturn;
}

export function RegisterForm({ form }: RegisterFormProps) {
  const {
    formData,
    setField,
    showPassword,
    toggleShowPassword,
    isLoading,
    error,
    handleSubmit,
  } = form;

  return (
    <div>
      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <IconAlertTriangle size={16} className="text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Section 1 : Entreprise & Région */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
          <div>
            <label
              htmlFor="companyName"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '5px' }}
            >
              Raison Sociale / Société
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              required
              autoComplete="organization"
              value={formData.companyName}
              onChange={(e) => setField('companyName', e.target.value)}
              placeholder="ex: SARL Trans-Djazair"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="wilayaCode"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '5px' }}
            >
              Wilaya du Siège
            </label>
            <select
              id="wilayaCode"
              name="wilayaCode"
              value={formData.wilayaCode}
              onChange={(e) => setField('wilayaCode', Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              {ALGERIA_58_WILAYAS_PROFILES.map((w) => (
                <option key={w.code} value={w.code}>
                  {String(w.code).padStart(2, '0')} — {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* NIF Optionnel */}
        <div>
          <label
            htmlFor="taxNif"
            style={{ display: 'block', fontSize: '12.5px', fontWeight: 500, color: 'var(--df-text-muted)', marginBottom: '4px' }}
          >
            Numéro d’Identification Fiscale (NIF) <span style={{ fontSize: '11px' }}>(Optionnel pour facture DGI)</span>
          </label>
          <input
            id="taxNif"
            name="taxNif"
            type="text"
            value={formData.taxNif}
            onChange={(e) => setField('taxNif', e.target.value)}
            placeholder="ex: 001616012345678"
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-main)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Section 2 : Prénom et Nom */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label
              htmlFor="adminFirstName"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '5px' }}
            >
              Prénom
            </label>
            <input
              id="adminFirstName"
              name="adminFirstName"
              type="text"
              required
              autoComplete="given-name"
              value={formData.adminFirstName}
              onChange={(e) => setField('adminFirstName', e.target.value)}
              placeholder="Amine"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="adminLastName"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '5px' }}
            >
              Nom de Famille
            </label>
            <input
              id="adminLastName"
              name="adminLastName"
              type="text"
              required
              autoComplete="family-name"
              value={formData.adminLastName}
              onChange={(e) => setField('adminLastName', e.target.value)}
              placeholder="Benali"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-2)',
                border: '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="adminEmail"
            style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '5px' }}
          >
            Email Professionnel de l’Administrateur
          </label>
          <input
            id="adminEmail"
            name="adminEmail"
            type="email"
            required
            autoComplete="email"
            value={formData.adminEmail}
            onChange={(e) => setField('adminEmail', e.target.value)}
            placeholder="direction@votre-flotte.dz"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-main)',
              fontSize: '13.5px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Mot de passe et confirmation */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label
              htmlFor="adminPassword"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '5px' }}
            >
              Mot de Passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="adminPassword"
                name="adminPassword"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={formData.adminPassword}
                onChange={(e) => setField('adminPassword', e.target.value)}
                placeholder="Min. 8 car."
                style={{
                  width: '100%',
                  padding: '10px 36px 10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--df-bg-surface-2)',
                  border: '1px solid var(--df-border-subtle)',
                  color: 'var(--df-text-main)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                aria-label="Afficher/masquer mot de passe"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--df-text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <IconEye size={16} />
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '5px' }}
            >
              Confirmer le Mot de Passe
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              placeholder="Répétez"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--df-bg-surface-2)',
                border:
                  formData.confirmPassword && formData.confirmPassword !== formData.adminPassword
                    ? '1px solid #ef4444'
                    : '1px solid var(--df-border-subtle)',
                color: 'var(--df-text-main)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {formData.adminPassword && (
          <PasswordStrengthIndicator password={formData.adminPassword} />
        )}

        {/* Profil Métier */}
        <div>
          <label
            htmlFor="activityPack"
            style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--df-text-main)', marginBottom: '5px' }}
          >
            Profil Métier Principal &amp; Secteur d’Activité
          </label>
          <select
            id="activityPack"
            name="activityPack"
            value={formData.activityPack}
            onChange={(e) => setField('activityPack', e.target.value as ActivityPack)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--df-bg-surface-2)',
              border: '1px solid var(--df-border-subtle)',
              color: 'var(--df-text-main)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          >
            <option value={ActivityPack.TRANSPORT}>Transport Routier &amp; Poids Lourds (TCO / km)</option>
            <option value={ActivityPack.CONSTRUCTION}>BTP, Carrières &amp; Engins de Chantier (Heures Moteur)</option>
            <option value={ActivityPack.LIGHT_VEHICLES}>Véhicules Légers, Utilitaires &amp; Distribution</option>
            <option value={ActivityPack.CUSTOM}>Hydrocarbures, Convois Sahariens &amp; Équipements Mixtes</option>
          </select>
        </div>

        <div style={{ marginTop: '6px' }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isLoading ? 'Création de l’organisation...' : 'Créer l’Organisation & Démarrer →'}
          </Button>
        </div>
      </form>
    </div>
  );
}

