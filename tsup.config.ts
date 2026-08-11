import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'index.native': 'src/index.native.ts',
    firebase: 'src/providers/firebase/firebase.web.ts',
    'firebase.native': 'src/providers/firebase/firebase.native.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: [
    'react',
    'react-native',
    'firebase',
    'firebase/app',
    'firebase/messaging',
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
  ],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
