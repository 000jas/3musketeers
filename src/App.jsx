import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainNavigator from './navigation/MainNavigator';
import LoginScreen from './screens/LoginScreen';
import FarmDetailsScreen from './screens/FarmDetailsScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { initDB } from './db/initDB';
import { getFarmByPhone } from './db/supabase';
import { AuthProvider } from './utils/AuthContext';
import './localization/i18n';

export default function App() {
    const [isReady, setIsReady] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasFarmDetails, setHasFarmDetails] = useState(false);

    useEffect(() => { initialize(); }, []);

    const handleLogout = async () => {
        try {
            await AsyncStorage.multiRemove([
                'user-profile', 'farm-details', 'user-crops',
                'notifications_v1', 'weather-cache', 'soil-preference',
                'manual-location', 'last-gps-location', 'user-language'
            ]);
        } catch (e) {
            console.warn('Logout cleanup error:', e);
        }
        setIsAuthenticated(false);
        setHasFarmDetails(false);
    };

    const authContextValue = useMemo(() => ({ onLogout: handleLogout }), []);

    const initialize = async () => {
        try {
            await initDB();
            const profile = await AsyncStorage.getItem('user-profile');
            if (profile) {
                setIsAuthenticated(true);
                const farmExists = await checkFarmDetails(JSON.parse(profile).phone);
                setHasFarmDetails(farmExists);
            }
        } catch (e) {
            console.warn('Initialization error:', e);
        } finally {
            setIsReady(true);
        }
    };

    const checkFarmDetails = async (phone) => {
        try {
            const cached = await AsyncStorage.getItem('farm-details');
            if (cached) return true;
            const farm = await getFarmByPhone(phone);
            if (farm) {
                await AsyncStorage.setItem('farm-details', JSON.stringify(farm));
                return true;
            }
            return false;
        } catch (e) {
            console.warn('Farm details check failed:', e);
            const cached = await AsyncStorage.getItem('farm-details');
            return !!cached;
        }
    };

    const handleLoginSuccess = async () => {
        setIsAuthenticated(true);
        try {
            const profile = await AsyncStorage.getItem('user-profile');
            if (profile) {
                const farmExists = await checkFarmDetails(JSON.parse(profile).phone);
                setHasFarmDetails(farmExists);
            }
        } catch (e) {
            console.warn('Post-login farm check failed:', e);
        }
    };

    const handleFarmSetupComplete = () => setHasFarmDetails(true);

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

    if (!hasFarmDetails) {
        return (
            <ErrorBoundary>
                <SafeAreaProvider>
                    <FarmDetailsScreen onFarmSetupComplete={handleFarmSetupComplete} />
                </SafeAreaProvider>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            <AuthProvider value={authContextValue}>
                <SafeAreaProvider>
                    <NavigationContainer>
                        <MainNavigator />
                    </NavigationContainer>
                </SafeAreaProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}
