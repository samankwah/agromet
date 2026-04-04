/**
 * Problem Diagnosis Service for Agricultural Issues
 * Provides intelligent pest identification, disease management, and nutrient deficiency diagnosis
 */

class ProblemDiagnosisService {
  constructor() {
    // Comprehensive pest database for Ghana
    this.pestDatabase = {
      'fall-armyworm': {
        name: 'Fall Armyworm',
        scientific_name: 'Spodoptera frugiperda',
        crops_affected: ['maize', 'rice', 'sorghum', 'millet'],
        symptoms: [
          'holes in leaves',
          'chewed leaves',
          'larvae in whorl',
          'sawdust-like frass',
          'damaged growing points',
          'window-pane feeding on young leaves'
        ],
        identification: {
          larvae: 'Green to brown caterpillars with distinctive head capsule markings',
          eggs: 'Laid in masses on leaves, covered with grayish scales',
          damage: 'Circular to irregular holes in leaves, whorl damage'
        },
        control_methods: {
          chemical: ['Warrior', 'Super Viper', 'Bypel Attack', 'Ampligo'],
          biological: ['Trichogramma wasps', 'Bt (Bacillus thuringiensis)'],
          cultural: ['Early planting', 'Trap crops', 'Clean cultivation'],
          organic: ['Neem oil', 'Soap solution', 'Wood ash']
        },
        application_timing: 'Early morning or late evening',
        prevention: 'Regular field monitoring, destroy egg masses, rotate crops'
      },
      'stem-borer': {
        name: 'Stem Borer',
        crops_affected: ['rice', 'maize', 'sugarcane'],
        symptoms: [
          'dead hearts in young plants',
          'white heads in mature plants',
          'holes in stems',
          'sawdust around holes',
          'stunted growth',
          'lodging'
        ],
        control_methods: {
          chemical: ['Bulldock', 'Karate', 'Marshal'],
          biological: ['Release natural enemies'],
          cultural: ['Destroy stubble', 'Synchronous planting', 'Resistant varieties']
        },
        prevention: 'Clean cultivation, avoid over-fertilization with nitrogen'
      },
      'aphids': {
        name: 'Aphids',
        crops_affected: ['vegetables', 'legumes', 'cereals'],
        symptoms: [
          'curled leaves',
          'yellowing leaves',
          'sticky honeydew',
          'stunted growth',
          'sooty mold',
          'virus transmission'
        ],
        control_methods: {
          chemical: ['Confidor', 'Actara', 'Decis'],
          biological: ['Ladybird beetles', 'Lacewings'],
          organic: ['Neem oil', 'Soap spray', 'Reflective mulch']
        }
      },
      'whitefly': {
        name: 'Whitefly',
        crops_affected: ['tomatoes', 'pepper', 'cassava', 'beans'],
        symptoms: [
          'yellowing leaves',
          'white flying insects',
          'sticky honeydew',
          'sooty mold',
          'virus transmission',
          'stunted growth'
        ],
        control_methods: {
          chemical: ['Actara', 'Confidor'],
          biological: ['Encarsia wasps'],
          cultural: ['Yellow sticky traps', 'Reflective mulch'],
          organic: ['Neem oil', 'Garlic-soap spray']
        }
      },
      'termites': {
        name: 'Termites',
        crops_affected: ['maize', 'cassava', 'yam', 'groundnuts'],
        symptoms: [
          'wilting plants',
          'damaged roots',
          'dead plants',
          'mud tubes on stems',
          'hollow stems',
          'poor plant establishment'
        ],
        control_methods: {
          chemical: ['Regent', 'Bulldock'],
          cultural: ['Remove plant debris', 'Good drainage'],
          organic: ['Wood ash around plants', 'Neem cake in soil']
        }
      }
    };

    // Disease database
    this.diseaseDatabase = {
      'maize-streak-virus': {
        name: 'Maize Streak Virus',
        crops_affected: ['maize'],
        symptoms: [
          'yellow streaks on leaves',
          'stunted growth',
          'poor ear development',
          'reduced yield',
          'chlorotic streaking parallel to leaf veins'
        ],
        cause: 'Virus transmitted by leafhoppers',
        control_methods: {
          cultural: ['Use resistant varieties', 'Control leafhoppers', 'Remove infected plants'],
          prevention: ['Early planting', 'Avoid late planting', 'Field sanitation']
        }
      },
      'late-blight': {
        name: 'Late Blight',
        crops_affected: ['tomatoes', 'potatoes'],
        symptoms: [
          'dark spots on leaves',
          'white mold under leaves',
          'rotting fruits',
          'foul smell',
          'rapid plant death'
        ],
        cause: 'Fungal infection (Phytophthora infestans)',
        control_methods: {
          chemical: ['Ridomil', 'Dithane M-45', 'Copper fungicides'],
          cultural: ['Proper spacing', 'Good drainage', 'Avoid overhead watering'],
          organic: ['Baking soda spray', 'Milk solution']
        }
      },
      'black-sigatoka': {
        name: 'Black Sigatoka',
        crops_affected: ['plantain', 'banana'],
        symptoms: [
          'yellow streaks on leaves',
          'brown/black spots',
          'premature leaf death',
          'reduced fruit quality',
          'yield loss'
        ],
        control_methods: {
          chemical: ['Systemic fungicides'],
          cultural: ['Remove infected leaves', 'Improve air circulation'],
          organic: ['Neem oil', 'Copper-based fungicides']
        }
      },
      'bacterial-wilt': {
        name: 'Bacterial Wilt',
        crops_affected: ['tomatoes', 'pepper', 'eggplant'],
        symptoms: [
          'sudden wilting',
          'yellowing leaves',
          'brown vascular tissue',
          'plant death',
          'no recovery after watering'
        ],
        cause: 'Bacterial infection (Ralstonia solanacearum)',
        control_methods: {
          cultural: ['Crop rotation', 'Resistant varieties', 'Soil solarization'],
          prevention: ['Avoid wounded roots', 'Clean tools', 'Good drainage']
        }
      },
      'cassava-mosaic-virus': {
        name: 'Cassava Mosaic Virus',
        crops_affected: ['cassava'],
        symptoms: [
          'yellow mosaic on leaves',
          'distorted leaves',
          'stunted growth',
          'reduced tuber yield',
          'chlorotic patterns'
        ],
        control_methods: {
          cultural: ['Use virus-free planting material', 'Control whiteflies', 'Remove infected plants'],
          prevention: ['Select healthy stems', 'Avoid infected fields']
        }
      }
    };

    // Nutrient deficiency database
    this.nutrientDeficiencies = {
      'nitrogen': {
        name: 'Nitrogen Deficiency',
        symptoms: [
          'yellowing of older leaves',
          'stunted growth',
          'pale green coloration',
          'reduced leaf size',
          'early leaf drop',
          'poor protein content'
        ],
        crops_commonly_affected: ['maize', 'rice', 'vegetables'],
        correction: {
          quick_fix: ['Apply urea (46-0-0)', 'Side-dress with ammonium sulfate'],
          organic: ['Compost', 'Poultry manure', 'Legume intercropping'],
          foliar: ['Liquid urea spray (2%)', 'Fish emulsion']
        },
        prevention: 'Regular soil testing, balanced fertilization, organic matter addition'
      },
      'phosphorus': {
        name: 'Phosphorus Deficiency',
        symptoms: [
          'purplish or reddish leaves',
          'delayed maturity',
          'poor root development',
          'reduced flowering',
          'dark green foliage',
          'stunted growth'
        ],
        correction: {
          quick_fix: ['Apply TSP (Triple Super Phosphate)', 'Bone meal'],
          organic: ['Rock phosphate', 'Compost', 'Manure'],
          placement: 'Band application near roots'
        }
      },
      'potassium': {
        name: 'Potassium Deficiency',
        symptoms: [
          'yellowing leaf margins',
          'brown leaf edges',
          'weak stems',
          'increased disease susceptibility',
          'poor fruit quality',
          'wilting despite adequate water'
        ],
        correction: {
          quick_fix: ['Muriate of potash (KCl)', 'Sulfate of potash'],
          organic: ['Wood ash', 'Kelp meal', 'Compost'],
          foliar: ['Potassium sulfate spray']
        }
      },
      'iron': {
        name: 'Iron Deficiency',
        symptoms: [
          'yellowing between leaf veins',
          'green veins remain',
          'affects young leaves first',
          'chlorosis',
          'reduced photosynthesis'
        ],
        common_causes: ['High pH soils', 'Poor drainage', 'Excess lime'],
        correction: {
          chemical: ['Iron chelate', 'Iron sulfate'],
          cultural: ['Improve drainage', 'Lower soil pH', 'Organic matter'],
          foliar: ['Iron sulfate spray (0.5%)']
        }
      },
      'magnesium': {
        name: 'Magnesium Deficiency',
        symptoms: [
          'yellowing between veins',
          'affects older leaves',
          'interveinal chlorosis',
          'reduced photosynthesis',
          'purple or red tints'
        ],
        correction: {
          soil: ['Epsom salt (Magnesium sulfate)', 'Dolomitic lime'],
          foliar: ['Epsom salt spray (2%)', 'Magnesium chloride'],
          organic: ['Compost', 'Kelp meal']
        }
      }
    };

    // Problem diagnosis patterns
    this.diagnosisPatterns = {
      'holes_in_leaves': ['fall-armyworm', 'grasshoppers', 'caterpillars'],
      'yellowing_leaves': ['nitrogen deficiency', 'iron deficiency', 'overwatering', 'disease'],
      'wilting_plants': ['drought stress', 'root rot', 'bacterial wilt', 'nematodes'],
      'spots_on_leaves': ['fungal diseases', 'bacterial diseases', 'nutrient deficiency'],
      'stunted_growth': ['nutrient deficiency', 'root damage', 'pests', 'poor soil'],
      'chewed_leaves': ['caterpillars', 'grasshoppers', 'beetles'],
      'white_substance': ['powdery mildew', 'whiteflies', 'mealybugs'],
      'brown_edges': ['potassium deficiency', 'salt stress', 'heat stress'],
      'purple_leaves': ['phosphorus deficiency', 'cold stress', 'anthocyanin buildup']
    };
  }

  /**
   * Diagnose problem based on symptoms description
   */
  diagnoseProblem(symptoms, crop = null, region = null) {
    const normalizedSymptoms = symptoms.toLowerCase();
    const possibleProblems = [];

    // Check for pest problems
    Object.entries(this.pestDatabase).forEach(([key, pest]) => {
      if (crop && !pest.crops_affected.includes(crop.toLowerCase())) return;
      
      const matchedSymptoms = pest.symptoms.filter(symptom => 
        normalizedSymptoms.includes(symptom.toLowerCase())
      );
      
      if (matchedSymptoms.length > 0) {
        possibleProblems.push({
          type: 'pest',
          problem: pest,
          key: key,
          confidence: (matchedSymptoms.length / pest.symptoms.length) * 100,
          matched_symptoms: matchedSymptoms
        });
      }
    });

    // Check for diseases
    Object.entries(this.diseaseDatabase).forEach(([key, disease]) => {
      if (crop && !disease.crops_affected.includes(crop.toLowerCase())) return;
      
      const matchedSymptoms = disease.symptoms.filter(symptom => 
        normalizedSymptoms.includes(symptom.toLowerCase())
      );
      
      if (matchedSymptoms.length > 0) {
        possibleProblems.push({
          type: 'disease',
          problem: disease,
          key: key,
          confidence: (matchedSymptoms.length / disease.symptoms.length) * 100,
          matched_symptoms: matchedSymptoms
        });
      }
    });

    // Check for nutrient deficiencies
    Object.entries(this.nutrientDeficiencies).forEach(([key, deficiency]) => {
      const matchedSymptoms = deficiency.symptoms.filter(symptom => 
        normalizedSymptoms.includes(symptom.toLowerCase())
      );
      
      if (matchedSymptoms.length > 0) {
        possibleProblems.push({
          type: 'nutrient_deficiency',
          problem: deficiency,
          key: key,
          confidence: (matchedSymptoms.length / deficiency.symptoms.length) * 100,
          matched_symptoms: matchedSymptoms
        });
      }
    });

    // Sort by confidence
    possibleProblems.sort((a, b) => b.confidence - a.confidence);

    return this.formatDiagnosis(possibleProblems, symptoms, crop, region);
  }

  /**
   * Format diagnosis results for user
   */
  formatDiagnosis(problems, originalSymptoms, crop, region) {
    if (problems.length === 0) {
      return `I couldn't identify the specific problem based on the symptoms "${originalSymptoms}". Please provide more detailed symptoms or consult your local agricultural extension officer.`;
    }

    let diagnosis = `**🔍 Problem Diagnosis**\n`;
    if (crop) diagnosis += `**Crop:** ${crop}\n`;
    if (region) diagnosis += `**Region:** ${region}\n`;
    diagnosis += `**Symptoms:** ${originalSymptoms}\n\n`;

    // Primary diagnosis (highest confidence)
    const primary = problems[0];
    diagnosis += `**🎯 Most Likely Problem: ${primary.problem.name}** (${primary.confidence.toFixed(0)}% match)\n\n`;

    if (primary.type === 'pest') {
      diagnosis += this.formatPestDiagnosis(primary.problem, primary.matched_symptoms);
    } else if (primary.type === 'disease') {
      diagnosis += this.formatDiseaseDiagnosis(primary.problem, primary.matched_symptoms);
    } else if (primary.type === 'nutrient_deficiency') {
      diagnosis += this.formatNutrientDiagnosis(primary.problem, primary.matched_symptoms);
    }

    // Alternative diagnoses
    if (problems.length > 1) {
      diagnosis += `\n**🔄 Other Possibilities:**\n`;
      problems.slice(1, 3).forEach(prob => {
        diagnosis += `• ${prob.problem.name} (${prob.confidence.toFixed(0)}% match)\n`;
      });
    }

    // General recommendations
    diagnosis += `\n**📋 General Recommendations:**\n`;
    diagnosis += `• Monitor the problem closely over the next few days\n`;
    diagnosis += `• Take photos for better identification\n`;
    diagnosis += `• Consult local agricultural extension officers\n`;
    diagnosis += `• Apply treatments during cooler parts of the day\n`;
    diagnosis += `• Keep detailed records of symptoms and treatments\n`;

    return diagnosis;
  }

  /**
   * Format pest diagnosis
   */
  formatPestDiagnosis(pest, matchedSymptoms) {
    let result = `**🐛 Pest Information:**\n`;
    if (pest.scientific_name) {
      result += `**Scientific Name:** ${pest.scientific_name}\n`;
    }
    result += `**Crops Affected:** ${pest.crops_affected.join(', ')}\n\n`;

    result += `**✅ Matched Symptoms:**\n`;
    matchedSymptoms.forEach(symptom => {
      result += `• ${symptom}\n`;
    });

    result += `\n**🎯 Control Methods:**\n`;
    
    if (pest.control_methods.chemical) {
      result += `**Chemical Control:**\n`;
      pest.control_methods.chemical.forEach(chemical => {
        result += `• ${chemical}\n`;
      });
    }
    
    if (pest.control_methods.organic) {
      result += `**Organic Control:**\n`;
      pest.control_methods.organic.forEach(organic => {
        result += `• ${organic}\n`;
      });
    }
    
    if (pest.control_methods.cultural) {
      result += `**Cultural Control:**\n`;
      pest.control_methods.cultural.forEach(cultural => {
        result += `• ${cultural}\n`;
      });
    }

    if (pest.application_timing) {
      result += `\n**⏰ Application Timing:** ${pest.application_timing}\n`;
    }

    if (pest.prevention) {
      result += `**🛡️ Prevention:** ${pest.prevention}\n`;
    }

    return result;
  }

  /**
   * Format disease diagnosis
   */
  formatDiseaseDiagnosis(disease, matchedSymptoms) {
    let result = `**🦠 Disease Information:**\n`;
    if (disease.cause) {
      result += `**Cause:** ${disease.cause}\n`;
    }
    result += `**Crops Affected:** ${disease.crops_affected.join(', ')}\n\n`;

    result += `**✅ Matched Symptoms:**\n`;
    matchedSymptoms.forEach(symptom => {
      result += `• ${symptom}\n`;
    });

    result += `\n**💊 Treatment Options:**\n`;
    
    if (disease.control_methods.chemical) {
      result += `**Chemical Treatment:**\n`;
      disease.control_methods.chemical.forEach(chemical => {
        result += `• ${chemical}\n`;
      });
    }
    
    if (disease.control_methods.organic) {
      result += `**Organic Treatment:**\n`;
      disease.control_methods.organic.forEach(organic => {
        result += `• ${organic}\n`;
      });
    }
    
    if (disease.control_methods.cultural) {
      result += `**Cultural Management:**\n`;
      disease.control_methods.cultural.forEach(cultural => {
        result += `• ${cultural}\n`;
      });
    }

    if (disease.control_methods.prevention) {
      result += `**🛡️ Prevention:**\n`;
      disease.control_methods.prevention.forEach(prevention => {
        result += `• ${prevention}\n`;
      });
    }

    return result;
  }

  /**
   * Format nutrient deficiency diagnosis
   */
  formatNutrientDiagnosis(deficiency, matchedSymptoms) {
    let result = `**🌱 Nutrient Deficiency Information:**\n`;
    if (deficiency.crops_commonly_affected) {
      result += `**Commonly Affected Crops:** ${deficiency.crops_commonly_affected.join(', ')}\n`;
    }
    result += `\n**✅ Matched Symptoms:**\n`;
    matchedSymptoms.forEach(symptom => {
      result += `• ${symptom}\n`;
    });

    result += `\n**🔧 Correction Methods:**\n`;
    
    if (deficiency.correction.quick_fix) {
      result += `**Quick Fix:**\n`;
      deficiency.correction.quick_fix.forEach(fix => {
        result += `• ${fix}\n`;
      });
    }
    
    if (deficiency.correction.organic) {
      result += `**Organic Solutions:**\n`;
      deficiency.correction.organic.forEach(organic => {
        result += `• ${organic}\n`;
      });
    }
    
    if (deficiency.correction.foliar) {
      result += `**Foliar Application:**\n`;
      deficiency.correction.foliar.forEach(foliar => {
        result += `• ${foliar}\n`;
      });
    }

    if (deficiency.prevention) {
      result += `\n**🛡️ Prevention:** ${deficiency.prevention}\n`;
    }

    return result;
  }

  /**
   * Get specific pest information
   */
  getPestInfo(pestName) {
    const pest = this.pestDatabase[pestName.toLowerCase().replace(/\s+/g, '-')];
    if (!pest) return null;

    return this.formatPestDiagnosis(pest, pest.symptoms);
  }

  /**
   * Get disease information
   */
  getDiseaseInfo(diseaseName) {
    const disease = this.diseaseDatabase[diseaseName.toLowerCase().replace(/\s+/g, '-')];
    if (!disease) return null;

    return this.formatDiseaseDiagnosis(disease, disease.symptoms);
  }

  /**
   * Get nutrient deficiency information
   */
  getNutrientInfo(nutrientName) {
    const deficiency = this.nutrientDeficiencies[nutrientName.toLowerCase()];
    if (!deficiency) return null;

    return this.formatNutrientDiagnosis(deficiency, deficiency.symptoms);
  }

  /**
   * Quick diagnostic questions
   */
  getQuickDiagnosticQuestions(crop = null) {
    return [
      "What specific symptoms are you observing?",
      "Which part of the plant is affected (leaves, stems, roots, fruits)?",
      "When did you first notice the problem?",
      "Are all plants affected or just some?",
      "What is the weather like recently?",
      "What treatments have you already tried?",
      crop ? `How long ago did you plant your ${crop}?` : "What crop are you growing?",
      "Are there any insects visible on the plants?"
    ];
  }
}

export default new ProblemDiagnosisService();