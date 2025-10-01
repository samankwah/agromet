import { useState, useRef, useCallback, useEffect } from "react";
import PageTitle from './PageTitle';
import {
  Camera,
  Upload,
  Leaf,
  AlertTriangle,
  CheckCircle,
  Loader,
  X,
  Bell,
  RefreshCw,
  FileImage,
  Globe,
  Volume2,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import axios from "axios";
import axiosRetry from "axios-retry";
import translationService from "../services/translationService";
import diseaseDetectionService from "../services/diseaseDetectionService";
import {
  getTranslation,
  getSupportedLanguages,
} from "../data/ghanaianLanguages";

axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
});

const PlantDiseaseDetector = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [userName, setUserName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);

  // Ghana NLP Integration States
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supportedLanguages] = useState(getSupportedLanguages());
  const [translatedResult, setTranslatedResult] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);

  const cache = useRef(new Map());

  const convertToBase64 = useCallback(async (file) => {
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(compressedFile);
        fileReader.onload = () => {
          const base64String = fileReader.result.split(",")[1];
          resolve(base64String);
        };
        fileReader.onerror = (error) => reject(error);
      });
    } catch (error) {
      setError(
        getDisplayText("compressError", "Failed to compress image") +
          ": " +
          error.message
      );
      return null;
    }
  }, []);

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        if (file.size > 10 * 1024 * 1024) {
          setError(
            getDisplayText("fileSizeError", "File size must be less than 10MB")
          );
          return;
        }
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
        setResult(null);
        setError("");
      } else {
        setError(
          getDisplayText(
            "invalidFileError",
            "Please select a valid image file (PNG, JPG, JPEG)"
          )
        );
      }
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        if (file.size > 10 * 1024 * 1024) {
          setError(
            getDisplayText("fileSizeError", "File size must be less than 10MB")
          );
          return;
        }
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
        setResult(null);
        setError("");
      } else {
        setError(
          getDisplayText(
            "invalidFileError",
            "Please select a valid image file (PNG, JPG, JPEG)"
          )
        );
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } else {
        setError(
          getDisplayText(
            "cameraError",
            "Camera access is not supported in this browser"
          )
        );
      }
    } catch (error) {
      setError(
        getDisplayText("cameraAccessError", "Failed to access camera") +
          ": " +
          error.message
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const captureCameraImage = useCallback(() => {
    if (videoRef.current && cameraStream) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        const file = new File([blob], "camera-capture.jpg", {
          type: "image/jpeg",
        });
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
        setResult(null);
        setError("");
        stopCamera();
      }, "image/jpeg");
    }
  }, [cameraStream, stopCamera]);

  // Detect disease with enhanced API handling
  const detectDisease = async () => {
    if (!selectedImage) {
      setError(
        getDisplayText("selectImageError", "Please select an image first")
      );
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setError("");

    try {
      const base64String = await convertToBase64(selectedImage);
      if (!base64String) return;

      // Check cache
      const cacheKey = base64String.substring(0, 100);
      if (cache.current.has(cacheKey)) {
        setResult(cache.current.get(cacheKey));
        setIsLoading(false);
        return;
      }

      // Use the robust disease detection service
      const resultData = await diseaseDetectionService.detectDisease(
        base64String,
        setUploadProgress
      );

      if (resultData) {
        setResult(resultData);
        cache.current.set(cacheKey, resultData);

        console.log("🔬 Disease detection result:", resultData);
        console.log("🌐 Current language:", currentLanguage);

        // Automatically translate if not English
        if (currentLanguage !== "en") {
          console.log("🔄 Starting translation for language:", currentLanguage);
          await translateResults(resultData);
        }
      } else {
        throw new Error(
          getDisplayText(
            "invalidResponseError",
            "Invalid response format from server"
          )
        );
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError(
          getDisplayText(
            "timeoutError",
            "Request timed out. Please check your internet connection"
          )
        );
      } else if (err.response) {
        const status = err.response.status;
        if (status === 413) {
          setError(
            getDisplayText(
              "imageTooLargeError",
              "Image file is too large. Please try a smaller image"
            )
          );
        } else if (status === 429) {
          setError(
            getDisplayText(
              "tooManyRequestsError",
              "Too many requests. Please wait and try again"
            )
          );
        } else if (status === 500) {
          setError(
            getDisplayText(
              "serverError",
              "Server error. Please try again later"
            )
          );
        } else {
          setError(`Detection failed: ${err.message}`);
        }
      } else if (!navigator.onLine) {
        setError(
          getDisplayText(
            "noInternetError",
            "No internet connection. Please try again when online"
          )
        );
      } else {
        setError(`Detection failed: ${err.message}`);
      }
      console.error("Detection error:", err);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  // Send notification with offline queuing
  const sendNotification = async () => {
    if (!userName.trim()) {
      setError(getDisplayText("enterNameError", "Please enter your name"));
      return;
    }

    const notificationData = {
      plant: result.plant,
      disease: result.disease,
      user: userName,
    };

    if (!navigator.onLine) {
      // Queue notification in local storage
      const queuedNotifications = JSON.parse(
        localStorage.getItem("queuedNotifications") || "[]"
      );
      queuedNotifications.push(notificationData);
      localStorage.setItem(
        "queuedNotifications",
        JSON.stringify(queuedNotifications)
      );
      alert(
        getDisplayText(
          "offlineQueued",
          "Offline: Notification queued and will be sent when online"
        )
      );
      setShowNotificationForm(false);
      setUserName("");
      return;
    }

    try {
      const response = await axios.post(
        "https://susya.onrender.com/notify",
        notificationData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        alert(
          getDisplayText(
            "notificationSent",
            "✅ Notification sent successfully!"
          )
        );
        setShowNotificationForm(false);
        setUserName("");
      }
    } catch (err) {
      setError(`Failed to send notification: ${err.message}`);
    }
  };

  // Reset application
  const resetApp = useCallback(() => {
    setSelectedImage(null);
    setImagePreview("");
    setResult(null);
    setError("");
    setShowNotificationForm(false);
    setUserName("");
    setUploadProgress(0);
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, [stopCamera]);

  // Handle camera capture with live preview
  const handleCameraCapture = useCallback(async () => {
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    } else {
      await startCamera();
    }
  }, [startCamera]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Load user's preferred language
  useEffect(() => {
    const savedLanguage = translationService.getUserLanguage();
    setCurrentLanguage(savedLanguage);
  }, []);

  // Translate results when language changes
  useEffect(() => {
    if (result && currentLanguage !== "en") {
      translateResults();
    } else {
      setTranslatedResult(null);
    }
  }, [result, currentLanguage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ghana NLP Integration Functions
  const translateResults = async (resultData = result) => {
    if (!resultData || currentLanguage === "en") {
      console.log("⏭️ Skipping translation - no data or English language");
      setTranslatedResult(null);
      return;
    }

    console.log("🔄 Starting translation:", {
      resultData,
      currentLanguage,
      plant: resultData.plant,
      disease: resultData.disease,
      remedy: resultData.remedy,
    });

    try {
      setUploadProgress(50); // Show progress during translation
      const translated = await translationService.translateDiseaseResults(
        resultData,
        currentLanguage
      );
      console.log("✅ Translation completed:", translated);
      setTranslatedResult(translated);
      setUploadProgress(100);

      // Hide progress after a delay
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error("❌ Translation error:", error);

      // Enhanced fallback: try using offline translations from our language data
      try {
        console.log("🔄 Attempting offline fallback translation...");
        const fallbackTranslated = {
          ...resultData,
          plant: resultData.plant, // Keep original for now
          disease: resultData.disease, // Keep original for now
          remedy: resultData.remedy, // Keep original for now
          translationType: "offline-fallback",
          originalLanguage: "en",
          translatedLanguage: currentLanguage,
        };

        // Try to get basic agricultural terms
        const plantTerm = getTranslation(
          "plant",
          currentLanguage,
          "agriculturalTerms"
        );
        const diseaseTerm = getTranslation(
          "disease",
          currentLanguage,
          "agriculturalTerms"
        );
        // Enhanced translation attempt with term substitution
        if (plantTerm && plantTerm !== "plant") {
          fallbackTranslated.plant = resultData.plant.replace(
            /Plant/gi,
            plantTerm
          );
        }
        if (diseaseTerm && diseaseTerm !== "disease") {
          fallbackTranslated.disease = resultData.disease.replace(
            /disease/gi,
            diseaseTerm
          );
        }
        
        // Enhanced remedy translation with comprehensive term mapping
        let translatedRemedy = resultData.remedy;

        // Comprehensive agricultural term mapping for Twi
        const termMap = {
          // Treatment actions
          "Apply": "Fa",
          "Remove": "Yi fi",
          "Spray": "Pete",
          "Use": "Fa",
          "Keep": "Fa sie",
          "Make sure": "Hwɛ hu sɛ",
          "Improve": "Ma ɛnyɛ yiye",
          "Avoid": "Kwati",
          "Add": "Ka ho",
          "Disinfect": "Tew ho",
          "Prevent": "Siw",
          
          // Time/frequency
          "daily": "da biara",
          "every day": "da biara",
          "days": "nna",
          "week": "dapɛn",
          "weeks": "nnaawɔtwe",
          "7 days": "nna 7",
          "twice": "mprɛnu",
          "once": "prɛko",
          
          // Plant parts
          "leaves": "nhaban",
          "stems": "dua",
          "roots": "nhini",
          "branches": "mman",
          "flowers": "nhwiren",
          "fruits": "nnuaba",
          "infected leaves": "nhaban a yare aka mu",
          "affected areas": "mmeae a yare aka mu",
          "plant debris": "afifide a asɛe",
          
          // Treatment materials
          "fungicide": "nnwurammoa aduru",
          "pesticide": "nnwurammoa aduru",
          "copper": "kɔpa",
          "water": "nsu",
          "soil": "asase",
          "compost": "wura",
          "organic": "abɔde",
          
          // Actions/methods
          "watering": "nsu gu",
          "irrigation": "nsu gu",
          "drainage": "nsu nkɔ",
          "spacing": "kwan nna",
          "clean": "tew",
          "dry": "wosɛe",
          "wet": "fɔ",
          
          // Conditions
          "overhead": "atifi",
          "under": "ase",
          "around": "ho ahyia",
          "between": "ntam",
          "from": "fi",
          "to": "kɔ",
          "with": "ne",
          "without": "a ɛnni",
          
          // Common phrases
          "air circulation": "mframa kɔ mu yiye",
          "garden debris": "turo mu nneɛma",
          "pruning shears": "ntwitwa adwinnade",
          "best control": "ɔkwan pa ara",
          "long period": "bere tenten",
          "weather forecasts": "wiem ho asɛm",
          "wet weather": "osutɔ bere",
          "Alternatively": "Anaa nso",
          "for best": "sɛ ɛbɛyɛ yiye a",
          "repeat every": "yɛ bio da biara",
          "as needed": "sɛ ɛho hia a"
        };

        // Apply translations for Twi language
        if (currentLanguage === "tw") {
          Object.entries(termMap).forEach(([english, twi]) => {
            // Use word boundaries to avoid partial matches
            const regex = new RegExp(`\\b${english}\\b`, "gi");
            translatedRemedy = translatedRemedy.replace(regex, twi);
          });
          
          // Handle specific sentence patterns
          translatedRemedy = translatedRemedy
            .replace(/Twitwa or stake plants/gi, "Twitwa anaa si afifide mu")
            .replace(/reduce fungal problems/gi, "te nnwurammoa haw so")
            .replace(/disinfect your pruning shears/gi, "tew wo ntwitwa adwinnade")
            .replace(/one part bleach to 4 parts water/gi, "fitaa aduru baako ne nsu anan")
            .replace(/after each cut/gi, "twa biara akyi")
            .replace(/Keep the soil.*clean and free of garden debris/gi, "Ma asase no ntew na yi turo mu nneɛma nyinaa fi mu")
            .replace(/Add a layer of organic compost/gi, "Ka abɔde wura ho")
            .replace(/prevent the spores from splashing back up/gi, "siw sɛ nnwurammoa no nnhuruw nsane nkɔ soro")
            .replace(/onto vegetation/gi, "nkɔ afifide so")
            .replace(/Drip irrigation.*keep the foliage dry/gi, "Nsu a ɛsen te se nnyinansa ma nhaban no ntew")
            .replace(/soaker hoses can be used/gi, "wɔtumi de nsu nhoma a ɛhonu di dwuma")
            .replace(/For best control.*copper-based fungicides/gi, "Sɛ ɛbɛyɛ yiye a, fa kɔpa aduru a ɛko tia nnwurammoa")
            .replace(/early.*two weeks before/gi, "ntɛm, dapɛn mmienu ansa na")
            .replace(/normally appears/gi, "taa da adi")
            .replace(/when weather forecasts predict/gi, "sɛ wiem ho asɛm ka sɛ")
            .replace(/long period of wet weather/gi, "osutɔ bere tenten")
            .replace(/begin.*when.*first appears/gi, "fi ase sɛ yare no di kan ba a")
            .replace(/repeat every 7-10 days/gi, "yɛ bio nna 7-10 biara")
            .replace(/for as long as needed/gi, "kɔso ara kɔsi sɛ yare no bɛba aba");
        }

        fallbackTranslated.remedy = translatedRemedy;

        console.log(
          "🔄 Using offline fallback translation:",
          fallbackTranslated
        );
        setTranslatedResult(fallbackTranslated);
      } catch (fallbackError) {
        console.error("❌ Even fallback translation failed:", fallbackError);
        setTranslatedResult({
          ...resultData,
          translationType: "failed",
          originalLanguage: "en",
          translatedLanguage: currentLanguage,
        });
      }
    }
  };

  const handleLanguageChange = async (langCode) => {
    console.log("🌐 Language changed to:", langCode);
    setCurrentLanguage(langCode);
    translationService.setUserLanguage(langCode);
    setShowLanguageSelector(false);

    // Re-translate existing results if available
    if (result && langCode !== "en") {
      console.log(
        "🔄 Re-translating existing results for new language:",
        langCode
      );
      await translateResults(result);
    } else if (langCode === "en") {
      console.log("🇬🇧 Switched to English - clearing translations");
      setTranslatedResult(null);
    }
  };


  const speakResults = async () => {
    if (!result && !translatedResult) return;

    const resultToSpeak = translatedResult || result;
    const textToSpeak = `
      ${getTranslation("diseaseDetected", currentLanguage)}: ${
      resultToSpeak.disease
    }.
      ${getTranslation("recommendedAction", currentLanguage)}: ${
      resultToSpeak.remedy
    }
    `;

    await speakText(textToSpeak);
  };

  const speakText = async (text) => {
    try {
      setIsSpeaking(true);
      // Use Ghana NLP TTS service
      const ttsResult = await translationService.textToSpeech(
        text,
        currentLanguage
      );
      
      if (ttsResult) {
        if (ttsResult.type === "api" && ttsResult.url) {
          const audio = new Audio(ttsResult.url);
          audio.onended = () => setIsSpeaking(false);
          audio.onerror = () => setIsSpeaking(false);
          await audio.play();
        } else if (ttsResult.type === "browser" && ttsResult.speak) {
          ttsResult.speak();
          setTimeout(() => setIsSpeaking(false), 3000);
        }
      }
    } catch (error) {
      console.error("Text-to-speech error:", error);
      setIsSpeaking(false);
    }
  };

  const getDisplayText = (key, fallback = key) => {
    return getTranslation(key, currentLanguage) || fallback;
  };

  // Handle keyboard accessibility
  const handleKeyDown = (e, action) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  return (
    <>
      <PageTitle title="Crop Disease Diagnosis Tool" />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 sm:p-8 relative">
      {/* Language and Voice Controls - Fixed Responsive Positioning */}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 md:flex-row mt-20">
        {/* Language Selector */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLanguageSelector(!showLanguageSelector)}
            className="bg-white/95 backdrop-blur-sm border border-green-200 rounded-full w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-2 flex items-center justify-center md:gap-2 shadow-lg hover:border-green-400 transition-all duration-300"
          >
            {/* Mobile: Icon only */}
            <Globe className="w-6 h-6 text-green-600 md:w-4 md:h-4" />
            {/* Desktop: Icon + Text */}
            <span className="hidden lg:inline text-green-700 font-medium text-sm">
              {supportedLanguages[currentLanguage]?.name || "English"}
            </span>
          </motion.button>

          <AnimatePresence>
            {showLanguageSelector && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-green-200 overflow-hidden z-[70] w-64"
              >
                <div className="max-h-64 overflow-y-auto">
                  {Object.entries(supportedLanguages).map(([code, lang]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={`w-full px-4 py-3 text-left hover:bg-green-50 transition-colors duration-200 flex items-center gap-3 ${
                        currentLanguage === code
                          ? "bg-green-100 text-green-800"
                          : "text-gray-700"
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <div className="min-w-0">
                        <div className="font-medium text-base truncate">
                          {lang.name}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {lang.region}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


        {/* Text-to-Speech Button */}
        {(result || translatedResult) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={speakResults}
            disabled={isSpeaking}
            className={`bg-white/95 backdrop-blur-sm border border-purple-200 rounded-full w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-2 flex items-center justify-center md:gap-2 shadow-lg hover:border-purple-400 transition-all duration-300 text-purple-600 ${
              isSpeaking ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Volume2
              className={`w-6 h-6 md:w-4 md:h-4 ${
                isSpeaking ? "animate-pulse" : ""
              }`}
            />
            <span className="hidden lg:inline font-medium text-sm">
              {isSpeaking
                ? getDisplayText("speaking", "Speaking...")
                : getDisplayText("readResults", "Read Results")}
            </span>
          </motion.button>
        )}

        {/* Help Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowHelpModal(true)}
          className="bg-white/95 backdrop-blur-sm border border-blue-200 rounded-full w-12 h-12 md:w-auto md:h-auto md:px-4 md:py-2 flex items-center justify-center md:gap-2 shadow-lg hover:border-blue-400 transition-all duration-300 text-blue-600"
        >
          <HelpCircle className="w-6 h-6 md:w-4 md:h-4" />
          <span className="hidden lg:inline font-medium text-sm">
            {getDisplayText("helpNeeded", "Help")}
          </span>
        </motion.button>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 mt-20">
            {getDisplayText("welcome", "Health Check")}
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            {getDisplayText(
              "uploadImage",
              "AI-powered plant disease detection for healthier crops"
            )}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              <span>{getDisplayText("accuracy", "99.2% Accuracy")}</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              <span>{getDisplayText("instantResults", "Instant Results")}</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              <span>
                {getDisplayText(
                  "expertRecommendations",
                  "Expert Recommendations"
                )}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-xl mr-4">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {getDisplayText("uploadPlantImage", "Upload Plant Image")}
            </h2>

            {!imagePreview && !cameraStream ? (
              <div className="space-y-6">
                <motion.div
                  className={`border-3 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer group ${
                    dragOver
                      ? "border-green-400 bg-green-50/50 scale-105"
                      : "border-green-300"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Drag and drop or click to upload an image"
                  onKeyDown={(e) =>
                    handleKeyDown(e, () => fileInputRef.current?.click())
                  }
                >
                  <Upload className="w-12 h-12 text-green-500 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {dragOver
                      ? getDisplayText("dropImageHere", "Drop your image here!")
                      : getDisplayText(
                          "dragDropImage",
                          "Drag & drop your plant image"
                        )}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {getDisplayText(
                      "browseFiles",
                      "or click to browse your files"
                    )}
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                    <FileImage className="w-4 h-4" />
                    <span>
                      {getDisplayText(
                        "maxFileSize",
                        "PNG, JPG, JPEG • Max 10MB"
                      )}
                    </span>
                  </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCameraCapture}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center"
                    aria-label="Capture image with camera"
                    onKeyDown={(e) => handleKeyDown(e, handleCameraCapture)}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">
                      {getDisplayText("takePhoto", "Take Photo")}
                    </span>
                    <span className="sm:hidden">
                      {getDisplayText("takePhoto", "Camera")}
                    </span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center"
                    aria-label="Choose file from device"
                    onKeyDown={(e) =>
                      handleKeyDown(e, () => fileInputRef.current?.click())
                    }
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {getDisplayText("chooseFile", "Choose File")}
                  </motion.button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-hidden="true"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-hidden="true"
                />
              </div>
            ) : cameraStream ? (
              <div className="space-y-6">
                <motion.video
                  ref={videoRef}
                  autoPlay
                  className="w-full h-64 rounded-xl border-2 border-white shadow-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={captureCameraImage}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center"
                    aria-label="Capture camera image"
                    onKeyDown={(e) => handleKeyDown(e, captureCameraImage)}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {getDisplayText("capture", "Capture")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopCamera}
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center"
                    aria-label="Cancel camera"
                    onKeyDown={(e) => handleKeyDown(e, stopCamera)}
                  >
                    <X className="w-5 h-5 mr-2" />
                    {getDisplayText("cancel", "Cancel")}
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative group"
                >
                  <img
                    src={imagePreview}
                    alt="Selected plant"
                    className="w-full h-64 sm:h-80 object-cover rounded-3xl border-4 border-white shadow-2xl group-hover:scale-105 transition-transform duration-300"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={resetApp}
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-300 shadow-lg"
                    aria-label="Clear selected image"
                    onKeyDown={(e) => handleKeyDown(e, resetApp)}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </motion.div>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full bg-gray-200 rounded-full h-2.5"
                  >
                    <div
                      className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={detectDisease}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center"
                    aria-label="Analyze plant image"
                    onKeyDown={(e) => handleKeyDown(e, detectDisease)}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        {getDisplayText("analyzing", "Analyzing...")}
                      </>
                    ) : (
                      <>
                        <Leaf className="w-5 h-5 mr-2" />
                        {getDisplayText("analyzeImage", "Analyze Plant")}
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center"
                    aria-label="Change image"
                    onKeyDown={(e) =>
                      handleKeyDown(e, () => fileInputRef.current?.click())
                    }
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    {getDisplayText("changeImage", "Change")}
                  </motion.button>
                </div>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-4 flex items-center shadow-lg"
              >
                <div className="bg-red-500 p-2 rounded-full mr-4">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-800 mb-1">
                    {getDisplayText("detectionError", "Detection Error")}
                  </h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8 flex items-center">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-3 rounded-xl mr-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              {getDisplayText("resultsReady", "Analysis Results")}
            </h2>

            {!result ? (
              <div className="text-center py-12 sm:py-16">
                <motion.div
                  className="relative mb-8"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Leaf className="w-20 h-20 text-gray-300 mx-auto" />
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-500 mb-3">
                  {getDisplayText("readyForAnalysis", "Ready for Analysis")}
                </h3>
                <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
                  {getDisplayText(
                    "uploadDescription",
                    "Upload a plant image to get instant AI-powered disease detection and treatment recommendations"
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-green-500 p-2 rounded-lg mr-3">
                        <Leaf className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-green-800 text-lg">
                        {getDisplayText("plant", "Plant Identified")}
                      </h3>
                    </div>
                    <p className="text-green-700 text-lg sm:text-xl font-semibold">
                      {translatedResult?.plant || result.plant}
                    </p>
                    {translatedResult && (
                      <p className="text-green-600 text-sm mt-1 italic">
                        {getDisplayText("originalText", "Original")}:{" "}
                        {result.plant}
                      </p>
                    )}
                    {result.confidence && (
                      <p className="text-green-600 text-sm mt-2">
                        {getDisplayText("confidence", "Confidence")}:{" "}
                        {(result.confidence * 100).toFixed(2)}%
                      </p>
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200 shadow-lg"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-red-500 p-2 rounded-lg mr-3">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-bold text-red-800 text-lg">
                        {getDisplayText("diseaseDetected", "Disease Status")}
                      </h3>
                    </div>
                    <p className="text-red-700 text-lg sm:text-xl font-semibold">
                      {translatedResult?.disease || result.disease}
                    </p>
                    {translatedResult && (
                      <p className="text-red-600 text-sm mt-1 italic">
                        {getDisplayText("originalText", "Original")}:{" "}
                        {result.disease}
                      </p>
                    )}
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-1 sm:p-2 border-2 border-blue-200 shadow-lg"
                >
                  <div className="flex items-center mb-6">
                    <div className="bg-blue-500 p-3 rounded-xl mr-4">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-blue-800 text-lg sm:text-xl">
                      {getDisplayText(
                        "recommendedAction",
                        "Treatment Recommendations"
                      )}
                    </h3>
                  </div>
                  <div className="bg-white/60 rounded-xl p-1 border border-blue-200">
                    <p className="text-blue-800 leading-relaxed text-justify sm:text-lg font-medium">
                      {translatedResult?.remedy || result.remedy}
                    </p>
                    {translatedResult && (
                      <details className="mt-3">
                        <summary className="text-blue-600 text-sm cursor-pointer hover:text-blue-800">
                          {getDisplayText("showOriginal", "Show original text")}
                        </summary>
                        <p className="text-blue-700 text-sm mt-2 italic border-t border-blue-200 pt-2">
                          {result.remedy}
                        </p>
                      </details>
                    )}
                  </div>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotificationForm(true)}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 px-6 rounded-2xl font-bold text-lg flex items-center justify-center"
                  aria-label="Alert nearby farmers"
                  onKeyDown={(e) =>
                    handleKeyDown(e, () => setShowNotificationForm(true))
                  }
                >
                  <div className="bg-white/20 p-2 rounded-lg mr-4">
                    <Bell className="w-6 h-6" />
                  </div>
                  {getDisplayText("notifyFarmers", "Alert Nearby Farmers")}
                  <div className="ml-4 bg-white/20 px-3 py-1 rounded-full text-sm">
                    {getDisplayText("communityAlert", "Community Alert")}
                  </div>
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Notification Modal */}
        <AnimatePresence>
          {showNotificationForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl border-4 border-orange-200"
              >
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 rounded-full inline-block mb-4">
                    <Bell className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                    {getDisplayText(
                      "communityAlert",
                      "Community Disease Alert"
                    )}
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {getDisplayText(
                      "shareWithCommunity",
                      "Help protect your farming community by sharing this disease detection"
                    )}
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label
                      className="block text-sm font-bold text-gray-700 mb-3"
                      htmlFor="user-name"
                    >
                      {getDisplayText("yourName", "Your Name")}
                    </label>
                    <input
                      id="user-name"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all duration-300 text-base sm:text-lg"
                      placeholder={getDisplayText(
                        "enterName",
                        "Enter your name"
                      )}
                      aria-required="true"
                    />
                  </div>

                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-3">
                      {getDisplayText("alertDetails", "Alert Details")}
                    </h4>
                    <div className="space-y-2 text-gray-600 text-sm sm:text-base">
                      <p>
                        <span className="font-semibold">
                          {getDisplayText("plantLabel", "Plant")}:
                        </span>{" "}
                        {result?.plant}
                      </p>
                      <p>
                        <span className="font-semibold">
                          {getDisplayText("diseaseLabel", "Disease")}:
                        </span>{" "}
                        {result?.disease}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowNotificationForm(false)}
                      className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-xl font-semibold"
                      aria-label="Cancel notification"
                      onKeyDown={(e) =>
                        handleKeyDown(e, () => setShowNotificationForm(false))
                      }
                    >
                      {getDisplayText("cancel", "Cancel")}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendNotification}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center"
                      aria-label="Send notification"
                      onKeyDown={(e) => handleKeyDown(e, sendNotification)}
                    >
                      <Bell className="w-5 h-5 mr-2" />
                      {getDisplayText("sendAlert", "Send Alert")}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Help Modal - Clean & Professional */}
        <AnimatePresence>
          {showHelpModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[80] pt-20 md:pt-4"
              onClick={() => setShowHelpModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] shadow-xl border overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b bg-white">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    {getDisplayText("howItWorks", "How It Works")}
                  </h2>
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 min-h-0">
                  <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                    {/* Steps */}
                    <div className="space-y-4">
                      {[
                        { icon: "📱", key: "step1", desc: "step1Description" },
                        { icon: "🔍", key: "step2", desc: "step2Description" },
                        { icon: "💡", key: "step3", desc: "step3Description" },
                        { icon: "🌾", key: "step4", desc: "step4Description" },
                      ].map((step, index) => (
                        <div key={step.key} className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg">
                            {step.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 mb-1">
                              {getDisplayText(step.key, `Step ${index + 1}`)}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {getDisplayText(step.desc, "Description")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Separator */}
                    <div className="border-t pt-6">
                      <h3 className="font-medium text-gray-900 mb-4">
                        {getDisplayText("tipsTitle", "Tips for Better Results")}
                      </h3>

                      {/* Tips Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { key: "tip1", text: "Use good lighting" },
                          { key: "tip2", text: "Focus on affected areas" },
                          { key: "tip3", text: "Individual leaves" },
                          { key: "tip4", text: "Keep camera steady" },
                        ].map((tip) => (
                          <div
                            key={tip.key}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{getDisplayText(tip.key, tip.text)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t bg-gray-50 flex-shrink-0">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
                  >
                    {getDisplayText("readyForAnalysis", "Got it")}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clean Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-12 sm:mt-16 py-8 border-t border-green-200"
        >
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-500">
            <span>
              {getDisplayText(
                "protectingCrops",
                "🌱 Protecting crops nationwide"
              )}
            </span>
            <span>{getDisplayText("aiInsights", "🤖 AI-driven insights")}</span>
            <span>
              {getDisplayText("sustainableFarming", "🌍 Sustainable farming")}
            </span>
          </div>
        </motion.div>
      </div>
      </div>
    </>
  );
};

export default PlantDiseaseDetector;
