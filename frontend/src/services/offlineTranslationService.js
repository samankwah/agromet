import { ghanaianLanguages, getTranslation } from "../data/ghanaianLanguages";

// Offline translation service with local language data
class OfflineTranslationService {
  constructor() {
    // Common disease detection translations
    this.diseaseTranslations = {
      // Common plant names
      Maize: {
        tw: "Aburo",
        ee: "Bli",
        gaa: "Blɛ",
        dag: "Kawunsiri",
        ha: "Masara",
      },
      Rice: {
        tw: "Ɛmo",
        ee: "Mɔlu",
        gaa: "Mɔɔ",
        dag: "Shinkafa",
        ha: "Shinkafa",
      },
      Cassava: {
        tw: "Bankye",
        ee: "Agbeli",
        gaa: "Duade",
        dag: "Chinchaga",
        ha: "Rogo",
      },
      Tomato: {
        tw: "Tomato",
        ee: "Tomato",
        gaa: "Tomato",
        dag: "Kamantua",
        ha: "Tumatir",
      },

      // Common diseases
      Blight: {
        tw: "Nhwiren yare",
        ee: "Aŋgba dɔ",
        gaa: "Gbeke hewale",
        dag: "Tihi dɔɣim",
        ha: "Cututtukan ganye",
      },
      "Leaf spot": {
        tw: "Nhwiren ho nsensanee",
        ee: "Aŋgba ƒe akpɔkplɔe",
        gaa: "Gbeke tsɔ",
        dag: "Gbanzuŋ dɔɣim",
        ha: "Tabon ganye",
      },
      Rust: {
        tw: "Dadeben yare",
        ee: "Ga dɔ",
        gaa: "Nɔni hewale",
        dag: "Karifi dɔɣim",
        ha: "Tsatsa",
      },
      Wilt: {
        tw: "Nwuw yare",
        ee: "Ku dɔ",
        gaa: "Gbɔ hewale",
        dag: "Ku dɔɣim",
        ha: "Bushewa",
      },
      "Mosaic virus": {
        tw: "Nsensanee yare",
        ee: "Amadede dɔ",
        gaa: "Fɛɛ hewale",
        dag: "Banzara dɔɣim",
        ha: "Cututtukan iri-iri",
      },

      // Common treatments
      "Apply fungicide": {
        tw: "Pete nnwurammoa aduru",
        ee: "Wɔ atike",
        gaa: "Tsɔ yitso",
        dag: "Ti tiim",
        ha: "Shafa maganin naman kwari",
      },
      "Remove infected leaves": {
        tw: "Yi nhwiren a yare aka mu no",
        ee: "Ɖe aŋgba siwo dɔ le la ɖa",
        gaa: "Kɛ gbeke ni hewale mli",
        dag: "Ciri gbanzuŋ din dɔɣi",
        ha: "Cire ganyen da cuta ta kama",
      },
      "Remove infected plants immediately": {
        tw: "Yi afifide a yare aka mu no ntɛm ara",
        ee: "Ɖe ati siwo dɔ le la ɖa enumake",
        gaa: "Kɛ gbeke ni hewale mli lɛ sɛɛ",
        dag: "Ciri tihi din dɔɣi yogu yogu",
        ha: "Cire shuka masu cuta nan take",
      },
      "Use virus-free planting material": {
        tw: "Fa aba a ɛnni vaeras",
        ee: "Zã nuku siwo me dɔléle aɖeke mele o",
        gaa: "Yɛ nkpakpa ni vaeras ko",
        dag: "Tuma bindirigu bɛ ka dɔɣi",
        ha: "Yi amfani da kayan shuka marasa kwayoyin cuta",
      },
      "Control whitefly vectors": {
        tw: "Di nkyene fufuo so",
        ee: "Ɖu aɖiɖi ɣi siwo dzi dɔ vaa",
        gaa: "Dɔ tsɛtsɛ fufuo",
        dag: "Di bibimhi ɣani",
        ha: "Shawo da ƙwayoyin cuta masu launin fari",
      },
      "Practice field sanitation": {
        tw: "Ma wɔ afuo no ho ntew",
        ee: "Wɔ agble la ƒe kɔkɔ nyui",
        gaa: "Yɛ bo tewte",
        dag: "Ma puugu pam",
        ha: "Yi tsaftar filin noma",
      },
      "Improve drainage": {
        tw: "Ma nsu nkɔ yiye",
        ee: "Na tsi nasi nyuie",
        gaa: "Na nu shi kɛ yɛ",
        dag: "Mali kom salima zuɣu",
        ha: "Inganta hanyar ruwa",
      },
      "Use resistant varieties": {
        tw: "Fa nnɔbae a wontumi nnye yare",
        ee: "Zã nuku siwo tea ŋu ɖoa dɔ",
        gaa: "Yɛ nkpakpa ni ahewale ko",
        dag: "Tuma bindirigu bɛ ka dɔɣi",
        ha: "Yi amfani da irin shuka masu juriya",
      },
      "Spray pesticide": {
        tw: "Pete nnwurammoa aduru",
        ee: "Wu atike",
        gaa: "Tsɔ tsɛtsɛ yitso",
        dag: "Ti bibimhi tiim",
        ha: "Fesa maganin kwari",
      },
      
      // Enhanced treatment phrases for better fallback
      "copper fungicide": {
        tw: "kɔpa nnwurammoa aduru",
        ee: "kɔpa atike",
        gaa: "kɔpa yitso",
        dag: "kɔpa tiim",
        ha: "maganin kwari na kɔpa",
      },
      "every 7 days": {
        tw: "nna 7 biara",
        ee: "ŋkeke 7 ɖesiaɖe",
        gaa: "ni 7 kɛɛ",
        dag: "yini 7 kpaŋ",
        ha: "kwana 7 kowane",
      },
      "air circulation": {
        tw: "mframa kɔ mu yiye",
        ee: "ya ƒoƒo nyuie",
        gaa: "mi kɔ yɛ",
        dag: "miim ka di",
        ha: "iskar iska",
      },
      "pruning shears": {
        tw: "ntwitwa adwinnade",
        ee: "adubaɖe",
        gaa: "twafama",
        dag: "gbindi",
        ha: "makakinta",
      },
      
      // Specific demo scenario translations for better coverage
      "Apply biological control with Bt spray": {
        tw: "Fa Bt aduru pete afifide no so",
        ee: "Zã Bt atike wu atiwo dzi",
        gaa: "Tsɔ Bt yitso pete gbeke",
        dag: "Ti Bt tiim pete",
        ha: "Fesa maganin Bt",
      },
      "Use pheromone traps": {
        tw: "Fa pheromone mfiri di dwuma",
        ee: "Zã pheromone mɔ",
        gaa: "Yɛ pheromone mfiri",
        dag: "Tuma pheromone dabila",
        ha: "Yi amfani da tarko pheromone",
      },
      "Apply neem oil in early morning": {
        tw: "Pete neem ngo anɔpa ntɛm",
        ee: "Ku neem ami ŋdi kanya",
        gaa: "Tsɔ neem ngo anɔpa",
        dag: "Ti neem mali dasuba",
        ha: "Shafa mai neem da safe",
      },
      "Apply propiconazole fungicide": {
        tw: "Pete propiconazole nnwurammoa aduru",
        ee: "Wu propiconazole atike",
        gaa: "Tsɔ propiconazole yitso",
        dag: "Ti propiconazole tiim",
        ha: "Shafa maganin naman kwari propiconazole",
      },
      "Use resistant varieties": {
        tw: "Fa nnɔbae a wɔtumi ko yare",
        ee: "Zã nuku siwo tea ŋu ɖoa dɔ",
        gaa: "Yɛ nkpakpa ni ko hewale",
        dag: "Tuma bindirigu bɛ ka dɔɣim",
        ha: "Yi amfani da iri masu juriya",
      },
      "Avoid excessive nitrogen fertilizer": {
        tw: "Kwati nitrogen aduru dodow",
        ee: "Megana nitrogen babla o",
        gaa: "Kofi nitrogen aduru gbɔjɔɔ",
        dag: "Kpɛm nitrogen kurugu yaɣ'mani",
        ha: "Ka kaucewa yawan takin nitrogen",
      },
      "Practice crop rotation": {
        tw: "Sesa nnɔbae a wudua",
        ee: "Trɔ agbledede",
        gaa: "Sesa nkpakpa yiemo",
        dag: "Sɛnsɛ bindirigu duuni",
        ha: "Yi jujjuyar shuka",
      },
      "Avoid wounding roots": {
        tw: "Kwati sɛ wubɛpira nhini no",
        ee: "Mègade ke atikewo o",
        gaa: "Kofi gbɔni nkɛɛ",
        dag: "Kpɛm suk vayila",
        ha: "Ka kaucewa raunata tushen shuka",
      },
      "Remove affected plants": {
        tw: "Yi afifide a ɛka wɔn no",
        ee: "Ɖe ati siwo ƒe nu kɔ ɖe edzi",
        gaa: "Kɛ gbeke ni ekɔ wɔn",
        dag: "Ciri tihi din kɔ wana",
        ha: "Cire shuka da abin ya shafa",
      },
      "biological control": {
        tw: "abɔde so ɔko",
        ee: "dzɔdzɔme ɖoɖo",
        gaa: "abɔde dɔ",
        dag: "dagba dili",
        ha: "sarrafa ta halitta",
      },

      // Health status
      Healthy: {
        tw: "Apɔmuden",
        ee: "Lãme nyui",
        gaa: "Hewalɛ",
        dag: "Alaafee",
        ha: "Lafiya",
      },
      Infected: {
        tw: "Yare aka no",
        ee: "Dɔ le eŋu",
        gaa: "Hewale mli",
        dag: "Dɔɣim n-daa",
        ha: "Cuta ta kama",
      },
      "Severe infection": {
        tw: "Yare no mu yɛ den",
        ee: "Dɔ la nu sẽ ŋutɔ",
        gaa: "Hewale la gbɔjɔɔ",
        dag: "Dɔɣim la pam taɣa",
        ha: "Cuta ta yi muni",
      },
    };

    // Common agricultural phrases
    this.commonPhrases = {
      "Your crop has been infected with": {
        tw: "Yare a aka wo afifide no yɛ",
        ee: "Dɔ si le wò ati ŋu enye",
        gaa: "Hewale ni kɛ bo gbeke lɛ ji",
        dag: "Dɔɣim mali n ti bo tihi maa be la",
        ha: "Cuta ta kama amfanin ku ita",
      },
      "Recommended treatment": {
        tw: "Ayaresa a yɛkamfo kyerɛ",
        ee: "Dɔyɔyɔ si wokafu",
        gaa: "Hewalefamo ni amɛkafuɔ",
        dag: "Tibu bɛ ti puhim di maa",
        ha: "Maganin da ake shawarwari",
      },
      "Apply immediately": {
        tw: "Fa di dwuma ntɛm ara",
        ee: "Wɔe enumake",
        gaa: "Yɛ lɛ sɛɛ",
        dag: "Ti maa yogu yogu",
        ha: "Yi amfani nan take",
      },
      "Consult agricultural expert": {
        tw: "Kɔhunu ɔkuadɔ nimdefo",
        ee: "Bia agbledela nyala",
        gaa: "Kasa nikaseli tsui yɛ",
        dag: "Sɔri purigu naaya",
        ha: "Tuntubi masanin gona",
      },
      
      // Additional common agricultural phrases for offline translation
      "Treatment Recommendations": {
        tw: "Ayaresa a yɛkamfo kyerɛ",
        ee: "Dɔyɔyɔ siwo wokafu",
        gaa: "Hewalefamo ni amɛkafuɔ",
        dag: "Tibu bɛ ti puhim di",
        ha: "Shawarwarin magani",
      },
      "Disease Status": {
        tw: "Yare no tebea",
        ee: "Dɔ ƒe nɔnɔme",
        gaa: "Hewale no taa",
        dag: "Dɔɣim ŋuni",
        ha: "Matsayin cuta",
      },
      "Plant Identified": {
        tw: "Afifide a yɛahu",
        ee: "Ati si wokpɔ",
        gaa: "Gbeke ni amɛhu",
        dag: "Tihi maa nyaŋ",
        ha: "Shuka da aka gano",
      },
    };
  }

  // Translate text offline using local dictionary
  translateOffline(text, sourceLang, targetLang) {
    if (sourceLang === targetLang) return text;

    let translatedText = text;

    // Try exact match first (highest priority)
    if (
      this.diseaseTranslations[text] &&
      this.diseaseTranslations[text][targetLang]
    ) {
      return this.diseaseTranslations[text][targetLang];
    }

    // Try phrase matching for complex phrases (sort by length, longest first)
    const allPhrases = { ...this.diseaseTranslations, ...this.commonPhrases };
    const sortedPhrases = Object.keys(allPhrases).sort((a, b) => b.length - a.length);
    
    for (const phrase of sortedPhrases) {
      const translations = allPhrases[phrase];
      if (translatedText.includes(phrase) && translations[targetLang]) {
        translatedText = translatedText.replace(
          new RegExp(phrase, "gi"), 
          translations[targetLang]
        );
      }
    }

    // Try sentence-based patterns for common agricultural instructions
    const sentencePatterns = {
      // Pattern: "Apply X every Y days"
      "apply (.+) every (\\d+) days": (match, substance, days) => {
        const applyTerm = this.diseaseTranslations["Apply fungicide"]?.[targetLang] || "Pete";
        const daysTerm = this.diseaseTranslations["every 7 days"]?.[targetLang] || `nna ${days} biara`;
        return `${applyTerm.replace("fungicide", substance)} ${daysTerm.replace("7", days)}`;
      },
      // Pattern: "Remove X and improve Y"
      "remove (.+) and improve (.+)": (match, item1, item2) => {
        const removeTerm = this.diseaseTranslations["Remove infected leaves"]?.[targetLang] || "Yi";
        const improveTerm = this.diseaseTranslations["Improve drainage"]?.[targetLang] || "Ma ɛnyɛ yiye";
        return `${removeTerm.replace("infected leaves", item1)} ne ${improveTerm.replace("drainage", item2)}`;
      }
    };

    if (targetLang === "tw") {
      for (const [pattern, replacer] of Object.entries(sentencePatterns)) {
        const regex = new RegExp(pattern, "gi");
        translatedText = translatedText.replace(regex, replacer);
      }
    }

    // Enhanced word-by-word translation
    const words = translatedText.split(/(\s+|[.,!?;:])/); // Keep punctuation and spaces
    const translatedWords = words.map((word) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?;:]/, "");
      
      // Skip if it's whitespace or punctuation
      if (/^\s*$/.test(word) || /^[.,!?;:]+$/.test(word)) {
        return word;
      }

      // Check agricultural terms
      const agTerms = ghanaianLanguages.agriculturalTerms;
      if (agTerms[sourceLang] && agTerms[targetLang]) {
        for (const [key, value] of Object.entries(agTerms[sourceLang])) {
          if (value.toLowerCase() === cleanWord) {
            return word.replace(new RegExp(cleanWord, "gi"), agTerms[targetLang][key] || word);
          }
        }
      }

      // Check disease translations
      if (
        this.diseaseTranslations[cleanWord] &&
        this.diseaseTranslations[cleanWord][targetLang]
      ) {
        return word.replace(new RegExp(cleanWord, "gi"), this.diseaseTranslations[cleanWord][targetLang]);
      }

      return word;
    });

    return translatedWords.join("");
  }

  // Get confidence score for offline translation
  getTranslationConfidence(text, targetLang) {
    let matchedWords = 0;
    let totalWords = text.split(" ").length;

    const words = text.split(" ");
    words.forEach((word) => {
      if (
        this.diseaseTranslations[word] &&
        this.diseaseTranslations[word][targetLang]
      ) {
        matchedWords++;
      }
    });

    return matchedWords / totalWords;
  }

  // Translate disease results offline
  translateDiseaseResultsOffline(results, targetLang) {
    return {
      plant: this.translateOffline(results.plant, "en", targetLang),
      disease: this.translateOffline(results.disease, "en", targetLang),
      remedy: this.translateOffline(results.remedy, "en", targetLang),
      confidence: results.confidence,
      translationType: "offline",
      translationConfidence: this.getTranslationConfidence(
        `${results.plant} ${results.disease} ${results.remedy}`,
        targetLang
      ),
    };
  }

  // Generate audio-friendly text for TTS
  generateAudioText(results, language) {
    const templates = {
      en: `Your ${results.plant} has been diagnosed. ${results.disease} was detected. Recommended treatment: ${results.remedy}`,
      tw: `Wo ${results.plant} no, yɛahu sɛ ${results.disease} aka no. Ayaresa a yɛkamfo kyerɛ ne: ${results.remedy}`,
      ee: `Wò ${results.plant} la, míekpɔ be ${results.disease} le eŋu. Dɔyɔyɔ si míekafu enye: ${results.remedy}`,
      gaa: `Bo ${results.plant} lɛ, amɛhu ni ${results.disease} kɛ lɛ. Hewalefamo ni amɛkafuɔ ji: ${results.remedy}`,
      dag: `A ${results.plant} maa, ti nyaŋ ka ${results.disease} n-daa maa. Tibu bɛ ti puhim di maa: ${results.remedy}`,
      ha: `${results.plant} naku, mun gano ${results.disease} ya kama shi. Maganin da ake shawarwari shi ne: ${results.remedy}`,
    };

    return templates[language] || templates.en;
  }

  // Get language-specific agricultural tips
  getAgriculturalTips(language) {
    const tips = {
      en: [
        "Always inspect your crops regularly for early disease detection",
        "Maintain proper spacing between plants for good air circulation",
        "Use certified seeds and disease-resistant varieties",
        "Practice crop rotation to prevent disease buildup",
        "Remove and destroy infected plant parts immediately",
      ],
      tw: [
        "Hwɛ wo nnɔbae daa na ama woahu yare ntɛm",
        "Ma kwan nna afifide ntam na ama mframa akɔ mu yiye",
        "Fa aba a wɔapene so ne nnɔbae a wontumi nnye yare",
        "Sesa nnɔbae a wudua wɔ asase no so daa",
        "Yi afifide fa a yare aka mu no ntɛm na sɛe no",
      ],
      ee: [
        "Kpɔ wò agblemenukuwo ɣesiaɣi be nàkpɔ dɔléle kaba",
        "Na dometsotso nyui nanɔ atikuwo dome be yame nagbɔ eme nyuie",
        "Zã nuku siwo ŋu wokpɔ kple esiwo tea ŋu ɖoa dɔ",
        "Trɔ nuku siwo nèƒãna le anyigba dzi enuenu",
        "Ɖe atiku ƒe akpa siwo dzi dɔ le la ɖa enumake eye nàtsrɔ̃ wo",
      ],
    };

    return tips[language] || tips.en;
  }
}

export default new OfflineTranslationService();
