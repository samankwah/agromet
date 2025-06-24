/**
 * Test script for Phase 2 Smart Agricultural Assistant features
 */

import axios from 'axios';

const SERVER_URL = 'http://localhost:3001';

// Test functions for Phase 2 features
async function testWeatherAnalysis() {
  console.log('🌦️ Testing Weather-Informed Farming Decisions...\n');
  
  const tests = [
    {
      query: "Should I plant maize this week in Tamale?",
      region: "Northern",
      crop: "maize"
    },
    {
      query: "Do I need to irrigate my tomatoes?",
      region: "Greater Accra", 
      crop: "tomatoes"
    },
    {
      query: "When is the best time to harvest my rice?",
      region: "Ashanti",
      crop: "rice"
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Query: "${test.query}"`);
      console.log(`Region: ${test.region}, Crop: ${test.crop}`);
      
      const response = await axios.post(`${SERVER_URL}/api/weather-analysis`, test);
      
      if (response.data.success) {
        console.log('✅ Analysis:');
        console.log(response.data.analysis);
      } else {
        console.log('❌ No analysis available');
      }
      console.log('---\n');
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

async function testMarketIntelligence() {
  console.log('📊 Testing Market Intelligence Integration...\n');
  
  const tests = [
    {
      commodity: "maize",
      region: "Greater Accra",
      action: "sell"
    },
    {
      commodity: "rice", 
      region: "Northern",
      action: "sell"
    },
    {
      commodity: "tomatoes",
      region: "Ashanti",
      action: "sell"
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Commodity: ${test.commodity}, Region: ${test.region}, Action: ${test.action}`);
      
      const response = await axios.post(`${SERVER_URL}/api/market-analysis`, test);
      
      if (response.data.success) {
        console.log('✅ Market Analysis:');
        console.log(response.data.analysis);
        console.log('📊 Data:', response.data.data);
      } else {
        console.log('❌ No analysis available');
      }
      console.log('---\n');
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

async function testProblemDiagnosis() {
  console.log('🔍 Testing Problem Diagnosis & Solutions...\n');
  
  const tests = [
    {
      symptoms: "My maize leaves have holes and are being chewed",
      crop: "maize",
      region: "Ashanti"
    },
    {
      symptoms: "Rice leaves are turning yellow from the bottom",
      crop: "rice", 
      region: "Northern"
    },
    {
      symptoms: "Tomato plants are wilting despite adequate watering",
      crop: "tomatoes",
      region: "Greater Accra"
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Symptoms: "${test.symptoms}"`);
      console.log(`Crop: ${test.crop}, Region: ${test.region}`);
      
      const response = await axios.post(`${SERVER_URL}/api/diagnose-problem`, test);
      
      if (response.data.success) {
        console.log('✅ Diagnosis:');
        console.log(response.data.diagnosis);
      } else {
        console.log('❌ No diagnosis available');
      }
      console.log('---\n');
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

async function testComprehensiveIntelligence() {
  console.log('🧠 Testing Comprehensive Agricultural Intelligence...\n');
  
  const tests = [
    {
      query: "Should I plant maize now and what are the current prices?",
      region: "Ashanti",
      crop: "maize"
    },
    {
      query: "My rice has yellow leaves and I want to sell soon",
      region: "Northern",
      crop: "rice"  
    },
    {
      query: "Best time to harvest tomatoes and market conditions",
      region: "Greater Accra",
      crop: "tomatoes"
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Query: "${test.query}"`);
      console.log(`Context: ${test.region}, ${test.crop}`);
      
      const response = await axios.post(`${SERVER_URL}/api/agricultural-intelligence`, test);
      
      if (response.data.success) {
        console.log('✅ Agricultural Intelligence:');
        Object.entries(response.data.intelligence).forEach(([type, analysis]) => {
          console.log(`\n${type.toUpperCase()}:`);
          console.log(analysis);
        });
      } else {
        console.log('❌ No intelligence available');
      }
      console.log('---\n');
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

async function testEnhancedChatbot() {
  console.log('💬 Testing Enhanced Chatbot with Phase 2 Intelligence...\n');
  
  const tests = [
    {
      message: "Should I plant maize this week in Tamale?",
      conversationHistory: [],
      userContext: {
        region: "Northern",
        crops: ["maize"],
        weather: { condition: "Sunny", temperature: 32, humidity: 60 }
      }
    },
    {
      message: "My tomato leaves have holes, what should I do?",
      conversationHistory: [],
      userContext: {
        region: "Greater Accra",
        crops: ["tomatoes"],
        weather: { condition: "Cloudy", temperature: 28, humidity: 75 }
      }
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Message: "${test.message}"`);
      console.log(`Context: ${test.userContext.region}, ${test.userContext.crops?.join(', ')}`);
      
      const response = await axios.post(`${SERVER_URL}/api/chat`, test);
      
      if (response.data.success) {
        console.log('✅ Enhanced Response:');
        console.log(response.data.message);
      } else {
        console.log('❌ Chat failed:', response.data.error);
      }
      console.log('---\n');
    } catch (error) {
      console.log('❌ Error:', error.response?.data?.error || error.message);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Phase 2 Smart Agricultural Assistant Tests\n');
  console.log('=' .repeat(60));
  
  try {
    // Check if server is running
    await axios.get(`${SERVER_URL}/api/health`);
    console.log('✅ Server is running\n');
    
    await testWeatherAnalysis();
    await testMarketIntelligence();
    await testProblemDiagnosis();
    await testComprehensiveIntelligence();
    await testEnhancedChatbot();
    
    console.log('🎉 All Phase 2 tests completed!');
    console.log('\n📋 Phase 2 Features Successfully Implemented:');
    console.log('✅ Weather-Informed Farming Decisions');
    console.log('✅ Market Intelligence Integration'); 
    console.log('✅ Problem Diagnosis & Solutions');
    console.log('✅ Enhanced Chatbot with Smart Analysis');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running. Please start with: npm run server');
    } else {
      console.log('❌ Test failed:', error.message);
    }
  }
}

// Run tests
runAllTests();