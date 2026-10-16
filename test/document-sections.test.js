import assert from 'node:assert/strict';
import test from 'node:test';
import { splitIntoSections } from '../src/lib/documentSections.js';

test('splits long documents in order without losing or changing characters', () => {
  const source = `${'Heading\n\n'.repeat(350)}${'equation x = 2; citation [4].\n'.repeat(500)}`;
  const sections = splitIntoSections(source, 450);

  assert.ok(sections.length > 1);
  assert.ok(sections.every((section) => section.length > 0 && section.length <= 450));
  assert.equal(sections.join(''), source);
});

test('leaves short content and whitespace unchanged', () => {
  const source = '\n  heading\n\nbody  ';
  assert.deepEqual(splitIntoSections(source), [source]);
});