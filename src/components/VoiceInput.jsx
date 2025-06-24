import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const VoiceInput = ({ onTranscript, onCommand, language = "en" }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);

      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Set language based on prop
      const langMap = {
        en: "en-US",
        tw: "en-GH", // Use Ghanaian English for Twi
        ee: "en-GH",
        gaa: "en-GH",
        dag: "en-GH",
        ha: "ha-NG",
        fat: "en-GH",
        nzi: "en-GH",
      };

      recognition.lang = langMap[language] || "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          if (onTranscript) {
            onTranscript(finalTranscript);
          }

          // Check for voice commands
          const commands = {
            "take photo": "camera",
            "take picture": "camera",
            analyze: "analyze",
            "check disease": "analyze",
            share: "share",
            help: "help",
            "change language": "language",
            "read results": "read",
            "speak results": "read",
          };

          const lowerTranscript = finalTranscript.toLowerCase();
          for (const [phrase, command] of Object.entries(commands)) {
            if (lowerTranscript.includes(phrase)) {
              if (onCommand) {
                onCommand(command);
              }
              break;
            }
          }
        }

        if (interimTranscript) {
          setTranscript(interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language, onTranscript, onCommand]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleListening}
        className={`p-3 rounded-full transition-all duration-300 ${
          isListening
            ? "bg-red-500 hover:bg-red-600"
            : "bg-blue-500 hover:bg-blue-600"
        } text-white shadow-lg`}
        aria-label={isListening ? "Stop voice input" : "Start voice input"}
      >
        {isListening ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}
      </motion.button>

      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-3 min-w-[200px]"
          >
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-75"></span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-150"></span>
              </div>
              <span className="text-sm text-gray-600">Listening...</span>
            </div>
            {transcript && (
              <p className="text-sm text-gray-800">{transcript}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInput;
