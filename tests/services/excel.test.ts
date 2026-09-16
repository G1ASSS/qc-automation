import { describe, expect, it } from 'vitest';
import { compareQcRows, factoryRank, processRank, qcCheckDisplay } from '../../src/services/excelExportService.js';

describe('qcCheckDisplay', () => {
  it('extracts just the pcs count', () => {
    expect(qcCheckDisplay('100%=1pc.')).toBe(1);
    expect(qcCheckDisplay('100% =1pc')).toBe(1);
    expect(qcCheckDisplay('100%=10pc')).toBe(10);
    expect(qcCheckDisplay('Random Inspection 30pcs; Found 30pcs')).toBe(30);
  });

  it('keeps plain numbers and empty values', () => {
    expect(qcCheckDisplay('30')).toBe(30);
    expect(qcCheckDisplay(null)).toBe('');
    expect(qcCheckDisplay('')).toBe('');
  });

  it('keeps non-quantity text as-is', () => {
    expect(qcCheckDisplay('visual check')).toBe('visual check');
  });
});

describe('processRank', () => {
  it('orders hole before border A before border B', () => {
    expect(processRank('Row hole')).toBe(0);
    expect(processRank('hole line')).toBe(0);
    expect(processRank('Row border line (A)')).toBe(1);
    expect(processRank('Row border line (B)')).toBe(2);
    expect(processRank('Row border line')).toBe(3);
    expect(processRank('Assembly') > 3).toBe(true);
    expect(processRank(null)).toBe(99);
  });
});

describe('compareQcRows', () => {
  const mk = (date: string, factory: string, process: string | null, created: string) => ({
    inspectionDate: new Date(`${date}T00:00:00.000Z`),
    factory,
    process,
    createdAt: new Date(created),
  });

  it('sorts date, then factory, then process group, then arrival', () => {
    const rows = [
      mk('2026-09-16', 'Factory 2', 'Row hole', '2026-09-15T19:27:00Z'),
      mk('2026-09-15', 'Factory 2', 'Row border line (A)', '2026-09-15T19:28:00Z'),
      mk('2026-09-15', 'Factory 1', 'Row border line (A)', '2026-09-15T19:29:00Z'),
      mk('2026-09-15', 'Factory 2', 'Row hole', '2026-09-15T19:30:00Z'),
      mk('2026-09-15', 'Factory 1', 'hole line', '2026-09-15T19:31:00Z'),
    ];
    rows.sort(compareQcRows);
    expect(rows.map((r) => `${r.inspectionDate.toISOString().slice(0, 10)} ${r.factory} ${r.process}`)).toEqual([
      '2026-09-15 Factory 1 hole line',
      '2026-09-15 Factory 1 Row border line (A)',
      '2026-09-15 Factory 2 Row hole',
      '2026-09-15 Factory 2 Row border line (A)',
      '2026-09-16 Factory 2 Row hole',
    ]);
  });
});

describe('factoryRank', () => {
  it('orders factory numbers numerically', () => {
    expect(factoryRank('Factory 2')).toBe(2);
    expect(factoryRank('Factory 10')).toBe(10);
    expect(factoryRank('factory 1')).toBe(1);
    expect(factoryRank('unknown') > 100).toBe(true);
    expect(factoryRank(null)).toBe(99999);
  });
});
