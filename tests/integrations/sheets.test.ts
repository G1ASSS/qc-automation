import { describe, expect, it } from 'vitest';
import {
  GRID_WIDTH,
  SHEET_HEADERS,
  isShiftedRow,
  rescueShiftedRow,
  sheetRowKey,
  sortSheetRows,
  toSheetValues,
} from '../../src/integrations/google-sheets/sheetsClient.js';
import { formatBangkok, formatDateForDisplay } from '../../src/utils/timezone.js';

describe('sheets mapping', () => {
  it('has the 20 required columns in order', () => {
    expect([...SHEET_HEADERS]).toEqual([
      'Date', 'Inspection Type', 'Factory', 'Process', 'Job Number', '',
      'Number', '', 'QC Check', 'Machine No', 'QC Result', 'Time', 'Status',
      'Defect / Remark', 'Inspection Qty', 'Found Qty', 'Total NG', 'Shift',
      'Telegram User', 'Received At',
    ]);
  });

  it('maps the sample record to exactly one row', () => {
    const values = toSheetValues({
      inspectionDate: '2026-09-15',
      inspectionType: 'IPQC Random Inspection',
      factory: 'Factory 2',
      process: 'Row hole',
      jobNumber: 'TD-HM-014',
      number: '4',
      machineNumber: '23',
      inspectionTime: '15:03',
      qcCheck: '100%=1pc.',
      qcResult: 'OK',
      status: 'Unfinished',
      telegramUsername: 'qc_user',
      receivedAt: new Date('2026-09-15T08:03:00.000Z'),
      defectRemark: 'scratch 5pcs',
      shift: null,
      inspectionQty: null,
      foundQty: null,
      totalNg: null,
    });
    expect(values).toHaveLength(1);
    const row = values[0] as unknown[];
    expect(row[0]).toBe('15/09/2026');
    expect(row.slice(0, 14)).toEqual([
      '15/09/2026',
      'IPQC Random Inspection', 'Factory 2', 'Row hole', 'TD-HM-014', '', '4', '', 1, '23', 'OK', '15:03', 'Unfinished',
      'scratch 5pcs',
    ]);
    expect(row).toHaveLength(20);
    expect(row[18]).toBe('@qc_user');
    expect(typeof row[19]).toBe('string');
  });

  it('maps NG fields to the trailing columns', () => {
    const values = toSheetValues({
      inspectionDate: '2026-09-15',
      inspectionType: 'IPQC Random inspection reports have revealed problems',
      factory: 'Factory 2',
      process: 'hole line',
      jobNumber: 'DS-13-JD',
      number: '5',
      machineNumber: '18',
      inspectionTime: '21:39',
      qcCheck: 'Random Inspection 30pcs; Found 30pcs',
      qcResult: 'NG',
      status: null,
      telegramUsername: 'qc_user',
      receivedAt: new Date('2026-09-15T14:39:00.000Z'),
      defectRemark: 'Multiple white streaks on the black boards',
      shift: 'B',
      inspectionQty: 30,
      foundQty: 30,
      totalNg: 400,
    });
    const row = (values[0] as unknown[]) as (string | number)[];
    expect(row[10]).toBe('NG');
    expect(row[13]).toBe('Multiple white streaks on the black boards');
    expect(row.slice(14, 18)).toEqual([30, 30, 400, 'B']);
  });

  it('sorts rows by date ascending, keeping same-date arrival order', () => {
    const mk = (date: string, job: string): unknown[] => [date, 't', 'Factory 2', '', job];
    const sorted = sortSheetRows([
      mk('16/09/2026', 'second'),
      mk('15/09/2026', 'first-a'),
      mk('16/09/2026', 'third'),
      mk('15/09/2026', 'first-b'),
    ]);
    expect(sorted.map((r) => (r as unknown[])[4])).toEqual(['first-a', 'first-b', 'second', 'third']);
    // padded to full grid width so rewrite never leaves stale trailing cells
    for (const r of sorted) expect((r as unknown[]).length).toBe(GRID_WIDTH);
  });

  it('groups same-date rows by process: hole before border (A)', () => {
    const mk = (process: string, job: string): unknown[] => ['15/09/2026', 't', 'Factory 2', process, job];
    const sorted = sortSheetRows([
      mk('Row border line (A)', 'border-a'),
      mk('Row hole', 'hole-a'),
      mk('hole line', 'hole-b'),
    ]);
    expect(sorted.map((r) => (r as unknown[])[4])).toEqual(['hole-b', 'hole-a', 'border-a']);
  });

  it('groups rows by factory number before process', () => {
    const mk = (factory: string, process: string, job: string): unknown[] => ['15/09/2026', 't', factory, process, job];
    const sorted = sortSheetRows([
      mk('Factory 2', 'Row hole', 'f2-hole'),
      mk('Factory 1', 'Row border line (A)', 'f1-border'),
      mk('Factory 1', 'hole line', 'f1-hole'),
    ]);
    expect(sorted.map((r) => (r as unknown[])[4])).toEqual(['f1-hole', 'f1-border', 'f2-hole']);
  });

  it('detects rows shifted to start at column I', () => {
    const shifted = ['', '', '', '', '', '', '', '', '16/09/2026', 'IPQC', 'Factory 1', 'Row hole', 'ZW-89', '', '200', '', '1', '50', 'OK', '02:11', '', '', '', '', '', '', '@u', '16/09/2026, 03:27'];
    expect(isShiftedRow(shifted)).toBe(true);
    expect(isShiftedRow(['16/09/2026', 'IPQC', 'Factory 1', 'Row hole', 'ZW-89'])).toBe(false);
    // hand-typed rows without a user marker are left alone
    expect(isShiftedRow(['', '', '', '', '', '', '', '', '16/09/2026', 'x', 'y', 'z', 'JOB'])).toBe(false);
  });

  it('rescues shifted rows back to A-T', () => {
    const shifted = ['', '', '', '', '', '', '', '', '16/09/2026', 'IPQC', 'Factory 1', 'Row hole', 'ZW-89', '', '200', '', '1', '50', 'OK', '02:11', '', '', '', '', '', '', '@u', '16/09/2026, 03:27'];
    const fixed = rescueShiftedRow(shifted) as unknown[];
    expect(fixed).toHaveLength(20);
    expect(fixed.slice(0, 5)).toEqual(['16/09/2026', 'IPQC', 'Factory 1', 'Row hole', 'ZW-89']);
    expect(fixed[6]).toBe('200');
    expect(sheetRowKey(fixed)).toBe('16/09/2026|ZW-89|02:11|16/09/2026, 03:27');
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
