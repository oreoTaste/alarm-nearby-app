import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mygps.planner',
  appName: 'MYGPS',
  webDir: 'dist', // ★ 여기가 www가 아닌 dist인지 꼭 확인!
  bundledWebRuntime: false
};

export default config;
