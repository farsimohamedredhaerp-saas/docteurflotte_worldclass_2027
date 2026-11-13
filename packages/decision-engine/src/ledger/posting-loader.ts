/**
 * Chargeur et Registre de Schémas de Comptabilisation (Posting Schema Registry)
 */

import { BusinessEventType } from '../types/ontology.js';
import { PostingSchemaItem, ChartOfAccounts } from './ledger-types.js';

export class PostingSchemaRegistry {
  private schemas = new Map<BusinessEventType, PostingSchemaItem>();

  constructor(schemas: PostingSchemaItem[] = []) {
    for (const schema of schemas) {
      this.schemas.set(schema.eventType, schema);
    }
  }

  public register(schema: PostingSchemaItem): void {
    this.schemas.set(schema.eventType, schema);
  }

  public get(eventType: BusinessEventType): PostingSchemaItem | undefined {
    return this.schemas.get(eventType);
  }

  public has(eventType: BusinessEventType): boolean {
    return this.schemas.has(eventType);
  }

  public getAll(): PostingSchemaItem[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Vérifie que tous les schémas enregistrés peuvent être résolus
   * par le plan de comptes fourni
   */
  public validateAgainstChart(chart: ChartOfAccounts): {
    valid: boolean;
    errors: Array<{ eventType: BusinessEventType; missingRole: string }>;
  } {
    const errors: Array<{ eventType: BusinessEventType; missingRole: string }> = [];

    for (const schema of this.schemas.values()) {
      for (const line of schema.lines) {
        if (!chart[line.role] || chart[line.role].trim() === '') {
          errors.push({ eventType: schema.eventType, missingRole: line.role });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

