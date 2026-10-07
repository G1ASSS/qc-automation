import { describe, expect, it } from 'vitest';
import { lineFor } from '../../src/services/summaryService.js';

describe('lineFor', () => {
  it('maps hole family incl. drilling', () => {
    expect(lineFor('Row hole')).toBe('hole');
    expect(lineFor('hole line')).toBe('hole');
    expect(lineFor('Drilling Line')).toBe('hole');
  });
  it('maps factory 3 production lines to their own sections', () => {
    expect(lineFor('Paint Line A')).toBe('painting');
    expect(lineFor('Paint Line B')).toBe('painting');
    expect(lineFor('Laminate')).toBe('laminate');
    expect(lineFor('Assembly')).toBe('assembly');
    expect(lineFor('Welding Line')).toBe('welding');
    expect(lineFor('Sticker')).toBe('sticker');
    expect(lineFor('Equipment')).toBe('equipment');
    expect(lineFor('Banding')).toBe('banding');
  });
  it('maps packing and cutting', () => {
    expect(lineFor('Packing Bag')).toBe('packing');
    expect(lineFor('Packing')).toBe('packing');
    expect(lineFor('Cutting Line')).toBe('cutting');
    expect(lineFor('Factory 2 Cutting')).toBe('cutting');
  });
  it('keeps unknown processes in special work only', () => {
    expect(lineFor('Something Odd')).toBe('special');
    expect(lineFor(null)).toBe('special');
  });
});
