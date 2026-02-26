/**
 * CropSelectionScreen.jsx
 *
 * One-time screen shown after FarmDetails is saved.
 * Suggests up to 5 rule-based matched crops for the user to pick from.
 * On continue, persists selections to Supabase user_selected_crops table
 * and caches them in AsyncStorage ('user-crops') for Dashboard use.
 *
 * Flow: Login → FarmDetails → CropSelection → Dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { fetchAllCrops, insertUserSelectedCrops } from '../db/cropSupabase';
import { filterCropsForFarm, computeSowingDate } from '../engines/cropFilterEngine';

// ─── Static crop icon mapping ─────────────────────────────────────────────────
// Maps crop_name → Ionicons icon name for visual identity on the card.
const CROP_ICONS = {
    'Wheat': 'nutrition-outline',
    'Rice': 'water-outline',
    'Tomato': 'rose-outline',
    'Cotton': 'cloud-outline',
    'Sugarcane': 'trending-up-outline',
    'Maize': 'cafe-outline',
    'Soybean': 'leaf-outline',
    'Groundnut': 'ellipse-outline',
    'Mustard': 'flower-outline',
    'Chickpea': 'radio-button-on-outline',
    'Onion': 'layers-outline',
    'Potato': 'grid-outline',
    'Chilli': 'flame-outline',
    'Turmeric': 'color-palette-outline',
    'Ginger': 'leaf-outline',
    'Bajra': 'cellular-outline',
    'Jowar': 'barcode-outline',
    'Sunflower': 'sunny-outline',
    'Lentil': 'ellipse-outline',
};

const getCropIcon = (cropName) => CROP_ICONS[cropName] ?? 'leaf-outline';

// ─── Static crop colour mapping ───────────────────────────────────────────────
const CROP_COLORS = {
    'Wheat': '#FFF8E1',
    'Rice': '#E3F2FD',
    'Tomato': '#FCE4EC',
    'Cotton': '#F3E5F5',
    'Sugarcane': '#E8F5E9',
    'Maize': '#FFF3E0',
    'Soybean': '#E8F5E9',
    'Groundnut': '#FBE9E7',
    'Mustard': '#FFFDE7',
    'Chickpea': '#E8EAF6',
    'Onion': '#FCE4EC',
    'Potato': '#F1F8E9',
    'Chilli': '#FBE9E7',
    'Turmeric': '#FFF8E1',
    'Ginger': '#E8F5E9',
    'Bajra': '#F3E5F5',
    'Jowar': '#E0F2F1',
    'Sunflower': '#FFFDE7',
    'Lentil': '#E8EAF6',
};

const getCropColor = (cropName) => CROP_COLORS[cropName] ?? '#E8F5E9';

const MAX_SELECTIONS = 5;

// ─── Component ────────────────────────────────────────────────────────────────

const CropSelectionScreen = ({ onCropSelectionComplete }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [crops, setCrops] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [usedFallback, setUsedFallback] = useState(false);
    const [farmData, setFarmData] = useState(null);

    useEffect(() => {
        loadSuggestions();
    }, []);

    // ── Load & Filter ──────────────────────────────────────────────────────────
    const loadSuggestions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Read farm context from AsyncStorage
            const farmStr = await AsyncStorage.getItem('farm-details');
            if (!farmStr) {
                setError('Farm details not found. Please complete farm setup first.');
                setLoading(false);
                return;
            }
            const farm = JSON.parse(farmStr);
            setFarmData(farm);

            // 2. Get live temperature from weather cache if saved
            let temperature = null;
            try {
                const weatherStr = await AsyncStorage.getItem('weather-cache');
                if (weatherStr) {
                    const weatherParsed = JSON.parse(weatherStr);
                    temperature = weatherParsed?.temperature ?? null;
                }
            } catch (_) { /* ignore */ }

            // Also check farm's own stored temperature (set during weather fetch)
            if (temperature == null && farm.temperature != null) {
                temperature = farm.temperature;
            }

            // 3. Determine current month (1-12)
            const currentMonth = farm.current_month ?? (new Date().getMonth() + 1);

            // 4. Fetch crops from Supabase
            const allCrops = await fetchAllCrops();

            // 5. Apply rule-based filter
            const { crops: suggested, usedFallback: fallback } = filterCropsForFarm(allCrops, {
                soil_type: farm.soil_type,
                area_in_hectares: farm.area_in_hectares,
                temperature,
                current_month: currentMonth,
                region: farm.formatted_address,  // coarse region matching
            });

            setCrops(suggested);
            setUsedFallback(fallback);
        } catch (err) {
            console.error('CropSelection loadSuggestions error:', err);
            setError('Failed to load crop suggestions. Please check your internet connection.');
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Selection ─────────────────────────────────────────────────────────────
    const toggleCrop = (cropId) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(cropId)) {
                next.delete(cropId);
            } else {
                if (next.size >= MAX_SELECTIONS) {
                    Alert.alert('Limit Reached', `You can select up to ${MAX_SELECTIONS} crops.`);
                    return prev;
                }
                next.add(cropId);
            }
            return next;
        });
    };

    // ── Save & Continue ───────────────────────────────────────────────────────
    const handleContinue = async () => {
        if (selectedIds.size === 0) {
            Alert.alert('No Crops Selected', 'Please select at least one crop to continue.');
            return;
        }

        setSaving(true);
        try {
            // Get user phone from AsyncStorage profile (phone-based auth, no Supabase auth)
            const profileStr = await AsyncStorage.getItem('user-profile');
            const profile = profileStr ? JSON.parse(profileStr) : {};
            const userPhone = profile.phone || '';

            if (!userPhone) {
                Alert.alert('Error', 'User profile not found. Please log in again.');
                return;
            }

            const currentMonth = farmData?.current_month ?? (new Date().getMonth() + 1);

            // Build insert rows for Supabase
            const selectedCrops = crops.filter(c => selectedIds.has(c.id));
            const rows = selectedCrops.map(crop => ({
                user_phone: userPhone,
                crop_id: crop.id,
                sowing_date: computeSowingDate(crop, currentMonth),
                irrigation_type: 'Drip',
                last_irrigation_date: null,
            }));

            await insertUserSelectedCrops(rows);

            // Build local user-crops format compatible with HomeScreen & CropScreen
            const localCrops = selectedCrops.map((crop, idx) => ({
                id: rows[idx].crop_id,
                name: crop.crop_name,
                sowingDate: rows[idx].sowing_date,
                irrigationType: 'Drip',
                lastIrrigationDate: null,
            }));

            await AsyncStorage.setItem('user-crops', JSON.stringify(localCrops));
            // Mark crops as selected so we don't show this screen again
            await AsyncStorage.setItem('crops-selected', 'true');

            if (onCropSelectionComplete) onCropSelectionComplete();
        } catch (err) {
            console.error('CropSelection handleContinue error:', err);
            Alert.alert('Save Failed', 'Could not save your crop selection. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── UI States ─────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#2e7d32" />
                <Text style={styles.loadingText}>Finding the best crops for your farm…</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.centered}>
                <Ionicons name="alert-circle-outline" size={60} color="#d32f2f" />
                <Text style={styles.errorTitle}>Oops!</Text>
                <Text style={styles.errorMsg}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadSuggestions}>
                    <Ionicons name="refresh" size={18} color="#fff" />
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    if (crops.length === 0) {
        return (
            <SafeAreaView style={styles.centered}>
                <Ionicons name="leaf-outline" size={60} color="#aaa" />
                <Text style={styles.emptyTitle}>No Matching Crops</Text>
                <Text style={styles.emptyMsg}>
                    We couldn't find recommended crops for your farm conditions right now.
                    You can skip this step and add crops manually from the Crop screen.
                </Text>
                <TouchableOpacity style={styles.skipBtn} onPress={() => {
                    AsyncStorage.setItem('crops-selected', 'true');
                    if (onCropSelectionComplete) onCropSelectionComplete();
                }}>
                    <Text style={styles.skipText}>Skip for Now</Text>
                    <Ionicons name="arrow-forward" size={18} color="#2e7d32" />
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const selectedCount = selectedIds.size;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* ── Header ── */}
            <View style={styles.header}>
                <View style={styles.iconCircle}>
                    <Ionicons name="leaf" size={36} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>Choose Your Crops</Text>
                <Text style={styles.headerSubtitle}>
                    {usedFallback
                        ? 'Top seasonal crops for this time of year (broadened search)'
                        : 'Personalised for your soil, climate, and farm size'}
                </Text>

                {/* Counter pill */}
                <View style={styles.counterPill}>
                    <Ionicons name="checkmark-circle" size={16} color="#2e7d32" />
                    <Text style={styles.counterText}>
                        {selectedCount}/{MAX_SELECTIONS} selected
                    </Text>
                </View>
            </View>

            {/* ── Crop Cards List ── */}
            <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            >
                {usedFallback && (
                    <View style={styles.fallbackBanner}>
                        <Ionicons name="information-circle-outline" size={18} color="#f57c00" />
                        <Text style={styles.fallbackText}>
                            Exact matches weren't found — showing top seasonal options instead.
                        </Text>
                    </View>
                )}

                {crops.map(crop => {
                    const isSelected = selectedIds.has(crop.id);
                    const cardColor = getCropColor(crop.crop_name);
                    return (
                        <TouchableOpacity
                            key={crop.id}
                            style={[
                                styles.cropCard,
                                { backgroundColor: cardColor },
                                isSelected && styles.cropCardSelected,
                            ]}
                            onPress={() => toggleCrop(crop.id)}
                            activeOpacity={0.8}
                        >
                            {/* Tick badge */}
                            <View style={[styles.tickBox, isSelected && styles.tickBoxSelected]}>
                                {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                            </View>

                            {/* Crop icon */}
                            <View style={[styles.cropIconBg, isSelected && styles.cropIconBgSelected]}>
                                <Ionicons
                                    name={getCropIcon(crop.crop_name)}
                                    size={32}
                                    color={isSelected ? '#fff' : '#2e7d32'}
                                />
                            </View>

                            {/* Crop info */}
                            <View style={styles.cropInfo}>
                                <Text style={styles.cropName}>{crop.crop_name}</Text>
                                <View style={styles.cropMeta}>
                                    <View style={styles.metaChip}>
                                        <Ionicons name="time-outline" size={12} color="#555" />
                                        <Text style={styles.metaText}>{crop.growth_duration_days}d</Text>
                                    </View>
                                    <View style={styles.metaChip}>
                                        <Ionicons name="water-outline" size={12} color="#555" />
                                        <Text style={styles.metaText}>{crop.water_requirement ?? 'Medium'}</Text>
                                    </View>
                                    <View style={styles.metaChip}>
                                        <Ionicons name="thermometer-outline" size={12} color="#555" />
                                        <Text style={styles.metaText}>
                                            {crop.min_temperature}–{crop.max_temperature}°C
                                        </Text>
                                    </View>
                                </View>

                                {/* Match badges */}
                                <View style={styles.badgeRow}>
                                    {crop._soilMatch && (
                                        <View style={styles.matchBadge}>
                                            <Text style={styles.matchBadgeText}>✓ Soil Match</Text>
                                        </View>
                                    )}
                                    {crop._seasonMatch && (
                                        <View style={[styles.matchBadge, { backgroundColor: '#E8F5E9' }]}>
                                            <Text style={[styles.matchBadgeText, { color: '#2e7d32' }]}>✓ In Season</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}

                <View style={{ height: 140 }} />
            </ScrollView>

            {/* ── Sticky Footer ── */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueBtn, selectedCount === 0 && styles.continueBtnDisabled]}
                    onPress={handleContinue}
                    disabled={saving || selectedCount === 0}
                >
                    {saving
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <>
                            <Text style={styles.continueBtnText}>
                                Continue{selectedCount > 0 ? ` with ${selectedCount} crop${selectedCount > 1 ? 's' : ''}` : ''}
                            </Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                        </>
                    }
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.skipFooterBtn}
                    onPress={async () => {
                        await AsyncStorage.setItem('crops-selected', 'true');
                        if (onCropSelectionComplete) onCropSelectionComplete();
                    }}
                >
                    <Text style={styles.skipFooterText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 30,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#d32f2f',
        marginTop: 16,
        marginBottom: 8,
    },
    errorMsg: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2e7d32',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyMsg: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    skipBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#2e7d32',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    skipText: {
        color: '#2e7d32',
        fontWeight: '600',
        fontSize: 16,
    },
    // Header
    header: {
        backgroundColor: '#2e7d32',
        paddingTop: 20,
        paddingBottom: 30,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 6,
        textAlign: 'center',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        paddingHorizontal: 16,
        lineHeight: 20,
    },
    counterPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginTop: 14,
        gap: 6,
    },
    counterText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2e7d32',
    },
    // List
    list: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    fallbackBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#FFF8E1',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#f57c00',
        gap: 8,
    },
    fallbackText: {
        flex: 1,
        fontSize: 13,
        color: '#e65100',
        lineHeight: 18,
    },
    // Crop Card
    cropCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 14,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        position: 'relative',
    },
    cropCardSelected: {
        borderColor: '#2e7d32',
        borderWidth: 2,
        elevation: 4,
        shadowOpacity: 0.15,
    },
    tickBox: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    tickBoxSelected: {
        borderColor: '#2e7d32',
        backgroundColor: '#2e7d32',
    },
    cropIconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    cropIconBgSelected: {
        backgroundColor: '#2e7d32',
    },
    cropInfo: {
        flex: 1,
    },
    cropName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 6,
    },
    cropMeta: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        gap: 3,
    },
    metaText: {
        fontSize: 11,
        color: '#444',
        fontWeight: '500',
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    matchBadge: {
        backgroundColor: '#FFF8E1',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    matchBadgeText: {
        fontSize: 11,
        color: '#f57c00',
        fontWeight: '600',
    },
    // Footer
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    continueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1b5e20',
        borderRadius: 14,
        paddingVertical: 16,
        elevation: 3,
    },
    continueBtnDisabled: {
        backgroundColor: '#a5d6a7',
        elevation: 0,
    },
    continueBtnText: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
    skipFooterBtn: {
        alignItems: 'center',
        paddingVertical: 10,
        marginTop: 4,
    },
    skipFooterText: {
        fontSize: 14,
        color: '#888',
    },
});

export default CropSelectionScreen;
