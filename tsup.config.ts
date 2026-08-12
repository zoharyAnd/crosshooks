import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'index.native': 'src/index.native.ts',
    firebase: 'src/providers/firebase/firebase.web.ts',
    'firebase.native': 'src/providers/firebase/firebase.native.ts',
    onesignal: 'src/providers/onesignal/onesignal.web.ts',
    'onesignal.native': 'src/providers/onesignal/onesignal.native.ts',
    expo: 'src/providers/expo/expo.web.ts',
    'expo.native': 'src/providers/expo/expo.native.ts',
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
    'react-native-permissions',
    'react-onesignal',
    'react-native-onesignal',
    'expo-notifications',
  ],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
