/**
 * Market Intelligence Service for Agricultural Decision Making
 * Provides market-aware crop recommendations and pricing insights for Ghana
 */

class MarketIntelligenceService {
  constructor() {
    // Current market data (would connect to real APIs in production)
    this.currentPrices = {
      'yellow-maize': { price: 299.99, unit: 'per bag', trend: 'stable', demand: 'high' },
      'white-maize': { price: 289.99, unit: 'per bag', trend: 'rising', demand: 'high' },
      'rice': { price: 159.99, unit: 'per bag', trend: 'stable', demand: 'very-high' },
      'yam': { price: 389.99, unit: 'per bag', trend: 'rising', demand: 'high' },
      'cassava': { price: 129.99, unit: 'per bag', trend: 'stable', demand: 'moderate' },
      'tomatoes': { price: 149.99, unit: 'per crate', trend: 'volatile', demand: 'high' },
      'pepper': { price: 59.99, unit: 'per bag', trend: 'rising', demand: 'high' },
      'onion': { price: 89.99, unit: 'per bag', trend: 'seasonal', demand: 'moderate' },
      'plantain': { price: 79.99, unit: 'per bunch', trend: 'stable', demand: 'high' },
      'beans': { price: 199.99, unit: 'per bag', trend: 'rising', demand: 'moderate' },
      'soybeans': { price: 399.99, unit: 'per bag', trend: 'stable', demand: 'growing' },
      'sorghum': { price: 189.99, unit: 'per bag', trend: 'stable', demand: 'low' },
      'groundnuts': { price: 249.99, unit: 'per bag', trend: 'rising', demand: 'moderate' },
      'cocoa': { price: 850.00, unit: 'per bag', trend: 'volatile', demand: 'export' }
    };

    // Historical price trends (simulated - would use real historical data)
    this.historicalTrends = {
      'yellow-maize': {
        '6months': [280, 285, 290, 295, 298, 299.99],
        'seasonal_pattern': 'Low during harvest (July-August), High during planting (March-April)',
        'peak_months': [3, 4, 5], // March-May
        'low_months': [7, 8, 9] // July-September
      },
      'rice': {
        '6months': [150, 152, 155, 157, 158, 159.99],
        'seasonal_pattern': 'Stable year-round, slight increase during festivals',
        'peak_months': [12, 1], // December-January
        'low_months': [6, 7, 8] // June-August
      },
      'tomatoes': {
        '6months': [120, 140, 160, 180, 170, 149.99],
        'seasonal_pattern': 'Very volatile, peaks during dry season',
        'peak_months': [1, 2, 3], // January-March
        'low_months': [6, 7, 8] // June-August
      },
      'yam': {
        '6months': [350, 360, 370, 380, 385, 389.99],
        'seasonal_pattern': 'Peaks before harvest, drops after new yam season',
        'peak_months': [6, 7, 8], // June-August
        'low_months': [9, 10, 11] // September-November
      }
    };

    // Market centers and transportation costs
    this.marketCenters = {
      'Greater Accra': {
        major_markets: ['Tema Market', 'Kaneshie Market', 'Makola Market'],
        transport_access: 'excellent',
        price_premium: 1.1 // 10% higher than rural areas
      },
      'Ashanti': {
        major_markets: ['Kumasi Central Market', 'Kejetia Market'],
        transport_access: 'good',
        price_premium: 1.05
      },
      'Northern': {
        major_markets: ['Tamale Market', 'Yendi Market'],
        transport_access: 'fair',
        price_premium: 0.95 // 5% lower due to transportation costs
      },
      'Western': {
        major_markets: ['Takoradi Market', 'Tarkwa Market'],
        transport_access: 'good',
        price_premium: 1.02
      }
    };

    // Demand forecasting factors
    this.demandFactors = {
      'population_growth': 0.02, // 2% annual growth
      'urbanization_rate': 0.03, // 3% annual urban growth
      'export_potential': {
        'cocoa': 'very-high',
        'yam': 'moderate',
        'cassava': 'growing',
        'plantain': 'low'
      },
      'seasonal_demand': {
        'festival_periods': [12, 1], // December-January (Christmas/New Year)
        'school_feeding': [9, 10, 11, 1, 2, 3], // School term periods
        'ramadan_effect': 'variable' // Affects demand patterns
      }
    };
  }

  /**
   * Get current market price for a commodity
   */
  getCurrentPrice(commodity) {
    const normalizedName = commodity.toLowerCase().replace(/\s+/g, '-');
    return this.currentPrices[normalizedName] || null;
  }

  /**
   * Get comprehensive market analysis
   */
  getMarketAnalysis(commodity, region = null) {
    const price = this.getCurrentPrice(commodity);
    if (!price) {
      return `Sorry, I don't have current market data for ${commodity}. Please check with local markets.`;
    }

    const trends = this.historicalTrends[commodity.toLowerCase().replace(/\s+/g, '-')];
    const marketInfo = region ? this.marketCenters[region] : null;
    
    let analysis = `**Market Analysis for ${commodity}:**\n\n`;
    
    // Current price and trend
    analysis += `💰 **Current Price:** ₵${price.price} ${price.unit}\n`;
    analysis += `📈 **Trend:** ${this.formatTrend(price.trend)}\n`;
    analysis += `📊 **Demand Level:** ${this.formatDemand(price.demand)}\n\n`;
    
    // Regional pricing
    if (marketInfo) {
      const regionalPrice = price.price * marketInfo.price_premium;
      analysis += `🏪 **${region} Price:** ₵${regionalPrice.toFixed(2)} ${price.unit}\n`;
      analysis += `🚚 **Market Access:** ${marketInfo.transport_access}\n`;
      analysis += `🏢 **Major Markets:** ${marketInfo.major_markets.join(', ')}\n\n`;
    }
    
    // Seasonal patterns
    if (trends) {
      analysis += `📅 **Seasonal Pattern:** ${trends.seasonal_pattern}\n`;
      analysis += `📈 **Best Selling Months:** ${this.formatMonths(trends.peak_months)}\n`;
      analysis += `📉 **Lower Price Months:** ${this.formatMonths(trends.low_months)}\n\n`;
    }
    
    return analysis;
  }

  /**
   * Get price alerts and recommendations
   */
  getPriceAlert(commodity, action = 'sell') {
    const price = this.getCurrentPrice(commodity);
    if (!price) return null;

    const currentMonth = new Date().getMonth() + 1;
    const trends = this.historicalTrends[commodity.toLowerCase().replace(/\s+/g, '-')];
    
    let alert = `**Price Alert for ${commodity}:**\n\n`;
    
    if (action === 'sell') {
      if (trends && trends.peak_months.includes(currentMonth)) {
        alert += `🟢 **GOOD TIME TO SELL** - Current month is typically a peak price period\n`;
        alert += `💡 **Recommendation:** Sell now or within the next 2-4 weeks\n`;
      } else if (trends && trends.low_months.includes(currentMonth)) {
        alert += `🔴 **HOLD IF POSSIBLE** - Prices typically lower this month\n`;
        alert += `💡 **Recommendation:** Store properly and wait for peak season\n`;
      } else {
        alert += `🟡 **MODERATE TIMING** - Average price period\n`;
        alert += `💡 **Recommendation:** Consider market conditions and storage costs\n`;
      }
    } else if (action === 'buy') {
      if (trends && trends.low_months.includes(currentMonth)) {
        alert += `🟢 **GOOD TIME TO BUY** - Prices typically lower this month\n`;
        alert += `💡 **Recommendation:** Purchase now for processing or trading\n`;
      } else {
        alert += `🔴 **CONSIDER WAITING** - Not the optimal buying period\n`;
        alert += `💡 **Recommendation:** Wait for harvest season if possible\n`;
      }
    }
    
    alert += `\n📊 **Current Status:** ₵${price.price} ${price.unit} (${price.trend})\n`;
    
    return alert;
  }

  /**
   * Demand forecasting for crop planning
   */
  getDemandForecast(timeframe = 'next-season') {
    const currentMonth = new Date().getMonth() + 1;
    
    let forecast = `**Crop Demand Forecast (${timeframe}):**\n\n`;
    
    // High-demand crops
    const highDemandCrops = Object.entries(this.currentPrices)
      .filter(([_, data]) => data.demand === 'high' || data.demand === 'very-high')
      .sort((a, b) => b[1].price - a[1].price);
    
    forecast += `📈 **High Demand Crops:**\n`;
    highDemandCrops.slice(0, 5).forEach(([crop, data]) => {
      const cropName = crop.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      forecast += `• ${cropName}: ₵${data.price} ${data.unit} (${data.trend})\n`;
    });
    
    forecast += `\n🌟 **Market Opportunities:**\n`;
    
    // Specific recommendations based on season
    if (currentMonth >= 3 && currentMonth <= 7) { // Major rainy season
      forecast += `• **Vegetables**: High demand and prices during rainy season\n`;
      forecast += `• **Rice**: Strong domestic demand, import substitution opportunity\n`;
      forecast += `• **Cassava**: Growing industrial demand for processing\n`;
    } else if (currentMonth >= 9 && currentMonth <= 11) { // Minor rainy season
      forecast += `• **Tomatoes**: Peak prices expected in dry season (Dec-Feb)\n`;
      forecast += `• **Pepper**: Strong demand for local and export markets\n`;
      forecast += `• **Onions**: Import substitution opportunity\n`;
    } else { // Dry season
      forecast += `• **Irrigation farming**: Vegetables command premium prices\n`;
      forecast += `• **Storage crops**: Good time to sell stored grains\n`;
      forecast += `• **Value addition**: Processing adds significant value\n`;
    }
    
    forecast += `\n💡 **Strategic Recommendations:**\n`;
    forecast += `• Focus on crops with rising trends and high demand\n`;
    forecast += `• Consider value addition and processing\n`;
    forecast += `• Plan transportation to major market centers\n`;
    forecast += `• Diversify crops to reduce market risk\n`;
    
    return forecast;
  }

  /**
   * Selling optimization recommendations
   */
  getSellingOptimization(commodity, quantity, region) {
    const price = this.getCurrentPrice(commodity);
    if (!price) return null;

    const marketInfo = this.marketCenters[region] || this.marketCenters['Greater Accra'];
    const regionalPrice = price.price * marketInfo.price_premium;
    const totalValue = regionalPrice * quantity;
    
    let optimization = `**Selling Strategy for ${commodity} in ${region}:**\n\n`;
    
    optimization += `📦 **Quantity:** ${quantity} units\n`;
    optimization += `💰 **Expected Value:** ₵${totalValue.toFixed(2)}\n`;
    optimization += `📍 **Recommended Markets:** ${marketInfo.major_markets.join(', ')}\n\n`;
    
    // Timing recommendations
    const currentMonth = new Date().getMonth() + 1;
    const trends = this.historicalTrends[commodity.toLowerCase().replace(/\s+/g, '-')];
    
    if (trends) {
      if (trends.peak_months.includes(currentMonth)) {
        optimization += `⏰ **Timing:** Excellent - Peak price season\n`;
        optimization += `🎯 **Action:** Sell immediately for best prices\n`;
      } else if (trends.low_months.includes(currentMonth)) {
        optimization += `⏰ **Timing:** Poor - Low price season\n`;
        optimization += `🎯 **Action:** Store if possible, sell only if urgent\n`;
      } else {
        optimization += `⏰ **Timing:** Moderate - Average price period\n`;
        optimization += `🎯 **Action:** Monitor daily prices for opportunities\n`;
      }
    }
    
    optimization += `\n📋 **Optimization Tips:**\n`;
    optimization += `• **Quality grading:** Higher grades command premium prices\n`;
    optimization += `• **Bulk selling:** Negotiate better rates for larger quantities\n`;
    optimization += `• **Market timing:** Sell early morning when demand is high\n`;
    optimization += `• **Transportation:** Plan efficient routes to reduce costs\n`;
    optimization += `• **Documentation:** Keep receipts for tax and record purposes\n`;
    
    // Storage vs immediate sale analysis
    if (price.trend === 'rising') {
      optimization += `\n📈 **Market Trend Analysis:**\n`;
      optimization += `Prices are currently rising. Consider selling gradually over 2-4 weeks to capture price increases.\n`;
    } else if (price.trend === 'volatile') {
      optimization += `\n⚠️ **Volatility Warning:**\n`;
      optimization += `Prices are highly volatile. Sell during peak daily prices and avoid holding too long.\n`;
    }
    
    return optimization;
  }

  /**
   * Generate market intelligence report
   */
  getMarketIntelligenceReport(region, crops = []) {
    let report = `**Market Intelligence Report - ${region}**\n`;
    report += `📅 **Date:** ${new Date().toLocaleDateString()}\n\n`;
    
    // Regional market overview
    const marketInfo = this.marketCenters[region];
    if (marketInfo) {
      report += `🏪 **Market Centers:** ${marketInfo.major_markets.join(', ')}\n`;
      report += `🚚 **Transport Access:** ${marketInfo.transport_access}\n`;
      report += `💹 **Price Level:** ${((marketInfo.price_premium - 1) * 100).toFixed(0)}% ${marketInfo.price_premium > 1 ? 'above' : 'below'} national average\n\n`;
    }
    
    // Top performing commodities
    report += `📊 **Top Market Performers:**\n`;
    const topPerformers = Object.entries(this.currentPrices)
      .filter(([_, data]) => data.trend === 'rising' || data.demand === 'very-high')
      .slice(0, 5);
    
    topPerformers.forEach(([crop, data]) => {
      const cropName = crop.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      report += `• ${cropName}: ₵${data.price} ${data.unit} (${data.trend}, ${data.demand} demand)\n`;
    });
    
    // Specific crop analysis if requested
    if (crops.length > 0) {
      report += `\n🌾 **Your Crops Analysis:**\n`;
      crops.forEach(crop => {
        const price = this.getCurrentPrice(crop);
        if (price) {
          const regionalPrice = marketInfo ? price.price * marketInfo.price_premium : price.price;
          report += `• ${crop}: ₵${regionalPrice.toFixed(2)} ${price.unit} (${price.trend})\n`;
        }
      });
    }
    
    // Market opportunities
    report += `\n🎯 **Current Opportunities:**\n`;
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth >= 3 && currentMonth <= 7) {
      report += `• High demand for vegetables due to rainy season\n`;
      report += `• Rice import substitution opportunities\n`;
      report += `• Cassava processing demand growing\n`;
    } else {
      report += `• Premium prices for fresh vegetables\n`;
      report += `• Storage crop sales at peak prices\n`;
      report += `• Value-added products in high demand\n`;
    }
    
    return report;
  }

  /**
   * Helper functions
   */
  formatTrend(trend) {
    const trendEmojis = {
      'rising': '📈 Rising',
      'falling': '📉 Falling', 
      'stable': '➡️ Stable',
      'volatile': '📊 Volatile',
      'seasonal': '🔄 Seasonal'
    };
    return trendEmojis[trend] || trend;
  }

  formatDemand(demand) {
    const demandEmojis = {
      'very-high': '🔥 Very High',
      'high': '🔴 High',
      'moderate': '🟡 Moderate',
      'low': '🟢 Low',
      'growing': '📈 Growing',
      'export': '🌍 Export Market'
    };
    return demandEmojis[demand] || demand;
  }

  formatMonths(monthNumbers) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNumbers.map(num => monthNames[num - 1]).join(', ');
  }
}

export default new MarketIntelligenceService();