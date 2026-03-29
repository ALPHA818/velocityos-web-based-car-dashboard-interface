import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.velocityos.dashboard',
  appName: 'VelocityOS',
  webDir: 'dist/client',
  server: {
    allowNavigation: [
      'web.whatsapp.com',
      'open.spotify.com',
      'music.youtube.com',
    ],
  },
};

export default config;
