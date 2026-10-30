import {
  CanonicalPosition,
  DeviceStatus,
  TelematicsDevice,
  TraccarGatewayHealth,
} from '@docteurflotte/contracts';

/**
 * Interface canonique abstraite ITelematicsProvider.
 * Conforme à AGENTS.md (Section 0.1 & 4.1.E) : aucun module métier
 * ne doit dépendre directement des types internes de Traccar.
 */
export interface ITelematicsProvider {
  /**
   * Nom de l'adaptateur (ex: 'TRACCAR_SELF_HOSTED', 'MOCK_ADAPTER')
   */
  readonly providerName: string;

  /**
   * Vérifie la santé et la connectivité avec le serveur télématique
   */
  checkHealth(): Promise<TraccarGatewayHealth>;

  /**
   * Récupère la liste des terminaux déclarés sur le serveur télématique
   */
  fetchDevices(): Promise<Array<{ id: number; uniqueId: string; name: string; status: DeviceStatus; lastUpdate?: string }>>;

  /**
   * Envoie ou synchronise une commande vers un terminal (ex: blocage moteur si autorisé)
   */
  sendCommand?(uniqueId: string, commandType: string, attributes?: Record<string, any>): Promise<{ success: boolean; message: string }>;
}
