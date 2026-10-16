import { describe, it, expect } from 'vitest';
import React from 'react';
import App from './App.jsx';

describe('IssuePilot Client Shell', () => {
  it('App component exports and is defined', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });
});
