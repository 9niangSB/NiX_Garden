import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nixgarden.app',
  appName: 'NiX Garden',
  webDir: '.',          // index.html 在根目錄
  server: {
    // 開發時可改成電腦 IP，讓手機直接讀取 Live Server
    // url: 'http://192.168.1.x:3000',
    // cleartext: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#F2E9E4',
    // 強制直向
    // screenOrientation: 'portrait'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#F2E9E4',
      showSpinner: false
    }
  }
};

export default config;
