import { describe, expect, it } from 'vitest';
import { ParsedQCDataSchema, QcFilterSchema } from '../../src/validators/qcValidator.js';

describe('validators', () => {
  it('accepts the canonical parsed payload', () => {
    const r = ParsedQCDataSchema.safeParse({
      inspectionDate: '2026-09-15',
      inspectionType: 'IPQC Random Inspection',
      factory: 'Factory 2',
      process: 'Row hole',
      jobNumber: 'TD-HM-014',
      number: 4,
      machineNumber: '23',
      inspectionTime: '15:03',
      qcCheck: '100%=1pc.',
      qcResult: 'OK',
      defectRemark: null,
      status: 'Unfinished',
      originalStatus: 'unfinished',
    });
    expect(r.success).toBe(true);
  });

  it('rejects bad date/time shapes', () => {
    expect(ParsedQCDataSchema.safeParse({
      inspectionDate: '15/09/2026',
      inspectionType: 'x',
      factory: 'Factory 2',
      process: null,
      jobNumber: 'J',
      number: null,
      machineNumber: null,
      inspectionTime: '25:99',
      qcCheck: null,
      qcResult: null,
      status: null,
      originalStatus: null,
    }).success).toBe(false);
  });

  it('parses combined API filters', () => {
    const r = QcFilterSchema.safeParse({ date: '2026-09-15', factory: 'Factory 2', status: 'Unfinished' });
    expect(r.success).toBe(true);
  });
});
