const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = {
    expo: {
        name: 'AgriChain',
        slug: 'AgriChain',
        version: '1.0.0',
        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'light',
        newArchEnabled: true,
        splash: {
            image: './assets/splash-icon.png',
            resizeMode: 'contain',
            backgroundColor: '#ffffff',
        },
        ios: { supportsTablet: true },
        android: {
            adaptiveIcon: {
                foregroundImage: './assets/adaptive-icon.png',
                backgroundColor: '#ffffff',
            },
            package: 'com.AgriChain.app',
            edgeToEdgeEnabled: true,
        },
        web: {
            favicon: './assets/favicon.png',
            bundler: 'metro',
        },
        plugins: [
            'expo-sqlite',
            [
                'expo-location',
                {
                    locationAlwaysAndWhenInUsePermission:
                        'Allow AgriChain to use your location to detect your farm location.',
                },
            ],
        ],
        extra: {
            GEMINI_API_KEY: process.env.GEMINI_API_KEY,
            GOOGLE_GEOCODING_API_KEY: process.env.GOOGLE_GEOCODING_API_KEY,
            SUPABASE_URL: process.env.SUPABASE_URL,
            SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
            TOMORROW_API_KEY: process.env.TOMORROW_API_KEY,
        },
    },
};
