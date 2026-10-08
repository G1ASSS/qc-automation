import { describe, expect, it } from 'vitest';
import { classifyShift, dayNightOf } from '../../src/utils/timezone.js';

describe('classifyShift', () => {
  it('treats 00:00-07:59 as night regardless of code', () => {
    expect(classifyShift(null, '00:39')).toBe('night');
    expect(classifyShift(null, '07:53')).toBe('night');
    expect(classifyShift('A', '01:06')).toBe('night');
  });
  it('trusts night codes at any hour', () => {
    expect(classifyShift('B', '03:39')).toBe('night');
    expect(classifyShift('B', '21:39')).toBe('night');
    expect(classifyShift('B', '15:00')).toBe('night');
    expect(classifyShift('N', '10:00')).toBe('night');
  });
  it('trusts other codes as day (covers overtime to 22:00)', () => {
    expect(classifyShift('A', '10:29')).toBe('day');
    expect(classifyShift('A', '21:30')).toBe('day');
    expect(classifyShift('C', '12:00')).toBe('day');
  });
  it('uses overtime-aware time rule without a code', () => {
    expect(classifyShift(null, '21:00')).toBe('day');
    expect(classifyShift(null, '15:48')).toBe('day');
    expect(classifyShift(null, '08:00')).toBe('day');
    expect(classifyShift(null, '22:30')).toBe('night');
    expect(classifyShift('', '22:00')).toBe('night');
  });
  it('returns null without time and without night code', () => {
    expect(classifyShift(null, null)).toBe(null);
    expect(classifyShift('A', null)).toBe('day');
    expect(classifyShift('', 'nope')).toBe(null);
  });
});

describe('dayNightOf (time-only legacy)', () => {
  it('splits at 20:00/08:00', () => {
    expect(dayNightOf('20:00')).toBe('night');
    expect(dayNightOf('07:59')).toBe('night');
    expect(dayNightOf('08:00')).toBe('day');
    expect(dayNightOf(null)).toBe(null);
  });
});
