import { describe, expect, it } from 'vitest';
import { displayableText } from '../../src/lib/presentation-content';

describe('displayableText', () => {
  it.each(['nq', 'NQ', ' nq ', 'na', 'n/a', 'null', 'undefined', '-'])('hides the placeholder %s', (value) => {
    expect(displayableText(value)).toBeNull();
  });

  it('preserves regular user content', () => {
    expect(displayableText('Practica el pasado simple')).toBe('Practica el pasado simple');
  });
});