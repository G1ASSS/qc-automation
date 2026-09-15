import { describe, expect, it } from 'vitest';
import { SHEET_HEADERS, toSheetValues } from '../../src/integrations/google-sheets/sheetsClient.js';
import { formatBangkok, formatDateForDisplay } from '../../src/utils/timezone.js';

describe('sheets mapping', () => {
  it('has the 14 required columns in order', () => {
    expect([...SHEET_HEADERS]).toEqual([
      'Date', 'Inspection Type', 'Factory', 'Process', 'Job Number', 'Number',
      'Machine No', 'Time', 'QC Check', 'QC Result', 'Status', 'Telegram User', 'Received At', 'Defect / Remark',
    ]);
  });

  it('maps the sample record to exactly one row', () => {
    const values = toSheetValues({
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
      status: 'Unfinished',
      telegramUsername: 'qc_user',
      receivedAt: new Date('2026-09-15T08:03:00.000Z'),
      defectRemark: 'scratch 5pcs',
    });
    expect(values).toHaveLength(1);
    const row = values[0] as unknown[];
    expect(row[0]).toBe('15/09/2026');
    expect(row.slice(1, 11)).toEqual([
      'IPQC Random Inspection', 'Factory 2', 'Row hole', 'TD-HM-014', 4, '23', '15:03', '100%=1pc.', 'OK', 'Unfinished',
    ]);
    expect(row[11]).toBe('@qc_user');
    expect(row[13]).toBe('scratch 5pcs');
  });
});

describe('timezone helpers', () => {
  it('formats ISO date as DD/MM/YYYY', () => {
    expect(formatDateForDisplay('2026-09-15')).toBe('15/09/2026');
  });

  it('formats instants in Asia/Bangkok', () => {
    // 08:03 UTC == 15:03 Bangkok (UTC+7, no DST)
    expect(formatBangkok(new Date('2026-09-15T08:03:00.000Z'))).toBe('15/09/2026 15:03');
  });
});
