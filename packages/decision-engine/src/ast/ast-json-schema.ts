/**
 * Générateur et Exportateur de JSON Schema pour l'Éditeur Visuel (Rule Studio)
 * Conforme aux spécifications JSON Schema Draft-07
 */

export function exportAstJsonSchema(): Record<string, unknown> {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'DecisionEngineAstNode',
    description: 'Schéma syntaxique formel de la grammaire AST du Moteur Décisionnel',
    type: 'object',
    required: ['type'],
    properties: {
      type: {
        type: 'string',
        enum: [
          'const', 'var', 'param',
          'ADD', 'SUB', 'MUL', 'DIV', 'MIN', 'MAX', 'ABS', 'NEG', 'ROUND',
          'EQ', 'NEQ', 'LT', 'LTE', 'GT', 'GTE', 'BETWEEN',
          'AND', 'OR', 'NOT',
          'COND', 'LET',
          'DAYS_BETWEEN', 'ADD_DAYS', 'IN_RANGE',
          'SUM', 'COUNT', 'FILTER', 'MAP', 'GROUP_BY',
        ],
      },
    },
    definitions: {
      AstNode: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string' },
        },
      },
    },
    oneOf: [
      {
        properties: {
          type: { const: 'const' },
          valueType: { type: 'string', enum: ['DEC', 'STR', 'BOOL', 'DATE', 'LIST'] },
          value: {},
        },
        required: ['type', 'valueType', 'value'],
      },
      {
        properties: {
          type: { const: 'var' },
          path: { type: 'string' },
          fallback: {},
        },
        required: ['type', 'path'],
      },
      {
        properties: {
          type: { const: 'param' },
          paramCode: { type: 'string' },
        },
        required: ['type', 'paramCode'],
      },
      {
        properties: {
          type: { const: 'DIV' },
          left: { $ref: '#/definitions/AstNode' },
          right: { $ref: '#/definitions/AstNode' },
          on_zero: { type: 'string', enum: ['ERROR', 'ZERO', 'NULL'] },
        },
        required: ['type', 'left', 'right', 'on_zero'],
      },
      {
        properties: {
          type: { const: 'ROUND' },
          operand: { $ref: '#/definitions/AstNode' },
          scale: { type: 'integer', minimum: 0, maximum: 8 },
          mode: { type: 'string', enum: ['HALF_UP', 'HALF_DOWN', 'HALF_EVEN', 'FLOOR', 'CEIL'] },
        },
        required: ['type', 'operand', 'scale', 'mode'],
      },
      {
        properties: {
          type: { const: 'COND' },
          condition: { $ref: '#/definitions/AstNode' },
          thenBranch: { $ref: '#/definitions/AstNode' },
          elseBranch: { $ref: '#/definitions/AstNode' },
        },
        required: ['type', 'condition', 'thenBranch', 'elseBranch'],
      },
      {
        properties: {
          type: { const: 'LET' },
          bindings: {
            type: 'object',
            additionalProperties: { $ref: '#/definitions/AstNode' },
          },
          in: { $ref: '#/definitions/AstNode' },
        },
        required: ['type', 'bindings', 'in'],
      },
    ],
  };
}

