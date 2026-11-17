'use client';

import React, { useEffect, useState } from 'react';
import {
  PartItem,
  PartWarehouse,
  PartStockLevel,
  PartPurchaseOrder,
} from '@docteurflotte/contracts';
import {
  fetchPartsItems,
  fetchWarehouses,
  fetchStockLevels,
  fetchPurchaseOrders,
} from '../../lib/api-parts';
import { AuthClient } from '../../lib/api-auth';

export default function PartsProcurementPage() {
  const [activeTab, setActiveTab] = useState<'items' | 'stock' | 'warehouses' | 'orders'>('items');
  const [items, setItems] = useState<PartItem[]>([]);
  const [warehouses, setWarehouses] = useState<PartWarehouse[]>([]);
  const [stockLevels, setStockLevels] = useState<PartStockLevel[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PartPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const session = AuthClient.getSession();
        const token = session.token || undefined;

        const [iData, wData, sData, poData] = await Promise.all([
          fetchPartsItems(token).catch(() => []),
          fetchWarehouses(token).catch(() => []),
          fetchStockLevels(token).catch(() => []),
          fetchPurchaseOrders(token).catch(() => []),
        ]);

        setItems(iData);
        setWarehouses(wData);
        setStockLevels(sData);
        setPurchaseOrders(poData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div
      style={{
        padding: '2rem',
        backgroundColor: 'var(--df-bg-base)',
        minHeight: '100vh',
        color: 'var(--df-text-primary)',
        fontFamily: 'inherit',
      }}
    >
      {/* En-tête du cockpit */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            Stock Pièces & Approvisionnement
          </h1>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--df-primary-light, rgba(59, 130, 246, 0.1))',
              color: 'var(--df-primary)',
            }}
          >
            Module F • Maintenance & Logistique Atelier
          </span>
        </div>
        <p style={{ color: 'var(--df-text-secondary)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Catalogue des pièces d’usure, gestion multi-dépôts par Wilaya, valorisation au CMUP (Coût Moyen Unitaire Pondéré) et imputation directe sur les Ordres de Travail des Actifs.
        </p>
      </div>

      {/* Onglets Métier */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          borderBottom: '1px solid var(--df-border-base)',
          marginBottom: '1.5rem',
          maxWidth: '100%',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <button
          onClick={() => setActiveTab('items')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'items' ? 'var(--df-primary)' : 'var(--df-text-secondary)',
            borderBottom: activeTab === 'items' ? '2px solid var(--df-primary)' : '2px solid transparent',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Articles de Stock ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'stock' ? 'var(--df-primary)' : 'var(--df-text-secondary)',
            borderBottom: activeTab === 'stock' ? '2px solid var(--df-primary)' : '2px solid transparent',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Niveaux de Stock par Dépôt ({stockLevels.length})
        </button>
        <button
          onClick={() => setActiveTab('warehouses')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'warehouses' ? 'var(--df-primary)' : 'var(--df-text-secondary)',
            borderBottom: activeTab === 'warehouses' ? '2px solid var(--df-primary)' : '2px solid transparent',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Dépôts & Magasins ({warehouses.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: activeTab === 'orders' ? 'var(--df-primary)' : 'var(--df-text-secondary)',
            borderBottom: activeTab === 'orders' ? '2px solid var(--df-primary)' : '2px solid transparent',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Bons de Commande Achat ({purchaseOrders.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--df-text-secondary)' }}>
          Chargement de l’inventaire et des stocks ateliers...
        </div>
      ) : error ? (
        <div style={{ padding: '1rem', backgroundColor: 'var(--df-danger-light)', color: 'var(--df-danger)', borderRadius: '0.5rem' }}>
          {error}
        </div>
      ) : (
        <>
          {/* TAB 1: Articles de Stock */}
          {activeTab === 'items' && (
            <div>
              {items.length === 0 ? (
                <div
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--df-bg-surface)',
                    border: '1px dashed var(--df-border-base)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--df-text-secondary)' }}>
                    Aucun article de stock référencé.
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--df-text-muted)', marginTop: '0.5rem' }}>
                    Créez vos références de filtres, plaquettes de frein, lubrifiants ou pneus pour activer l’approvisionnement automatique.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {items.map((it) => (
                    <div
                      key={it.id}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--df-bg-surface)',
                        border: '1px solid var(--df-border-base)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{it.partNumber}</span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: 'var(--df-bg-subtle)',
                              fontWeight: 600,
                            }}
                          >
                            {it.category}
                          </span>
                          {it.totalQuantityInStock <= it.reorderPointQuantity && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '0.25rem',
                                backgroundColor: 'var(--df-danger-light)',
                                color: 'var(--df-danger)',
                                fontWeight: 600,
                              }}
                            >
                              Alerte Réapprovisionnement
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--df-text-primary)', marginTop: '0.35rem', marginBottom: 0, fontWeight: 500 }}>
                          {it.designation}
                        </p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--df-text-secondary)', marginTop: '0.25rem', marginBottom: 0 }}>
                          Compatibilité OEM : {it.oemBrandCompatibility.length > 0 ? it.oemBrandCompatibility.join(', ') : 'Universelle'} • Unité : {it.unitMeasure}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--df-primary)' }}>
                          Stock : {it.totalQuantityInStock} {it.unitMeasure}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--df-text-secondary)', marginTop: '0.25rem' }}>
                          CMUP : {it.averageWeightedCostDzd.toLocaleString('fr-DZ')} DA
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)', marginTop: '0.15rem' }}>
                          Seuil d’alerte : {it.reorderPointQuantity} {it.unitMeasure}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Niveaux de Stock par Dépôt */}
          {activeTab === 'stock' && (
            <div>
              {stockLevels.length === 0 ? (
                <div
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--df-bg-surface)',
                    border: '1px dashed var(--df-border-base)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--df-text-secondary)' }}>
                    Aucun niveau de stock enregistré dans les dépôts.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {stockLevels.map((sl) => (
                    <div
                      key={sl.id}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--df-bg-surface)',
                        border: '1px solid var(--df-border-base)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{sl.partNumber}</span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--df-text-secondary)' }}>
                            {sl.partDesignation}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--df-text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
                          Magasin : <strong>{sl.warehouseName}</strong> • Emplacement : {sl.locationBin || 'Casier standard'}
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                          Disponible : {sl.quantityAvailable} (En main : {sl.quantityOnHand})
                        </div>
                        {sl.isBelowReorderPoint && (
                          <span
                            style={{
                              display: 'inline-block',
                              marginTop: '0.35rem',
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: 'var(--df-warning-light)',
                              color: 'var(--df-warning)',
                              fontWeight: 600,
                            }}
                          >
                            Inférieur au seuil ({sl.reorderPoint})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Dépôts & Magasins */}
          {activeTab === 'warehouses' && (
            <div>
              {warehouses.length === 0 ? (
                <div
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--df-bg-surface)',
                    border: '1px dashed var(--df-border-base)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--df-text-secondary)' }}>
                    Aucun dépôt ou magasin configuré.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {warehouses.map((wh) => (
                    <div
                      key={wh.id}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--df-bg-surface)',
                        border: '1px solid var(--df-border-base)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{wh.name}</span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: 'var(--df-bg-subtle)',
                              fontWeight: 600,
                            }}
                          >
                            Code : {wh.code}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.25rem',
                              backgroundColor: 'var(--df-primary-light, rgba(59, 130, 246, 0.1))',
                              color: 'var(--df-primary)',
                              fontWeight: 600,
                            }}
                          >
                            Wilaya {wh.wilayaCode}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--df-text-secondary)', marginTop: '0.35rem', marginBottom: 0 }}>
                          Adresse : {wh.address || 'Non spécifiée'} • Responsable : {wh.managerName || 'Non assigné'}
                        </p>
                      </div>

                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '0.25rem',
                          backgroundColor: wh.isActive ? 'var(--df-success-light)' : 'var(--df-bg-subtle)',
                          color: wh.isActive ? 'var(--df-success)' : 'var(--df-text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        {wh.isActive ? 'Actif' : 'Fermé'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Bons de Commande Achat */}
          {activeTab === 'orders' && (
            <div>
              {purchaseOrders.length === 0 ? (
                <div
                  style={{
                    padding: '3rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--df-bg-surface)',
                    border: '1px dashed var(--df-border-base)',
                    borderRadius: '0.5rem',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 500, color: 'var(--df-text-secondary)' }}>
                    Aucun bon de commande fournisseur enregistré.
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--df-text-muted)', marginTop: '0.5rem' }}>
                    Gérez vos approvisionnements en devises étrangères (EUR, USD) ou DZD avec conversion automatique du cours et recalcul CMUP à la réception.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {purchaseOrders.map((po) => (
                    <div
                      key={po.id}
                      style={{
                        padding: '1.25rem',
                        backgroundColor: 'var(--df-bg-surface)',
                        border: '1px solid var(--df-border-base)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{po.poNumber}</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{po.supplierName}</span>
                          {po.supplierNif && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--df-text-muted)' }}>
                              NIF : {po.supplierNif}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--df-text-secondary)', marginTop: '0.35rem', marginBottom: 0 }}>
                          Commandé le {new Date(po.orderedAt).toLocaleDateString('fr-DZ')} • {po.items.length} article(s)
                        </p>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--df-primary)' }}>
                          {po.totalAmountDzd.toLocaleString('fr-DZ')} DA
                        </div>
                        {po.supplierCurrency !== 'DZD' && (
                          <div style={{ fontSize: '0.8125rem', color: 'var(--df-text-secondary)' }}>
                            {po.totalAmountCurrency.toLocaleString('fr-DZ')} {po.supplierCurrency} (Taux : {po.exchangeRateToDzd})
                          </div>
                        )}
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '0.35rem',
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '0.25rem',
                            backgroundColor:
                              po.status === 'RECEIVED'
                                ? 'var(--df-success-light)'
                                : 'var(--df-warning-light)',
                            color:
                              po.status === 'RECEIVED'
                                ? 'var(--df-success)'
                                : 'var(--df-warning)',
                            fontWeight: 600,
                          }}
                        >
                          {po.status === 'RECEIVED' ? 'Réceptionné' : 'En commande'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

