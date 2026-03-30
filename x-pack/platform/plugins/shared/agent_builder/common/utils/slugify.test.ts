/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases input', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('replaces spaces with hyphens', () => {
    expect(slugify('my connector name')).toBe('my-connector-name');
  });

  it('strips accents', () => {
    expect(slugify('café résumé')).toBe('cafe-resume');
  });

  it('replaces non-alphanumeric characters with hyphens', () => {
    expect(slugify('hello@world#test')).toBe('hello-world-test');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('hello---world')).toBe('hello-world');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('--hello--')).toBe('hello');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles strings with only special characters', () => {
    expect(slugify('!@#$%')).toBe('');
  });
});
