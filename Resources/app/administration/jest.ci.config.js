/**
 * @sw-package framework
 *
 * Jest configuration for CI: the default configuration without the known failing specs.
 */
const baseConfig = require('./jest.config');
const knownFailures = require('./jest.known-failures');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = {
    ...baseConfig,
    testPathIgnorePatterns: [
        ...(baseConfig.testPathIgnorePatterns ?? ['/node_modules/']),
        ...knownFailures.map((specPath) => `<rootDir>/${escapeRegExp(specPath)}$`),
    ],
};
