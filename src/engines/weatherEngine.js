/**
 * weatherEngine.js
 *
 * Live weather data from Tomorrow.io API.
 * Falls back to AsyncStorage cache, then offline seasonal estimation.
 */

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getTomorrowApiKey = () =>
    Constants.expoConfig?.extra?.TOMORROW_API_KEY
    || process.env.TOMORROW_API_KEY
    || '';

// Tomorrow.io weather code → condition + icon
const WEATHER_CODE_MAP = {
    0: { condition: 'Unknown', icon: 'partly-sunny' },
    1000: { condition: 'Clear', icon: 'sunny' },
    1100: { condition: 'Mostly Clear', icon: 'sunny' },
    1101: { condition: 'Partly Cloudy', icon: 'partly-sunny' },
    1102: { condition: 'Mostly Cloudy', icon: 'cloudy' },
    1001: { condition: 'Cloudy', icon: 'cloudy' },
    2000: { condition: 'Fog', icon: 'cloudy' },
    2100: { condition: 'Light Fog', icon: 'cloudy' },
    4000: { condition: 'Drizzle', icon: 'rainy' },
    4001: { condition: 'Rain', icon: 'rainy' },
    4200: { condition: 'Light Rain', icon: 'rainy' },
    4201: { condition: 'Heavy Rain', icon: 'rainy' },
    8000: { condition: 'Thunderstorm', icon: 'thunderstorm' },
    5000: { condition: 'Snow', icon: 'snow' },
};

const getWeatherInfo = (code) => WEATHER_CODE_MAP[code] || WEATHER_CODE_MAP[0];

// Offline fallback — season-based estimation
const offlineFallback = (region) => {
    const month = new Date().getMonth() + 1;
    let temp = 28, humidity = 60, condition = 'Clear', icon = 'sunny', rainfall = 0;
    if (month >= 12 || month <= 2) { temp = 15; condition = 'Cool'; icon = 'partly-sunny'; humidity = 50; }
    else if (month >= 3 && month <= 5) { temp = 36; humidity = 35; condition = 'Hot'; icon = 'sunny'; }
    else if (month >= 6 && month <= 9) { temp = 30; humidity = 80; condition = 'Rainy'; icon = 'rainy'; rainfall = 40; }
    return { temperature: temp, feelsLike: temp + 2, condition, humidity, rainfall, icon, windSpeed: 0, uvIndex: 0, visibility: 10, lastUpdated: new Date().toISOString(), source: 'offline' };
};

export const WeatherEngine = {
    /**
     * Get current weather from Tomorrow.io API.
     * Falls back to cache → offline estimate.
     * @param {Object} region - { state, district }
     * @param {Object} farmCoords - { latitude, longitude } from farm details
     */
    getCurrentWeather: async (region, farmCoords = null) => {
        const apiKey = getTomorrowApiKey();
        const lat = farmCoords?.latitude ?? 19.9975;
        const lng = farmCoords?.longitude ?? 73.7898;

        if (apiKey) {
            try {
                const url = `https://api.tomorrow.io/v4/weather/forecast?location=${lat},${lng}&apikey=${apiKey}`;
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    const current = data.timelines?.minutely?.[0]?.values
                        || data.timelines?.hourly?.[0]?.values;

                    if (current) {
                        const info = getWeatherInfo(current.weatherCode || 0);
                        const result = {
                            temperature: Math.round(current.temperature ?? 0),
                            feelsLike: Math.round(current.temperatureApparent ?? current.temperature ?? 0),
                            condition: info.condition,
                            humidity: Math.round(current.humidity ?? 0),
                            rainfall: Math.round((current.precipitationIntensity ?? 0) * 10) / 10,
                            icon: info.icon,
                            windSpeed: Math.round((current.windSpeed ?? 0) * 10) / 10,
                            uvIndex: current.uvIndex ?? 0,
                            visibility: Math.round((current.visibility ?? 0) * 10) / 10,
                            lastUpdated: new Date().toISOString(),
                            source: 'tomorrow.io',
                        };
                        await AsyncStorage.setItem('weather-cache', JSON.stringify(result));
                        return result;
                    }
                }
            } catch (err) {
                console.warn('Tomorrow.io API failed, using fallback:', err.message);
            }
        }

        // Try cache
        try {
            const cached = await AsyncStorage.getItem('weather-cache');
            if (cached) return { ...JSON.parse(cached), source: 'cached' };
        } catch { }

        return offlineFallback(region);
    },

    /**
     * Get farming advice based on current weather.
     */
    getFarmingAdvice: (weather) => {
        if (!weather) return 'Weather data unavailable.';
        if (weather.rainfall > 50) return 'Heavy rainfall. Ensure drainage and delay fertilizer application.';
        if (weather.rainfall > 20) return 'Moderate rain. Good for irrigation. Watch for waterlogging.';
        if (weather.temperature > 38) return 'Extreme heat. Irrigate early morning or evening. Protect crops from sunburn.';
        if (weather.temperature > 32) return 'Hot weather. Ensure adequate irrigation. Monitor for heat stress.';
        if (weather.temperature < 10) return 'Cold weather. Protect sensitive crops from frost damage.';
        if (weather.humidity > 80) return 'High humidity. Watch for fungal diseases. Ensure good air circulation.';
        return 'Favorable weather conditions. Good time for regular farm activities.';
    },
};
