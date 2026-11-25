export default {
  expo: {
    name: 'MamaPlus',
    slug: 'mamaplus-mobile',
    scheme: 'mamaplus',
    version: '1.0.4',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.mamaplus.mobile'
    },
    android: {
      package: 'com.mamaplus.mobile',
      versionCode: 5,
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
        backgroundColor: '#FFF8F5'
      },
      // Firebase Android client config (package must match com.mamaplus.mobile)
      googleServicesFile: './google-services.json'
    },
    androidStatusBar: {
      barStyle: 'dark-content',
      backgroundColor: '#f8fafc',
      translucent: false
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      'expo-secure-store',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#FFF8F5',
          image: './assets/splash-icon.png',
          resizeMode: 'contain',
          imageWidth: 220
        }
      ],
      [
        'expo-notifications',
        {
          color: '#E85D4C',
          defaultChannel: 'default',
        }
      ]
    ],
    extra: {
      eas: {
        projectId: 'c6718901-59ba-4ec4-8da9-42d1fd8e53a1'
      },
      // Falls back to production so installed builds always reach a real server.
      // For local development set EXPO_PUBLIC_API_URL=http://localhost:3000 in .env
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://mamaplus.co.ke',
      expoGoogleClientId:
        process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
        process.env.EXPO_GOOGLE_CLIENT_ID ||
        process.env.GOOGLE_CLIENT_ID ||
        '',
      expoGoogleWebClientId:
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
        process.env.EXPO_GOOGLE_WEB_CLIENT_ID ||
        process.env.GOOGLE_CLIENT_ID ||
        '',
      expoGoogleIosClientId:
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
        process.env.EXPO_GOOGLE_IOS_CLIENT_ID ||
        '',
      expoGoogleAndroidClientId:
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
        process.env.EXPO_GOOGLE_ANDROID_CLIENT_ID ||
        '',
      expoMicrosoftClientId:
        process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID ||
        process.env.EXPO_MICROSOFT_CLIENT_ID ||
        process.env.AZURE_AD_CLIENT_ID ||
        ''
    }
  }
}
