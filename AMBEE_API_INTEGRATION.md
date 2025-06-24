# Ambee Weather API Integration

## Overview
The WeatherInteractiveMap component now integrates with the Ambee Weather API to provide real-time weather data for Ghana and West Africa regions.

## Setup Instructions

### 1. Get Ambee API Key
1. Visit [https://api.ambeedata.com/](https://api.ambeedata.com/)
2. Sign up for a free account
3. Navigate to your dashboard to get your API key

### 2. Configure Environment Variables
1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your API key:
   ```
   VITE_AMBEE_API_KEY=your-actual-api-key-here
   ```

### 3. Restart Development Server
```bash
npm run dev
```

## Features

### Real-time Weather Data
- **Temperature**: Current temperature in Celsius
- **Weather Condition**: Sunny, Cloudy, Rainy, etc.
- **Humidity**: Relative humidity percentage
- **Wind Speed**: Wind speed in km/h
- **Rainfall**: Precipitation in mm
- **Visibility**: Visibility in kilometers
- **Pressure**: Atmospheric pressure in hPa

### Fallback System
- **Mock Data**: When API is unavailable, the system uses intelligent mock data
- **Static Data**: Falls back to pre-configured regional weather data
- **Error Handling**: Graceful degradation with user-friendly error messages

### Coverage Areas
- **Ghana**: 16 regions with detailed district-level data
- **West Africa**: 14 countries with country-level markers
- **Weather Zones**: 5 climate zones across West Africa

## Technical Implementation

### API Service
```javascript
const ambeeWeatherService = {
  async getWeatherByCoordinates(lat, lng) {
    // Fetches real-time weather data
    // Includes timeout handling (5 seconds)
    // Automatic fallback to mock data
  }
}
```

### Error Handling
- **Network Timeouts**: 5-second timeout for API requests
- **Invalid Responses**: Validates API response format
- **Missing API Key**: Automatic fallback when no key is configured
- **Rate Limiting**: Handles API rate limit responses

### Performance Optimization
- **Caching**: Weather data is cached per location to avoid redundant API calls
- **Lazy Loading**: Weather data is fetched only when regions/districts are clicked
- **Abort Controllers**: Prevents memory leaks from cancelled requests

## Usage Examples

### Basic Usage
The weather data is automatically fetched when users click on:
- Ghana regional markers (🇬🇭 flag icons)
- District markers (colored circles)

### Programmatic Access
```javascript
// Get weather for specific coordinates
const weatherData = await ambeeWeatherService.getWeatherByCoordinates(
  5.6037, // latitude
  -0.1870 // longitude
);
```

## API Response Format
```javascript
{
  temperature: "27°C",
  condition: "Partly Cloudy",
  humidity: "78%",
  windSpeed: "15 km/h",
  rainfall: "2.5mm",
  visibility: "10km",
  pressure: "1013 hPa",
  icon: CloudIcon
}
```

## Troubleshooting

### No Weather Data Showing
1. Check if your API key is correctly set in `.env`
2. Verify the API key is valid and has quota remaining
3. Check browser console for error messages

### API Quota Exceeded
- The system will automatically switch to mock data
- Consider upgrading your Ambee plan for higher quotas

### Slow Loading
- Weather data fetches on demand (when clicking markers)
- Network timeouts are set to 5 seconds
- Mock data provides instant fallback

## Security Notes
- API keys are only accessible in the browser environment
- Never commit actual API keys to version control
- Use `.env.local` for local development keys
- Consider using environment-specific API keys for production

## Future Enhancements
- **Forecast Data**: 7-day weather forecasts
- **Historical Data**: Past weather patterns
- **Weather Alerts**: Severe weather notifications
- **Agricultural Advisories**: Crop-specific weather recommendations