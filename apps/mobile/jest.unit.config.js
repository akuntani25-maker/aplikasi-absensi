/**
 * Jest config khusus untuk unit tests yang TIDAK membutuhkan React Native environment.
 * Gunakan: npx jest --config jest.unit.config.js
 *
 * Menghindari masalah babel-preset-expo / react-native-worklets/plugin
 * yang tidak kompatibel dengan Node.js Jest environment.
 */
module.exports = {
  displayName: 'unit',
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/src/__tests__/lib/**/*.test.ts',
    '<rootDir>/src/__tests__/services/**/*.test.ts',
  ],
  transform: {
    '^.+\\.tsx?$': [
      'babel-jest',
      {
        configFile: false,
        babelrc: false,
        presets: [
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript',
        ],
        plugins: [
          // Transform ESM import/export → CommonJS require/module.exports
          '@babel/plugin-transform-modules-commonjs',
        ],
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  // Mock native modules yang tidak tersedia di Node
  moduleNameMapper: {
    '^react-native-mmkv$': '<rootDir>/src/__tests__/__mocks__/react-native-mmkv.ts',
  },
};
