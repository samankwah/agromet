import { useState, useEffect } from "react";
import PageTitle from '../components/PageTitle';
import T from '../components/common/T';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  Wind,
  Droplet,
  Thermometer,
  Leaf,
  Map,
  Info,
  AlertTriangle,
  ChevronDown,
  Shield,
} from "lucide-react";

const toneClasses = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  slate: 'bg-slate-50 text-slate-700 border-slate-200',
};

const AgroBulletins = () => {
  const [loading, setLoading] = useState(true);
  const [currentDate] = useState(new Date());
  const [selectedRegion, setSelectedRegion] = useState("Greater Accra");
  const [expandedDay, setExpandedDay] = useState(null);
  const [dekadPeriod, setDekadPeriod] = useState("next");

  // Generate dates for the dekad forecast
  const getDates = (offsetDays = 0) => {
    const dates = [];
    const startDate = new Date(currentDate);

    // Adjust startDate based on dekad period
    if (dekadPeriod === "past") {
      startDate.setDate(startDate.getDate() - 20 + offsetDays);
    } else if (dekadPeriod === "current") {
      startDate.setDate(startDate.getDate() - 10 + offsetDays);
    } else {
      startDate.setDate(startDate.getDate() + offsetDays);
    }

    for (let i = 0; i < 10; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        full: date.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      });
    }
    return dates;
  };

  // Define region options
  const regions = [
    "Greater Accra",
    "Ashanti",
    "Western",
    "Eastern",
    "Central",
    "Northern",
    "Upper East",
    "Upper West",
    "Volta",
    "Bono",
    "Bono East",
    "Ahafo",
    "Western North",
    "Oti",
    "North East",
    "Savannah",
  ];

  // Group regions by zone for better organization
  const regionsByZone = {
    "Coastal Zone": ["Greater Accra", "Central", "Western", "Volta"],
    "Forest Zone": [
      "Eastern",
      "Ashanti",
      "Western North",
      "Bono",
      "Bono East",
      "Ahafo",
      "Oti",
    ],
    "Savannah Zone": [
      "Northern",
      "Upper East",
      "Upper West",
      "North East",
      "Savannah",
    ],
  };

  // Past dekad analysis - generate data for the past 10 days
  const generatePastDekadData = () => {
    // For each region, generate summary statistics
    const regionalData = {};

    regions.forEach((region) => {
      // Generate realistic but varying past data
      const avgMaxTemp = 26 + Math.floor(Math.random() * 6);
      const avgMinTemp = avgMaxTemp - 6 - Math.floor(Math.random() * 3);
      const totalRainfall =
        Math.floor(Math.random() * 50) +
        (region.includes("Western") || region.includes("Central")
          ? 30
          : region.includes("Northern") ||
            region.includes("Upper") ||
            region.includes("Savannah")
          ? 10
          : 20);

      // Different rainfall distribution patterns based on region
      const rainfallDistribution = region.includes("Coastal")
        ? "Moderate, well-distributed"
        : region.includes("Western") || region.includes("Central")
        ? "Heavy, clustered"
        : region.includes("Northern") || region.includes("Upper")
        ? "Light, scattered"
        : "Mixed patterns";

      // Generate regional past trends
      regionalData[region] = {
        avgMaxTemp,
        avgMinTemp,
        totalRainfall,
        rainfallDistribution,
        highestTemp: avgMaxTemp + 2 + Math.floor(Math.random() * 2),
        lowestTemp: avgMinTemp - 2 - Math.floor(Math.random() * 2),
        rainyDays: Math.min(
          10,
          Math.floor(totalRainfall / 10) + Math.floor(Math.random() * 3)
        ),
        avgHumidity:
          60 +
          Math.floor(Math.random() * 20) +
          (region.includes("Western") || region.includes("Central")
            ? 10
            : region.includes("Northern") || region.includes("Upper")
            ? -10
            : 0),
        summary: generatePastDekadSummary(region),
        impactOnCrops: generateCropImpactSummary(region),
      };
    });

    return regionalData;
  };

  // Helper function to generate past dekad summary
  const generatePastDekadSummary = (region) => {
    // Base summaries with regional variations
    const baseSummaries = [
      `The past dekad in ${region} saw [WEATHER_PATTERN] conditions, with temperatures [TEMP_TREND] than expected for this time of year. Rainfall was [RAINFALL_TREND], affecting soil moisture levels significantly.`,
      `${region} experienced [WEATHER_PATTERN] weather during the past dekad, with [RAINFALL_TREND] precipitation patterns. Temperature variations were [TEMP_VARIABILITY].`,
      `The previous 10-day period in ${region} was characterized by [WEATHER_PATTERN] conditions, with [TEMP_TREND] temperatures and [RAINFALL_TREND] rainfall distribution.`,
    ];

    // Regional weather patterns
    let weatherPattern, rainfallTrend, tempTrend, tempVariability;

    if (region.includes("Western") || region.includes("Central")) {
      weatherPattern = [
        "wet and humid",
        "mostly rainy",
        "intermittently stormy",
      ][Math.floor(Math.random() * 3)];
      rainfallTrend = [
        "above average",
        "well distributed",
        "higher than normal",
      ][Math.floor(Math.random() * 3)];
      tempTrend = [
        "slightly lower",
        "consistent with seasonal averages",
        "moderately lower",
      ][Math.floor(Math.random() * 3)];
      tempVariability = [
        "minimal",
        "typical for the season",
        "lower than expected",
      ][Math.floor(Math.random() * 3)];
    } else if (
      region.includes("Northern") ||
      region.includes("Upper") ||
      region.includes("Savannah")
    ) {
      weatherPattern = [
        "predominantly dry",
        "sunny with scattered clouds",
        "clear with occasional precipitation",
      ][Math.floor(Math.random() * 3)];
      rainfallTrend = ["below average", "sporadic", "limited"][
        Math.floor(Math.random() * 3)
      ];
      tempTrend = ["higher", "significantly higher", "above seasonal averages"][
        Math.floor(Math.random() * 3)
      ];
      tempVariability = [
        "significant between day and night",
        "considerable",
        "higher than normal",
      ][Math.floor(Math.random() * 3)];
    } else if (region.includes("Greater Accra") || region.includes("Volta")) {
      weatherPattern = ["partly cloudy", "moderately humid", "mixed"][
        Math.floor(Math.random() * 3)
      ];
      rainfallTrend = [
        "localized",
        "concentrated in coastal areas",
        "variable",
      ][Math.floor(Math.random() * 3)];
      tempTrend = [
        "consistent with averages",
        "typical for the season",
        "as expected",
      ][Math.floor(Math.random() * 3)];
      tempVariability = ["moderate", "typical", "expected for the season"][
        Math.floor(Math.random() * 3)
      ];
    } else {
      weatherPattern = [
        "seasonally typical",
        "mixed",
        "variable across subregions",
      ][Math.floor(Math.random() * 3)];
      rainfallTrend = [
        "fairly distributed",
        "average",
        "consistent with seasonal patterns",
      ][Math.floor(Math.random() * 3)];
      tempTrend = [
        "within expected ranges",
        "normal",
        "consistent with historical averages",
      ][Math.floor(Math.random() * 3)];
      tempVariability = ["moderate", "expected", "normal"][
        Math.floor(Math.random() * 3)
      ];
    }

    // Select a base summary and fill in the placeholders
    let summary =
      baseSummaries[Math.floor(Math.random() * baseSummaries.length)];
    summary = summary
      .replace("[WEATHER_PATTERN]", weatherPattern)
      .replace("[TEMP_TREND]", tempTrend)
      .replace("[RAINFALL_TREND]", rainfallTrend)
      .replace("[TEMP_VARIABILITY]", tempVariability);

    return summary;
  };

  // Helper function to generate crop impact summary
  const generateCropImpactSummary = (region) => {
    // Base impacts with variations
    let impacts = [];

    // Region-specific impacts
    if (region.includes("Western") || region.includes("Central")) {
      impacts.push(
        "Cocoa pod development benefited from consistent moisture levels"
      );
      impacts.push(
        "Oil palm fruit production showed positive response to rainfall"
      );
      if (Math.random() > 0.5)
        impacts.push(
          "Some risk of black pod disease in cocoa due to high humidity"
        );
    } else if (
      region.includes("Northern") ||
      region.includes("Upper") ||
      region.includes("Savannah")
    ) {
      impacts.push("Cereals (maize, sorghum) experienced some moisture stress");
      impacts.push("Legumes showed resilience under drier conditions");
      if (Math.random() > 0.5)
        impacts.push("Irrigation was necessary for vegetable production");
    } else if (region.includes("Ashanti") || region.includes("Eastern")) {
      impacts.push(
        "Mixed crop systems performed well under variable conditions"
      );
      impacts.push("Maize at tasseling stage benefited from rainfall events");
      if (Math.random() > 0.5)
        impacts.push("Cassava and yam showed continued vigorous growth");
    } else if (region.includes("Greater Accra") || region.includes("Volta")) {
      impacts.push(
        "Coastal vegetable production required supplemental irrigation"
      );
      impacts.push("Urban agricultural systems showed varied performance");
      if (Math.random() > 0.5)
        impacts.push("Fruit trees maintained steady development");
    } else {
      impacts.push("Most crops showed normal development patterns");
      impacts.push("Rainfall adequately supported crop water requirements");
    }

    // Add a general impact
    impacts.push(
      "Overall crop health remained stable with some localized variations"
    );

    // Return a formatted list
    return impacts.join(". ") + ".";
  };

  // Mock data for agro-meteorological bulletins
  const agroBulletins = {
    general: {
      title: "General Farming Conditions",
      summary:
        dekadPeriod === "past"
          ? `The past dekad (${getDates()[0].date} - ${
              getDates()[9].date
            }) featured ${
              selectedRegion.includes("Northern") ||
              selectedRegion.includes("Upper")
                ? "predominantly dry"
                : "variable"
            } conditions with ${
              selectedRegion.includes("Western") ||
              selectedRegion.includes("Central")
                ? "above average"
                : "moderate"
            } rainfall.`
          : dekadPeriod === "current"
          ? `The current dekad (${getDates()[0].date} - ${
              getDates()[9].date
            }) is characterized by ${
              selectedRegion.includes("Northern")
                ? "warming temperatures"
                : "seasonal conditions"
            } with ${
              selectedRegion.includes("Western") ? "significant" : "moderate"
            } rainfall events.`
          : `The next dekad will feature initially sunny conditions gradually transitioning to increased rainfall toward the end of the period, beneficial for most crops in their current growth stage.`,
      bulletins: [
        {
          id: 1,
          icon: <Sun className="text-yellow-500" />,
          title: "Temperature Outlook",
          content:
            dekadPeriod === "past"
              ? `Average temperatures were ${
                  selectedRegion.includes("Northern") ||
                  selectedRegion.includes("Upper")
                    ? "2°C above"
                    : "within"
                } normal ranges for the period, with maximums of 28-32°C and minimums of 22-25°C. ${
                  selectedRegion.includes("Coastal")
                    ? "Coastal areas experienced moderating effects from sea breezes."
                    : ""
                }`
              : dekadPeriod === "current"
              ? `Current temperatures are averaging 27-31°C during daytime and 22-25°C at night, with ${
                  selectedRegion.includes("Northern")
                    ? "warming trends"
                    : "stable patterns"
                } observed across most areas.`
              : `Temperatures will average 28-31°C during daytime and 23-25°C at night. These temperatures are optimal for crop growth across most regions, though farmers in Northern regions should monitor for heat stress in young plants during peak afternoon hours.`,
        },
        {
          id: 2,
          icon: <CloudRain className="text-blue-500" />,
          title: "Rainfall Distribution",
          content:
            dekadPeriod === "past"
              ? `Rainfall totals for the past dekad reached ${
                  selectedRegion.includes("Western") ||
                  selectedRegion.includes("Central")
                    ? "45-60mm"
                    : selectedRegion.includes("Northern") ||
                      selectedRegion.includes("Upper")
                    ? "15-25mm"
                    : "30-40mm"
                }, which was ${
                  selectedRegion.includes("Western")
                    ? "15% above"
                    : selectedRegion.includes("Northern")
                    ? "10% below"
                    : "near"
                } the seasonal average.`
              : dekadPeriod === "current"
              ? `Current rainfall patterns show ${
                  selectedRegion.includes("Western")
                    ? "consistent precipitation"
                    : selectedRegion.includes("Northern")
                    ? "scattered light showers"
                    : "moderate rainfall events"
                } with dekad totals projected to reach ${
                  selectedRegion.includes("Western")
                    ? "40-55mm"
                    : selectedRegion.includes("Northern")
                    ? "20-30mm"
                    : "30-45mm"
                }.`
              : `Expected rainfall totals will range from 35-45mm over the 10-day period with moderate intensity. Precipitation will be concentrated in days 6-9 of the forecast period with localized heavy showers possible in the forest zones. This is 15% above the seasonal normal, favorable for most cereal and root crops.`,
        },
        {
          id: 3,
          icon: <Wind className="text-gray-600" />,
          title: "Wind Conditions",
          content:
            dekadPeriod === "past"
              ? `The past dekad experienced ${
                  selectedRegion.includes("Coastal") ? "moderate" : "light"
                } ${
                  selectedRegion.includes("Northern")
                    ? "northeasterly"
                    : "southwesterly"
                } winds averaging ${
                  selectedRegion.includes("Coastal") ? "15-20" : "8-15"
                } km/h with no significant wind events recorded.`
              : dekadPeriod === "current"
              ? `Current wind patterns are predominantly ${
                  selectedRegion.includes("Northern")
                    ? "northeasterly"
                    : "southwesterly"
                } at ${
                  selectedRegion.includes("Coastal") ? "12-18" : "8-14"
                } km/h, with occasional gusts during precipitation events.`
              : `Light to moderate southwesterly winds (10-15 km/h) are expected. No adverse wind events anticipated that would affect crop pollination or cause lodging in cereal crops. Farmers with trellised crops should ensure supports are secure.`,
        },
        {
          id: 4,
          icon: <Droplet className="text-blue-400" />,
          title: "Humidity Levels",
          content:
            dekadPeriod === "past"
              ? `Average humidity levels during the past dekad were ${
                  selectedRegion.includes("Western") ||
                  selectedRegion.includes("Central")
                    ? "80-90%"
                    : selectedRegion.includes("Northern") ||
                      selectedRegion.includes("Upper")
                    ? "50-65%"
                    : "65-75%"
                }, which ${
                  selectedRegion.includes("Western")
                    ? "increased"
                    : selectedRegion.includes("Northern")
                    ? "minimized"
                    : "maintained normal"
                } disease pressure on crops.`
              : dekadPeriod === "current"
              ? `Current humidity readings remain at ${
                  selectedRegion.includes("Western")
                    ? "75-85%"
                    : selectedRegion.includes("Northern")
                    ? "55-65%"
                    : "65-75%"
                }, with daily fluctuations following temperature and rainfall patterns.`
              : `Humidity will remain high (70-85%) throughout the period. These conditions may increase disease pressure, particularly fungal pathogens. Preventative fungicide application is recommended for susceptible crops, especially vegetables and legumes.`,
        },
        {
          id: 5,
          icon: <Sun className="text-orange-500" />,
          title: "Solar Radiation",
          content:
            dekadPeriod === "past"
              ? `Solar radiation during the past dekad averaged ${
                  selectedRegion.includes("Northern")
                    ? "7-9"
                    : selectedRegion.includes("Western")
                    ? "4-6"
                    : "5-7"
                } hours of direct sunlight daily, which was ${
                  selectedRegion.includes("Northern")
                    ? "above"
                    : selectedRegion.includes("Western")
                    ? "below"
                    : "near"
                } normal for the period.`
              : dekadPeriod === "current"
              ? `Daily solar radiation is currently averaging ${
                  selectedRegion.includes("Northern")
                    ? "7-8"
                    : selectedRegion.includes("Western")
                    ? "5-6"
                    : "6-7"
                } hours, providing ${
                  selectedRegion.includes("Western") ? "adequate" : "excellent"
                } conditions for crop photosynthesis.`
              : `Good solar radiation expected in the first 5 days (5-7 hours of direct sunlight daily), decreasing to 3-5 hours during the latter rainy period. Adequate for photosynthesis but consider adjusting irrigation schedules accordingly.`,
        },
      ],
    },
    cropping: {
      title: "Crop-Specific Recommendations",
      summary:
        dekadPeriod === "past"
          ? `Analysis of crop performance during the past dekad (${
              getDates()[0].date
            } - ${getDates()[9].date}) in ${selectedRegion} region.`
          : dekadPeriod === "current"
          ? `Current crop conditions and immediate recommendations for ${selectedRegion} region during this dekad (${
              getDates()[0].date
            } - ${getDates()[9].date}).`
          : `Different crops require specific management strategies based on forecasted conditions. Review recommendations for major crops grown in your region.`,
      bulletins: [
        {
          id: 1,
          icon: <Leaf className="text-green-600" />,
          title: "Cereals (Maize, Rice, Sorghum)",
          content:
            dekadPeriod === "past"
              ? `During the past dekad, cereal crops in ${selectedRegion} ${
                  selectedRegion.includes("Northern")
                    ? "showed signs of moisture stress during early vegetative stages"
                    : selectedRegion.includes("Western")
                    ? "demonstrated vigorous growth under favorable rainfall conditions"
                    : "performed adequately under the prevailing conditions"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Supplemental irrigation was beneficial where available."
                    : selectedRegion.includes("Western")
                    ? "Some lodging was observed in areas with excessive rainfall."
                    : "Growth rates remained consistent with seasonal expectations."
                }`
              : dekadPeriod === "current"
              ? `Cereal crops are currently ${
                  selectedRegion.includes("Northern")
                    ? "showing moderate development with some moisture limitations"
                    : selectedRegion.includes("Western")
                    ? "exhibiting excellent vegetative growth under good moisture conditions"
                    : "progressing normally for this growth stage"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Consider supplemental irrigation where available and monitor for signs of moisture stress."
                    : selectedRegion.includes("Western")
                    ? "Ensure proper drainage in lowland fields to prevent waterlogging damage."
                    : "Maintain standard crop management practices appropriate for current growth stage."
                }`
              : `Current conditions favor rapid vegetative growth for maize and rice. For crops in pre-tasseling stage, consider applying nitrogen fertilizer before the expected rainfall period (days 6-7). Rice farmers should ensure proper water management in lowland fields as increased rainfall may cause waterlogging. Sorghum should be monitored for shoot fly in early plantings.`,
        },
        {
          id: 2,
          icon: <Leaf className="text-green-500" />,
          title: "Root & Tuber Crops (Cassava, Yam)",
          content:
            dekadPeriod === "past"
              ? `Root and tuber crops in ${selectedRegion} ${
                  selectedRegion.includes("Northern")
                    ? "maintained steady growth despite limited rainfall"
                    : selectedRegion.includes("Western")
                    ? "showed excellent development under favorable moisture conditions"
                    : "performed as expected with normal growth patterns"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Deep rooting systems helped access residual soil moisture."
                    : selectedRegion.includes("Western")
                    ? "Some reports of tuber rot in poorly drained fields."
                    : "Tuber development proceeded normally during the period."
                }`
              : dekadPeriod === "current"
              ? `Current conditions for root and tuber crops in ${selectedRegion} are ${
                  selectedRegion.includes("Northern")
                    ? "adequate despite moisture limitations"
                    : selectedRegion.includes("Western")
                    ? "highly favorable with optimal soil moisture"
                    : "generally good with normal development observed"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Mulching is recommended to conserve soil moisture around plants."
                    : selectedRegion.includes("Western")
                    ? "Ensure proper drainage to prevent waterlogging in heavy rainfall areas."
                    : "Maintain regular monitoring for pests and diseases."
                }`
              : `Favorable soil moisture content expected for tuber expansion. Recently planted cassava and yam should be monitored for optimal soil moisture. The upcoming rainfall will benefit root development. Consider mounding additional soil around yam plants before heavy rainfall to prevent tuber exposure and greening.`,
        },
        {
          id: 3,
          icon: <Leaf className="text-green-700" />,
          title: "Vegetables (Tomato, Pepper, Okra)",
          content:
            dekadPeriod === "past"
              ? `Vegetable crops in ${selectedRegion} during the past dekad ${
                  selectedRegion.includes("Northern")
                    ? "required supplemental irrigation to maintain productivity"
                    : selectedRegion.includes("Western")
                    ? "faced increased disease pressure due to high humidity and rainfall"
                    : "showed mixed performance depending on local conditions"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Fruit set was affected by heat stress in some areas."
                    : selectedRegion.includes("Western")
                    ? "Preventative fungicide applications proved beneficial where implemented."
                    : "Overall yields remained within expected ranges."
                }`
              : dekadPeriod === "current"
              ? `Vegetable crops are currently ${
                  selectedRegion.includes("Northern")
                    ? "under moderate stress due to high temperatures and limited rainfall"
                    : selectedRegion.includes("Western")
                    ? "requiring careful disease management under humid conditions"
                    : "performing adequately with typical seasonal challenges"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Shade structures and regular irrigation are critical for maintaining productivity."
                    : selectedRegion.includes("Western")
                    ? "Preventative fungicide applications and improved drainage are recommended."
                    : "Regular pest monitoring and appropriate interventions should be maintained."
                }`
              : `The combination of warm temperatures and increasing humidity may create conditions favorable for fungal diseases. Preventative spraying is recommended. Ensure adequate drainage in vegetable plots before the rainfall period. Consider staking tomatoes to prevent fruit contact with soil during rainy days 6-9.`,
        },
        {
          id: 4,
          icon: <Leaf className="text-yellow-600" />,
          title: "Legumes (Groundnut, Cowpea, Soybean)",
          content:
            dekadPeriod === "past"
              ? `Legume crops in ${selectedRegion} ${
                  selectedRegion.includes("Northern")
                    ? "demonstrated resilience under dry conditions"
                    : selectedRegion.includes("Western")
                    ? "showed mixed performance with some disease issues in wetter areas"
                    : "performed within normal parameters during the period"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Nitrogen fixation may have been limited by moisture stress."
                    : selectedRegion.includes("Western")
                    ? "Some pod rot observed in fields with inadequate drainage."
                    : "Nodulation and nitrogen fixation appeared normal throughout the region."
                }`
              : dekadPeriod === "current"
              ? `Legumes are currently ${
                  selectedRegion.includes("Northern")
                    ? "flowering under moderate stress conditions"
                    : selectedRegion.includes("Western")
                    ? "in pod-filling stage with adequate moisture"
                    : "progressing through normal development stages"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Careful water management is essential for pod development."
                    : selectedRegion.includes("Western")
                    ? "Monitor for fungal diseases under current humidity levels."
                    : "Maintain standard pest monitoring and management practices."
                }`
              : `Flowering and pod formation will benefit from the initial sunny and warm period. For early-planted legumes now setting pods, the upcoming rainfall will support pod filling. Watch for increased pest pressure, particularly pod borers and aphids, as humidity rises toward the end of the period.`,
        },
        {
          id: 5,
          icon: <Leaf className="text-green-800" />,
          title: "Tree Crops (Cocoa, Oil Palm, Mango)",
          content:
            dekadPeriod === "past"
              ? `Tree crops in ${selectedRegion} during the past dekad ${
                  selectedRegion.includes("Western") ||
                  selectedRegion.includes("Central")
                    ? "benefited from adequate rainfall for fruit development"
                    : selectedRegion.includes("Northern")
                    ? "required supplemental irrigation in some areas"
                    : "showed typical seasonal development patterns"
                }. ${
                  selectedRegion.includes("Western")
                    ? "Black pod disease incidence remained within manageable levels in most areas."
                    : selectedRegion.includes("Northern")
                    ? "Fruit set in mango was affected by dry conditions in some locations."
                    : "Flowering and fruit set proceeded normally in most plantation areas."
                }`
              : dekadPeriod === "current"
              ? `Current conditions for tree crops in ${selectedRegion} are ${
                  selectedRegion.includes("Western")
                    ? "favorable with adequate moisture for fruit development"
                    : selectedRegion.includes("Northern")
                    ? "challenging with heat stress affecting some orchards"
                    : "generally suitable for normal development at this stage"
                }. ${
                  selectedRegion.includes("Western")
                    ? "Maintain disease monitoring and preventative applications for black pod in cocoa."
                    : selectedRegion.includes("Northern")
                    ? "Irrigation is recommended for young plantations and orchards."
                    : "Continue regular maintenance and monitoring schedules."
                }`
              : `Current conditions are favorable for fruit development in tree crops. For cocoa, the alternating sunny and rainy periods will support pod development. Black pod disease risk increases with humidity – maintain farm sanitation and regular fungicide application. Oil palm and fruiting mango trees will benefit from the increased soil moisture during the latter part of the forecast period.`,
        },
      ],
    },
    pest: {
      title: "Pest & Disease Alert",
      summary:
        dekadPeriod === "past"
          ? `Analysis of pest and disease pressure observed during the past dekad (${
              getDates()[0].date
            } - ${getDates()[9].date}) in ${selectedRegion} region.`
          : dekadPeriod === "current"
          ? `Current pest and disease status and immediate management recommendations for ${selectedRegion} region.`
          : `Weather conditions influence pest and disease pressure. Forecasted warm and humid conditions may increase risk for certain pathogens.`,
      bulletins: [
        {
          id: 1,
          icon: <AlertTriangle className="text-red-500" />,
          title: "Fall Armyworm Outlook",
          content:
            dekadPeriod === "past"
              ? `Fall armyworm pressure during the past dekad was ${
                  selectedRegion.includes("Northern")
                    ? "moderate to high, with significant infestations in some areas"
                    : selectedRegion.includes("Western")
                    ? "low to moderate, suppressed by heavy rainfall events"
                    : "within normal ranges for the season"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Control measures were necessary in many maize fields."
                    : selectedRegion.includes("Western")
                    ? "Natural enemies helped suppress populations in many areas."
                    : "Farmers implementing monitoring systems reported better management outcomes."
                }`
              : dekadPeriod === "current"
              ? `Current fall armyworm activity in ${selectedRegion} is ${
                  selectedRegion.includes("Northern")
                    ? "high, requiring immediate attention"
                    : selectedRegion.includes("Western")
                    ? "low to moderate, with localized hotspots"
                    : "at moderate levels typical for this time of year"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Regular field scouting and prompt intervention are essential."
                    : selectedRegion.includes("Western")
                    ? "Monitoring should continue despite suppression from recent rainfall."
                    : "Maintain regular scouting and implement controls when thresholds are exceeded."
                }`
              : `Moderate risk levels expected. The dry conditions early in the forecast period followed by rainfall creates favorable conditions for fall armyworm, particularly in maize and sorghum. Scout fields every 3-4 days, focusing on leaf whorls in young plants. Early morning or late afternoon scouting is most effective. Recommended control: Spot application of approved insecticides when 10% of plants show damage.`,
        },
        {
          id: 2,
          icon: <AlertTriangle className="text-orange-500" />,
          title: "Fungal Disease Risk",
          content:
            dekadPeriod === "past"
              ? `Fungal disease incidence during the past dekad was ${
                  selectedRegion.includes("Western")
                    ? "high, particularly for black pod in cocoa and late blight in tomatoes"
                    : selectedRegion.includes("Northern")
                    ? "low due to dry conditions"
                    : "moderate, with typical seasonal patterns observed"
                }. ${
                  selectedRegion.includes("Western")
                    ? "Preventative fungicide applications were highly beneficial."
                    : selectedRegion.includes("Northern")
                    ? "Powdery mildews were more prevalent than water-dependent pathogens."
                    : "Crop-specific patterns followed expected seasonal progression."
                }`
              : dekadPeriod === "current"
              ? `Current fungal disease pressure in ${selectedRegion} is ${
                  selectedRegion.includes("Western")
                    ? "high due to favorable temperature and humidity conditions"
                    : selectedRegion.includes("Northern")
                    ? "low to moderate, primarily affecting irrigated crops"
                    : "moderate with increasing risk as humidity levels rise"
                }. ${
                  selectedRegion.includes("Western")
                    ? "Preventative applications are strongly recommended for susceptible crops."
                    : selectedRegion.includes("Northern")
                    ? "Monitor irrigated crops closely for disease development."
                    : "Standard preventative measures should be maintained or increased."
                }`
              : `High risk period expected days 7-10 when humidity increases following rainfall. Crops at risk include tomatoes (late blight), groundnuts (leaf spot), and cocoa (black pod). Preventative fungicide application recommended before the onset of rainy conditions. Ensure good air circulation in crop canopies through proper spacing and selective pruning where applicable.`,
        },
        {
          id: 3,
          icon: <AlertTriangle className="text-yellow-500" />,
          title: "Aphid & Whitefly Populations",
          content:
            dekadPeriod === "past"
              ? `Sap-sucking insect populations during the past dekad were ${
                  selectedRegion.includes("Northern")
                    ? "high, benefiting from warm, dry conditions"
                    : selectedRegion.includes("Western")
                    ? "moderate, partially suppressed by rainfall"
                    : "within normal seasonal ranges"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Viral disease transmission was a concern in several vegetable growing areas."
                    : selectedRegion.includes("Western")
                    ? "Population buildup occurred during dry intervals between rainfall events."
                    : "Natural enemy populations provided partial control in most areas."
                }`
              : dekadPeriod === "current"
              ? `  Current aphid and whitefly pressure in ${selectedRegion} is ${
                  selectedRegion.includes("Northern")
                    ? "high, requiring active management"
                    : selectedRegion.includes("Western")
                    ? "moderate with population fluctuations following weather patterns"
                    : "at typical levels for this season"
                }. ${
                  selectedRegion.includes("Northern")
                    ? "Monitor closely and intervene when thresholds are exceeded."
                    : selectedRegion.includes("Western")
                    ? "Beneficial insect populations may provide natural control between rainfall events."
                    : "Regular monitoring should continue with intervention when necessary."
                }`
              : `Moderate to high risk during the warm, dry initial period (days 1-5). These pests may rapidly multiply before rainfall begins, affecting vegetables and legumes. They also serve as vectors for viral diseases. Monitor undersides of leaves regularly. Consider approved insecticidal soaps or neem-based products for control if thresholds are exceeded. Beneficial insects may be disrupted by heavy rainfall in the latter forecast period.`,
        },
        {
          id: 4,
          icon: <AlertTriangle className="text-blue-500" />,
          title: "Post-rainfall Soil Pests",
          content:
            dekadPeriod === "past"
              ? `Soil pest activity during the past dekad was ${
                  selectedRegion.includes("Western")
                    ? "elevated following heavy rainfall events"
                    : selectedRegion.includes("Northern")
                    ? "minimal due to dry soil conditions"
                    : "within normal ranges for the season"
                }. ${
                  selectedRegion.includes("Western")
                    ? "Root and tuber crops in poorly drained soils showed increased damage."
                    : selectedRegion.includes("Northern")
                    ? "Limited soil moisture restricted movement and feeding of soil pests."
                    : "Typical seasonal patterns were observed across most growing areas."
                }`
              : dekadPeriod === "current"
              ? `Current soil pest pressure in ${selectedRegion} is ${
                  selectedRegion.includes("Western")
                    ? "moderate to high in areas with adequate soil moisture"
                    : selectedRegion.includes("Northern")
                    ? "low but may increase with irrigation or rainfall"
                    : "at normal seasonal levels"
                }. ${
                  selectedRegion.includes("Western")
                    ? "Ensure adequate drainage in fields with high water tables."
                    : selectedRegion.includes("Northern")
                    ? "Monitor carefully as soil moisture increases."
                    : "Maintain standard monitoring and management practices."
                }`
              : `Increased activity of millipedes, nematodes and some soil-borne pathogens likely after the expected rainfall (days 7-10). Root and tuber crops particularly vulnerable. Ensure adequate drainage in fields. For areas with known nematode problems, consider appropriate management strategies before the wet period begins.`,
        },
        {
          id: 5,
          icon: <AlertTriangle className="text-purple-500" />,
          title: "Granary/Storage Pest Advisory",
          content:
            dekadPeriod === "past"
              ? `Storage pest pressure during the past dekad was ${
                  selectedRegion.includes("Western")
                    ? "high due to elevated humidity levels"
                    : selectedRegion.includes("Northern")
                    ? "moderate despite drier conditions"
                    : "typical for this time of year"
                }. ${
                  selectedRegion.includes("Western")
                    ? "Proper drying before storage was essential to prevent losses."
                    : selectedRegion.includes("Northern")
                    ? "Temperature fluctuations contributed to condensation issues in some storage facilities."
                    : "Standard storage pest management practices were generally effective."
                }`
              : dekadPeriod === "current"
              ? `Current storage pest risk in ${selectedRegion} is ${
                  selectedRegion.includes("Western")
                    ? "high, requiring careful attention to moisture management"
                    : selectedRegion.includes("Northern")
                    ? "moderate, with particular attention needed for newly harvested crops"
                    : "at normal levels with standard precautions recommended"
                }. ${
                  selectedRegion.includes("Western")
                    ? "Ensure thorough drying and use appropriate protectants where necessary."
                    : selectedRegion.includes("Northern")
                    ? "Proper drying is essential before placing crops in storage."
                    : "Maintain regular inspection of stored products and storage facilities."
                }`
              : `The forecasted increase in humidity may affect stored grains and seeds. Ensure proper drying of any harvested produce before storage. Maintain moisture levels below 12% for cereals and regularly inspect stored products. The fluctuating temperature and humidity are conducive for weevil and moth development in stored products.`,
        },
      ],
    },
    regional: {
      title: "Regional Specific Outlook",
      summary: `Weather conditions for ${selectedRegion} region with localized advisories for farmers in this area.`,
      bulletins: getDates().map((dateInfo, index) => {
        // Generate somewhat realistic but varying weather conditions
        const conditions = [
          "Sunny with afternoon clouds",
          "Partly cloudy",
          "Mostly sunny",
          "Light scattered showers",
          "Moderate rainfall",
          "Heavy isolated showers",
          "Clear skies",
          "Morning fog, afternoon sun",
          "Overcast with light rain",
          "Thunderstorms possible",
        ];

        // Weather patterns depend on dekad period and region
        let conditionIndex;

        if (dekadPeriod === "past") {
          // Past dekad - generate what actually happened
          if (
            selectedRegion.includes("Western") ||
            selectedRegion.includes("Central")
          ) {
            // Western regions - more likely rainy in past
            conditionIndex = 3 + Math.floor(Math.random() * 6);
            if (conditionIndex >= conditions.length)
              conditionIndex = conditions.length - 1;
          } else if (
            selectedRegion.includes("Northern") ||
            selectedRegion.includes("Upper") ||
            selectedRegion.includes("Savannah")
          ) {
            // Northern regions - more likely sunny/dry in past
            conditionIndex = Math.floor(Math.random() * 3);
          } else {
            // Other regions - mixed conditions
            conditionIndex = Math.floor(Math.random() * conditions.length);
          }
        } else if (dekadPeriod === "current") {
          // Current dekad - more mixed conditions
          if (index < 5) {
            // First part of current dekad - actual recorded data
            if (selectedRegion.includes("Western")) {
              conditionIndex = 3 + Math.floor(Math.random() * 4);
            } else if (selectedRegion.includes("Northern")) {
              conditionIndex = Math.floor(Math.random() * 3);
            } else {
              conditionIndex = Math.floor(Math.random() * conditions.length);
            }
          } else {
            // Second part of current dekad - short-term forecast
            conditionIndex = Math.floor(Math.random() * conditions.length);
          }
        } else {
          // Future dekad forecast
          if (index < 3) {
            // First 3 days - more likely sunny
            conditionIndex = Math.floor(Math.random() * 4);
          } else if (index < 7) {
            // Middle days - mix of conditions
            conditionIndex = Math.floor(Math.random() * conditions.length);
          } else {
            // Last 3 days - more likely rainy
            conditionIndex = 3 + Math.floor(Math.random() * 7);
            if (conditionIndex >= conditions.length)
              conditionIndex = conditions.length - 1;
          }
        }

        // Generate temperature between 23-32°C, generally warmer in first days
        // Adjust based on region and dekad period
        let baseMaxTemp = 29;
        if (
          selectedRegion.includes("Northern") ||
          selectedRegion.includes("Upper") ||
          selectedRegion.includes("Savannah")
        ) {
          baseMaxTemp += 2;
        } else if (
          selectedRegion.includes("Coastal") ||
          selectedRegion.includes("Greater Accra")
        ) {
          baseMaxTemp -= 1;
        }

        const maxTemp =
          baseMaxTemp - Math.floor(index / 3) + Math.floor(Math.random() * 3);
        const minTemp = maxTemp - 5 - Math.floor(Math.random() * 3);

        // Generate rainfall probability based on region, period, and day
        let rainProb;
        if (
          selectedRegion.includes("Western") ||
          selectedRegion.includes("Central")
        ) {
          // Western regions - higher rainfall probability
          if (index < 3) {
            rainProb = 20 + Math.floor(Math.random() * 30);
          } else if (index < 7) {
            rainProb = 40 + Math.floor(Math.random() * 30);
          } else {
            rainProb = 60 + Math.floor(Math.random() * 30);
          }
        } else if (
          selectedRegion.includes("Northern") ||
          selectedRegion.includes("Upper") ||
          selectedRegion.includes("Savannah")
        ) {
          // Northern regions - lower rainfall probability
          if (index < 3) {
            rainProb = Math.floor(Math.random() * 20);
          } else if (index < 7) {
            rainProb = 10 + Math.floor(Math.random() * 30);
          } else {
            rainProb = 30 + Math.floor(Math.random() * 40);
          }
        } else {
          // Other regions - moderate rainfall probability
          if (index < 3) {
            rainProb = 10 + Math.floor(Math.random() * 30);
          } else if (index < 7) {
            rainProb = 30 + Math.floor(Math.random() * 40);
          } else {
            rainProb = 50 + Math.floor(Math.random() * 40);
          }
        }

        // Generate content with farming advice based on conditions
        let farmingAdvice = "";
        if (
          conditions[conditionIndex].includes("Sunny") ||
          conditions[conditionIndex].includes("Clear")
        ) {
          farmingAdvice =
            "Good conditions for field operations including planting, weeding, and fertilizer application. Consider irrigation for sensitive crops.";
        } else if (
          conditions[conditionIndex].includes("cloudy") ||
          conditions[conditionIndex].includes("Partly")
        ) {
          farmingAdvice =
            "Moderate evapotranspiration expected. Good conditions for most field operations and crop growth.";
        } else if (conditions[conditionIndex].includes("fog")) {
          farmingAdvice =
            "Delay morning spraying operations until fog clears. Humidity-loving crops will benefit from these conditions.";
        } else if (
          conditions[conditionIndex].includes("light rain") ||
          conditions[conditionIndex].includes("scattered")
        ) {
          farmingAdvice =
            "Light rainfall beneficial for crop development. Good opportunity for foliar fertilizer application following rain.";
        } else if (conditions[conditionIndex].includes("Moderate rainfall")) {
          farmingAdvice =
            "Ensure proper field drainage. Delay fertilizer application. Good conditions for transplanting seedlings.";
        } else if (
          conditions[conditionIndex].includes("Heavy") ||
          conditions[conditionIndex].includes("Thunderstorms")
        ) {
          farmingAdvice =
            "Risk of soil erosion and waterlogging. Avoid field operations. Monitor low-lying areas for potential flooding.";
        }

        // Add region-specific advice
        if (
          selectedRegion === "Northern" ||
          selectedRegion === "Upper East" ||
          selectedRegion === "Upper West" ||
          selectedRegion === "Savannah" ||
          selectedRegion === "North East"
        ) {
          if (maxTemp > 30) {
            farmingAdvice +=
              " High temperatures may cause heat stress in crops - consider shade for sensitive seedlings.";
          }
        } else if (
          selectedRegion === "Western" ||
          selectedRegion === "Western North" ||
          selectedRegion === "Central"
        ) {
          if (
            conditions[conditionIndex].includes("rain") ||
            conditions[conditionIndex].includes("showers")
          ) {
            farmingAdvice +=
              " Higher humidity may increase disease pressure in tree crops. Monitor cocoa for black pod disease.";
          }
        } else if (
          selectedRegion === "Greater Accra" ||
          selectedRegion === "Volta"
        ) {
          if (rainProb < 30) {
            farmingAdvice +=
              " Coastal areas may experience higher than predicted temperatures. Ensure adequate irrigation for vegetable crops.";
          }
        }

        // Get appropriate weather icon
        let weatherIcon;
        if (
          conditions[conditionIndex].includes("Sunny") ||
          conditions[conditionIndex].includes("Clear")
        ) {
          weatherIcon = <Sun className="text-yellow-500" />;
        } else if (
          conditions[conditionIndex].includes("cloudy") ||
          conditions[conditionIndex].includes("Partly")
        ) {
          weatherIcon = <Cloud className="text-gray-400" />;
        } else if (conditions[conditionIndex].includes("fog")) {
          weatherIcon = <Cloud className="text-gray-300" />;
        } else if (
          conditions[conditionIndex].includes("light rain") ||
          conditions[conditionIndex].includes("scattered")
        ) {
          weatherIcon = <CloudDrizzle className="text-blue-400" />;
        } else if (conditions[conditionIndex].includes("Moderate rainfall")) {
          weatherIcon = <CloudRain className="text-blue-500" />;
        } else if (
          conditions[conditionIndex].includes("Heavy") ||
          conditions[conditionIndex].includes("Thunderstorms")
        ) {
          weatherIcon = <CloudLightning className="text-purple-600" />;
        } else {
          weatherIcon = <Cloud className="text-gray-400" />;
        }

        // Add a historical comparison data when viewing past data
        const historicalData = {
          maxTemp: maxTemp - 1 + Math.floor(Math.random() * 3),
          minTemp: minTemp - 1 + Math.floor(Math.random() * 3),
          rainProbability: rainProb - 10 + Math.floor(Math.random() * 20),
        };

        return {
          id: index + 1,
          icon: weatherIcon,
          title: `${dateInfo.day}, ${dateInfo.date}`,
          fullDate: dateInfo.full,
          condition: conditions[conditionIndex],
          maxTemp: maxTemp,
          minTemp: minTemp,
          rainProbability: rainProb,
          windSpeed: 5 + Math.floor(Math.random() * 15),
          humidity: 65 + Math.floor(Math.random() * 25),
          content: farmingAdvice,
          historical: historicalData, // For comparison
        };
      }),
    },
  };

  // Generate past dekad analysis data
