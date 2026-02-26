import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainNavigator from './navigation/MainNavigator';
import LoginScreen from './screens/LoginScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { initDB } from './db/initDB';
import './localization/i18n';

export default function App() {
    const [isReady, setIsReady] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        initialize();
    }, []);

    const initialize = async () => {
        try {
            // Initialize database
            await initDB();

            // Check if user profile exists
            const profile = await AsyncStorage.getItem('user-profile');
            setIsAuthenticated(!!profile);

        } catch (e) {
            console.warn('Initialization error:', e);
        } finally {
            setIsReady(true);
        }
    };

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2e7d32' }}>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 20 }}>AgriChain</Text>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{ marginTop: 20, color: 'rgba(255,255,255,0.8)' }}>Empowering Farmers...</Text>
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <ErrorBoundary>
                <SafeAreaProvider>
                    <LoginScreen onLoginSuccess={handleLoginSuccess} />
                </SafeAreaProvider>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <NavigationContainer>
                    <MainNavigator />
                </NavigationContainer>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}
