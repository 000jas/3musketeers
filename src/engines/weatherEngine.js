/**
 * weatherEngine.js
 * 
 * Offline weather generation based on region and season
 * Provides realistic weather data without internet connection
 */

// Weather patterns by region and season
const WEATHER_PATTERNS = {
    // North India
    north: {
        winter: { tempRange: [5, 20], rainfall: 'low', humidity: [40, 60], conditions: ['Clear', 'Foggy', 'Partly Cloudy'] },
        summer: { tempRange: [25, 45], rainfall: 'very_low', humidity: [20, 40], conditions: ['Sunny', 'Hot', 'Hazy'] },
        monsoon: { tempRange: [25, 35], rainfall: 'high', humidity: [70, 90], conditions: ['Rainy', 'Cloudy', 'Thunderstorm'] },
        autumn: { tempRange: [15, 30], rainfall: 'medium', humidity: [50, 70], conditions: ['Pleasant', 'Partly Cloudy', 'Clear'] }
    },
    // South India
    south: {
        winter: { tempRange: [18, 28], rainfall: 'low', humidity: [50, 70], conditions: ['Pleasant', 'Clear', 'Partly Cloudy'] },
        summer: { tempRange: [28, 38], rainfall: 'low', humidity: [40, 60], conditions: ['Hot', 'Sunny', 'Humid'] },
        monsoon: { tempRange: [24, 32], rainfall: 'very_high', humidity: [75, 95], conditions: ['Heavy Rain', 'Cloudy', 'Thunderstorm'] },
        autumn: { tempRange: [22, 32], rainfall: 'medium', humidity: [60, 80], conditions: ['Humid', 'Partly Cloudy', 'Light Rain'] }
    },
    // West India
    west: {
        winter: { tempRange: [12, 25], rainfall: 'low', humidity: [45, 65], conditions: ['Clear', 'Pleasant', 'Sunny'] },
        summer: { tempRange: [28, 42], rainfall: 'very_low', humidity: [25, 45], conditions: ['Very Hot', 'Dry', 'Sunny'] },
        monsoon: { tempRange: [26, 34], rainfall: 'very_high', humidity: [75, 90], conditions: ['Heavy Rain', 'Cloudy', 'Humid'] },
        autumn: { tempRange: [20, 32], rainfall: 'medium', humidity: [55, 75], conditions: ['Pleasant', 'Partly Cloudy', 'Warm'] }
    },
    // East India
    east: {
        winter: { tempRange: [10, 22], rainfall: 'low', humidity: [50, 70], conditions: ['Cool', 'Clear', 'Foggy'] },
        summer: { tempRange: [30, 40], rainfall: 'medium', humidity: [60, 80], conditions: ['Hot', 'Humid', 'Partly Cloudy'] },
        monsoon: { tempRange: [26, 34], rainfall: 'very_high', humidity: [80, 95], conditions: ['Heavy Rain', 'Thunderstorm', 'Cloudy'] },
        autumn: { tempRange: [20, 30], rainfall: 'medium', humidity: [65, 85], conditions: ['Humid', 'Cloudy', 'Light Rain'] }
    },
    // Central India
    central: {
        winter: { tempRange: [8, 24], rainfall: 'low', humidity: [40, 60], conditions: ['Clear', 'Cool', 'Sunny'] },
        summer: { tempRange: [30, 45], rainfall: 'very_low', humidity: [20, 40], conditions: ['Very Hot', 'Dry', 'Sunny'] },
        monsoon: { tempRange: [26, 36], rainfall: 'high', humidity: [70, 85], conditions: ['Rainy', 'Cloudy', 'Humid'] },
        autumn: { tempRange: [18, 32], rainfall: 'medium', humidity: [50, 70], conditions: ['Pleasant', 'Clear', 'Warm'] }
    }
};

// Rainfall amounts (mm)
const RAINFALL_AMOUNTS = {
    very_low: [0, 5],
    low: [5, 20],
    medium: [20, 50],
    high: [50, 100],
    very_high: [100, 200]
};

/**
 * Determine current season based on month
 */
const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1; // 1-12

    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'summer';
    if (month >= 6 && month <= 9) return 'monsoon';
    return 'autumn'; // Oct-Nov
};

/**
 * Determine region zone from state
 */
const getRegionZone = (state) => {
    const stateUpper = state?.toUpperCase() || '';

    // North: Punjab, Haryana, Delhi, UP, Uttarakhand, HP, J&K
    if (stateUpper.includes('PUNJAB') || stateUpper.includes('HARYANA') ||
        stateUpper.includes('DELHI') || stateUpper.includes('UTTAR') ||
        stateUpper.includes('UTTARAKHAND') || stateUpper.includes('HIMACHAL') ||
        stateUpper.includes('JAMMU')) {
        return 'north';
    }

    // South: TN, Kerala, Karnataka, AP, Telangana
    if (stateUpper.includes('TAMIL') || stateUpper.includes('KERALA') ||
        stateUpper.includes('KARNATAKA') || stateUpper.includes('ANDHRA') ||
        stateUpper.includes('TELANGANA')) {
        return 'south';
    }

    // West: Maharashtra, Gujarat, Goa, Rajasthan
    if (stateUpper.includes('MAHARASHTRA') || stateUpper.includes('GUJARAT') ||
        stateUpper.includes('GOA') || stateUpper.includes('RAJASTHAN')) {
        return 'west';
    }

    // East: WB, Bihar, Odisha, Jharkhand, Assam, NE states
    if (stateUpper.includes('BENGAL') || stateUpper.includes('BIHAR') ||
        stateUpper.includes('ODISHA') || stateUpper.includes('JHARKHAND') ||
        stateUpper.includes('ASSAM') || stateUpper.includes('TRIPURA') ||
        stateUpper.includes('MEGHALAYA') || stateUpper.includes('MANIPUR')) {
        return 'east';
    }

    // Default to central: MP, Chhattisgarh
    return 'central';
};

/**
 * Generate random value within range
 */
const randomInRange = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate weather data for a location
 */
export const WeatherEngine = {
    /**
     * Get current weather for a region
     * @param {Object} region - { state, district }
     * @returns {Object} Weather data
     */
    getCurrentWeather: (region) => {
        const zone = getRegionZone(region?.state);
        const season = getCurrentSeason();
        const pattern = WEATHER_PATTERNS[zone][season];

        // Generate temperature
        const temp = randomInRange(pattern.tempRange[0], pattern.tempRange[1]);
        const feelsLike = temp + randomInRange(-2, 3);

        // Generate rainfall
        const rainfallRange = RAINFALL_AMOUNTS[pattern.rainfall];
        const rainfall = randomInRange(rainfallRange[0], rainfallRange[1]);

        // Generate humidity
        const humidity = randomInRange(pattern.humidity[0], pattern.humidity[1]);

        // Pick random condition
        const condition = pattern.conditions[Math.floor(Math.random() * pattern.conditions.length)];

        // Determine icon
        let icon = 'sunny';
        if (condition.includes('Rain') || condition.includes('Rainy')) icon = 'rainy';
        else if (condition.includes('Cloud')) icon = 'cloudy';
        else if (condition.includes('Thunder')) icon = 'thunderstorm';
        else if (condition.includes('Fog')) icon = 'cloudy';

        return {
            temperature: temp,
            feelsLike: feelsLike,
            condition: condition,
            humidity: humidity,
            rainfall: rainfall,
            icon: icon,
            season: season,
            zone: zone,
            lastUpdated: new Date().toISOString()
        };
    },

    /**
     * Get weather forecast for next 7 days
     * @param {Object} region - { state, district }
     * @returns {Array} 7-day forecast
     */
    getForecast: (region) => {
        const forecast = [];
        const zone = getRegionZone(region?.state);
        const season = getCurrentSeason();
        const pattern = WEATHER_PATTERNS[zone][season];

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);

            const temp = randomInRange(pattern.tempRange[0], pattern.tempRange[1]);
            const condition = pattern.conditions[Math.floor(Math.random() * pattern.conditions.length)];
            const rainfallRange = RAINFALL_AMOUNTS[pattern.rainfall];
            const rainfall = randomInRange(rainfallRange[0], rainfallRange[1]);

            let icon = 'sunny';
            if (condition.includes('Rain')) icon = 'rainy';
            else if (condition.includes('Cloud')) icon = 'cloudy';
            else if (condition.includes('Thunder')) icon = 'thunderstorm';

            forecast.push({
                date: date.toISOString().split('T')[0],
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                temperature: temp,
                condition: condition,
                rainfall: rainfall,
                icon: icon
            });
        }

        return forecast;
    },

    /**
     * Get farming advice based on weather
     * @param {Object} weather - Current weather data
     * @returns {String} Farming advice
     */
    getFarmingAdvice: (weather) => {
        if (weather.rainfall > 50) {
            return 'Heavy rainfall expected. Ensure proper drainage in fields. Delay fertilizer application.';
        }
        if (weather.temperature > 38) {
            return 'Very hot weather. Increase irrigation frequency. Provide shade for sensitive crops.';
        }
        if (weather.temperature < 15) {
            return 'Cool weather. Protect crops from frost. Good time for winter crop sowing.';
        }
        if (weather.humidity > 80) {
            return 'High humidity. Monitor for fungal diseases. Ensure good air circulation.';
        }
        if (weather.rainfall < 5 && weather.temperature > 30) {
            return 'Dry and hot conditions. Ensure adequate irrigation. Mulch to retain moisture.';
        }
        return 'Weather conditions are favorable for farming activities.';
    }
};
