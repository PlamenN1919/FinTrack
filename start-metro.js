#!/usr/bin/env node

// Workaround for metro-cache-key module resolution issue in Node.js 24
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === 'metro-cache-key') {
    try {
      return originalRequire.call(this, id);
    } catch (e) {
      // Try to load from project root
      return originalRequire.call(this, require.resolve('metro-cache-key', {
        paths: [__dirname]
      }));
    }
  }
  return originalRequire.call(this, id);
};

// Now start Metro
require('./node_modules/metro/src/cli.js');

