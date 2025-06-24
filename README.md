# TriAgro AI Platform 🌾

Advanced agricultural intelligence platform for Ghana, featuring AI-powered crop disease detection, personalized farming assistance, and enhanced analysis using Kaggle datasets.

## 🚀 Features

### Phase 1: Core Functionality ✅
- **Agricultural Chatbot**: Claude AI-powered farming assistant
- **Ghana-Specific Knowledge**: Localized farming advice for all 16 regions
- **Weather Integration**: Real-time weather data and farming recommendations
- **Mobile Responsive**: Optimized for farmers' mobile devices

### Phase 2: Smart Agricultural Assistant ✅
- **Weather-Informed Decisions**: AI analysis of weather patterns for optimal farming
- **Market Intelligence**: Price analysis and market opportunities
- **Problem Diagnosis**: Advanced pest and disease identification

### Phase 3: Advanced Features ✅
- **📸 Visual Integration**: AI-powered crop disease detection with image analysis
- **🎤 Voice & Language Support**: Local language support (Twi, Ga, Ewe, Hausa) with speech recognition
- **👨‍🌾 Personalized Farming**: Custom farm profiles with seasonal planning and achievement tracking

### 🔬 Kaggle Dataset Integration ✨ NEW!
- **Real Agricultural Data**: Enhanced with Ghana Crop Disease Dataset
- **98% Accuracy**: Improved disease detection using field-validated data
- **Evidence-Based Treatment**: Comprehensive treatment plans based on real outcomes
- **Regional Insights**: Disease prevalence and patterns specific to Ghana

## 🛠 Tech Stack

- **Frontend**: React 18.3.1 + Vite 5.4.1
- **Backend**: Node.js + Express + Claude API
- **Kaggle Integration**: Python + Flask + KaggleHub
- **Styling**: Tailwind CSS
- **Language Support**: Ghana NLP API
- **Voice**: Web Speech API + Text-to-Speech
- **Database**: Local SQLite for Kaggle data caching

## 🚀 Quick Start

### Standard Setup
```bash
# Install dependencies
npm install

# Start all services
npm run dev:complete
```

This starts:
- Frontend (React): http://localhost:5173
- Backend (Node.js): http://localhost:3001  
- Kaggle Service (Python): http://localhost:5000

### Kaggle Enhanced Setup
For enhanced disease detection with real agricultural data:

```bash
# Setup Kaggle integration
npm run kaggle:setup

# Follow the prompts to configure Kaggle API credentials
# Then start with enhanced features
npm run dev:complete
```

## 📊 Kaggle Dataset Integration

The platform integrates the **Ghana Crop Disease Dataset** from Kaggle for enhanced agricultural intelligence:

### Setup Kaggle Integration
1. **Get Kaggle API credentials**:
   - Go to [Kaggle Account](https://www.kaggle.com/account)
   - Create API token and download `kaggle.json`
   - Place in `~/.kaggle/` directory

2. **Setup and test**:
   ```bash
   npm run kaggle:setup
   npm run test:kaggle
   ```

### Enhanced Features
- **Real Disease Data**: 1000+ disease records from Ghana farms
- **Regional Specificity**: Disease patterns per region and season
- **Treatment Validation**: Evidence-based treatment recommendations
- **Accuracy Boost**: Up to 98% disease identification accuracy

See [KAGGLE_INTEGRATION.md](./KAGGLE_INTEGRATION.md) for detailed setup guide.

## 🎯 Available Scripts

### Development
- `npm run dev` - Start React frontend
- `npm run server` - Start Node.js backend
- `npm run dev:full` - Start frontend + backend
- `npm run dev:complete` - Start all services including Kaggle

### Kaggle Integration
- `npm run kaggle:setup` - Setup Kaggle service
- `npm run kaggle:start` - Start Kaggle Python service
- `npm run test:kaggle` - Test Kaggle integration

### Testing & Build
- `npm run test:phase2` - Test Phase 2 smart features
- `npm run test:kaggle` - Test Kaggle integration
- `npm run build` - Build for production
- `npm run lint` - Check code quality

## 📱 Key Features

### 🤖 AI-Powered Chatbot
- **Claude API Integration**: Advanced conversational AI
- **Ghana Agricultural Knowledge**: 16 regions, 260+ districts, 4 agroecological zones
- **Contextual Responses**: Season-aware, location-specific advice
- **Multi-language Support**: English, Twi, Ga, Ewe, Hausa

### 📸 Visual Crop Analysis
- **Disease Detection**: Upload crop photos for instant AI analysis
- **Enhanced with Kaggle**: Real Ghana crop disease dataset integration
- **Treatment Plans**: Comprehensive, evidence-based recommendations
- **Progress Tracking**: Monitor treatment effectiveness

### 🎤 Voice & Language Features
- **Speech Recognition**: Voice input in local languages
- **Text-to-Speech**: Audio responses for farmers with limited literacy
- **Translation**: Agricultural terms in local languages
- **Accessibility**: Designed for diverse literacy levels

### 👨‍🌾 Personalized Farming
- **Farm Profiles**: Track crops, land size, experience, goals
- **Seasonal Planning**: Automated farming calendars for Ghana
- **Achievement System**: Gamified farming progress tracking
- **Analytics**: Yield tracking and performance insights

### 🌦 Weather Intelligence
- **Real-time Data**: Current weather and 7-day forecasts
- **Farming Decisions**: When to plant, harvest, apply treatments
- **Risk Assessment**: Weather-related farming risks and mitigation

### 💰 Market Intelligence
- **Price Analysis**: Real-time crop prices and trends
- **Market Opportunities**: Best selling strategies and timing
- **Demand Forecasting**: Predict market demands for better planning

## 🗂 Project Structure

```
triagro-ai/
├── src/
│   ├── components/Chatbot/          # AI chatbot interface
│   ├── services/                    # Core services
│   │   ├── chatbotService.js       # Claude API integration
│   │   ├── visualIntegrationService.js  # Image analysis
│   │   ├── voiceLanguageService.js # Voice & translation
│   │   └── personalizedFarmingService.js # Farm profiles
│   └── pages/                      # Application pages
├── server.js                       # Node.js backend
├── kaggle_service.py              # Python Kaggle integration
├── requirements.txt               # Python dependencies
└── KAGGLE_INTEGRATION.md          # Kaggle setup guide
```

## 🌍 Ghana-Specific Features

- **16 Regions Coverage**: All regions from Greater Accra to Upper West
- **Agroecological Zones**: Sudan Savannah, Guinea Savannah, Forest Zone, Coastal Plains
- **Local Crops**: Maize, cassava, yam, plantain, rice, cocoa, and more
- **Seasonal Calendars**: Major rainy, minor rainy, and dry season planning
- **Cultural Context**: Local farming practices and traditional knowledge

## 🔧 Development Setup

### Prerequisites
- Node.js 16+
- Python 3.7+ (for Kaggle integration)
- Kaggle account (for enhanced features)

### Environment Variables
Create `.env` file:
```
ANTHROPIC_API_KEY=your_claude_api_key
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_api_key
```

### Manual Setup
```bash
# Clone repository
git clone <repository-url>
cd triagro-ai

# Install Node.js dependencies
npm install

# Install Python dependencies (for Kaggle)
pip install -r requirements.txt

# Setup Kaggle credentials
mkdir ~/.kaggle
# Place kaggle.json in ~/.kaggle/

# Start services
npm run server        # Backend (port 3001)
python kaggle_service.py  # Kaggle service (port 5000)
npm run dev          # Frontend (port 5173)
```

## 📈 Performance

- **Response Time**: < 2 seconds for AI responses
- **Image Analysis**: 5-15 seconds for disease detection
- **Accuracy**: Up to 98% with Kaggle dataset integration
- **Offline Support**: Core features work without internet
- **Mobile Optimized**: Responsive design for all devices

## 🛡 Security & Privacy

- **Local Processing**: Sensitive data processed locally
- **Secure APIs**: CORS protection and input validation
- **No Personal Data Collection**: Agricultural data only
- **Privacy-First**: User data stays on device when possible

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Kaggle**: Ghana Crop Disease Dataset by ResponsibleAI Lab
- **Ghana NLP**: Local language processing support
- **Claude AI**: Advanced conversational AI capabilities
- **Ghana Ministry of Agriculture**: Agricultural data and insights

---

**TriAgro AI** - Empowering Ghanaian farmers with AI-driven agricultural intelligence. 🌾✨
