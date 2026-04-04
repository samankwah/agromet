import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaTimes,
  FaMinusCircle,
  FaTrash,
  FaDownload,
  FaUser,
  FaGlobe,
} from "react-icons/fa";
import PropTypes from "prop-types";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import FarmProfileModal from "./FarmProfileModal";
import chatbotService from "../../services/chatbotService";
import personalizedFarmingService from "../../services/personalizedFarmingService";
import translationService from "../../services/translationService";
import { getSupportedLanguages, getTranslation } from "../../data/ghanaianLanguages";

const ChatInterface = ({ isOpen, onClose, onMinimize, userContext = {} }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [farmProfile, setFarmProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Ghana NLP Integration
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [supportedLanguages] = useState(getSupportedLanguages());
  const [translatedMessages, setTranslatedMessages] = useState(new Map());
  
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Get display text with translation support
  const getDisplayText = useCallback((key, defaultText) => {
    return getTranslation(key, currentLanguage, "chatbot") || defaultText;
  }, [currentLanguage]);

  // Load farm profile and welcome message
  useEffect(() => {
    // Load existing farm profile
    const profileResult = personalizedFarmingService.loadFarmProfile();
    if (profileResult.success) {
      setFarmProfile(profileResult.profile);
    }

    if (messages.length === 0) {
      const welcomeText = profileResult.success
        ? `${getDisplayText("welcomeMessage", "Hello! I'm AgriBot, your agricultural assistant.")} I can help you with farming questions, crop advice, weather information, and more.\n\n${getDisplayText("profileWelcome", "Welcome back!")} ${profileResult.profile.personal.name}! I have your farm profile ready for personalized advice.\n\n${getDisplayText("whatToKnow", "What would you like to know about farming today?")}`
        : `${getDisplayText("welcomeMessage", "Hello! I'm AgriBot, your agricultural assistant.")} I can help you with farming questions, crop advice, weather information, and more.\n\n${getDisplayText("createProfile", "Create a farm profile to get personalized recommendations for your specific location and crops.")}\n\n${getDisplayText("whatToKnow", "What would you like to know about farming today?")}`;
      
      const welcomeMessage = {
        id: Date.now(),
        text: welcomeText,
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, getDisplayText]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle language change and translate existing messages
  useEffect(() => {
    const translateExistingMessages = async () => {
      if (currentLanguage === "en" || messages.length === 0) return;

      try {
        const translations = new Map();
        
        for (const message of messages) {
          if (!message.isUser && message.text) {
            const translatedText = await translationService.translate(
              message.text,
              currentLanguage,
              "en"
            );
            translations.set(message.id, translatedText);
          }
        }
        
        setTranslatedMessages(translations);
      } catch (error) {
        console.error("Failed to translate messages:", error);
      }
    };

    translateExistingMessages();
  }, [currentLanguage, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle language change
  const handleLanguageChange = (langCode) => {
    setCurrentLanguage(langCode);
    setShowLanguageSelector(false);
    translationService.setUserLanguage(langCode);
  };


  const handleSendMessage = async (messageText, imageData = null) => {
    if ((!messageText.trim() && !imageData) || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      isUser: true,
      timestamp: Date.now(),
      imageData: imageData,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Check for FAQ response first
      const faqResponse = await chatbotService.getFAQResponse(messageText);
      if (faqResponse) {
        const botMessage = {
          id: Date.now() + 1,
          text:
            faqResponse +
            "\n\n*This is a quick answer. Feel free to ask for more details!*",
          isUser: false,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsLoading(false);
        return;
      }

      // Validate message
      const validation = chatbotService.validateMessage(messageText);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Manage conversation length
      let currentHistory = conversationHistory;
      if (currentHistory.length > 10) {
        currentHistory = await chatbotService.summarizeConversation(
          currentHistory
        );
        setConversationHistory(currentHistory);
      }

      // Send to Claude via proxy with Phase 3 enhancements
      const enhancedUserContext = {
        ...userContext,
        farmProfile: farmProfile,
        hasProfile: !!farmProfile,
      };

      const response = await chatbotService.sendEnhancedMessage(
        messageText,
        currentHistory,
        enhancedUserContext,
        imageData?.file
      );

      if (response.success) {
        let botMessageText = response.message;
        
        // Translate bot response if not in English
        if (currentLanguage !== "en") {
          try {
            botMessageText = await translationService.translate(
              response.message,
              currentLanguage,
              "en"
            );
          } catch (translationError) {
            console.error("Translation failed:", translationError);
            // Keep original message if translation fails
          }
        }
        
        const botMessage = {
          id: Date.now() + 1,
          text: botMessageText,
          isUser: false,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMessage]);

        // Update conversation history
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", content: messageText },
          { role: "assistant", content: response.message },
        ]);
      } else {
        throw new Error(response.fallbackMessage || response.error);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setError(error.message);

      const errorMessage = {
        id: Date.now() + 1,
        text:
          error.message ||
          "Sorry, I'm having trouble right now. Please try again in a moment.",
        isUser: false,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setConversationHistory([]);
    setError(null);
  };

  const downloadChat = () => {
    const chatContent = messages
      .map(
        (msg) =>
          `[${new Date(msg.timestamp).toLocaleString()}] ${
            msg.isUser ? "You" : "AgriBot"
          }: ${msg.text}`
      )
      .join("\n\n");

    const blob = new Blob([chatContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agribot-chat-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleProfileCreated = (newProfile) => {
    setFarmProfile(newProfile);
    const profileMessage = {
      id: Date.now(),
      text: `🎉 Great! Your farm profile has been created successfully. I can now provide personalized recommendations for your ${newProfile.farm.size.value} ${newProfile.farm.size.unit} farm in ${newProfile.personal.region}. \n\nFeel free to ask me about crop recommendations, seasonal planning, or any farming questions!`,
      isUser: false,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, profileMessage]);
  };

  const openProfileModal = () => {
    setShowProfileModal(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 left-4 right-4 bottom-4 sm:bottom-4 sm:right-4 sm:top-auto sm:left-auto sm:w-96 md:w-[420px] lg:w-[480px] sm:h-[500px] md:h-[600px] lg:h-[700px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b border-gray-200 bg-green-500 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-lg sm:text-xl md:text-2xl">
            🤖
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg md:text-xl">
              AgriBot
            </h3>
            <p className="text-xs sm:text-sm md:text-base opacity-90">
              Your farming assistant
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className="p-1.5 sm:p-2 md:p-3 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              title="Change language"
            >
              <FaGlobe className="text-xs sm:text-sm md:text-base" />
            </button>
            
            {showLanguageSelector && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[120px]">
                {Object.entries(supportedLanguages).map(([code, lang]) => (
                  <button
                    key={code}
                    onClick={() => handleLanguageChange(code)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      currentLanguage === code ? 'bg-green-50 text-green-700' : 'text-gray-700'
                    }`}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={openProfileModal}
            className="p-1.5 sm:p-2 md:p-3 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title={farmProfile ? "View farm profile" : "Create farm profile"}
          >
            <FaUser className="text-xs sm:text-sm md:text-base" />
          </button>
          <button
            onClick={downloadChat}
            className="p-1.5 sm:p-2 md:p-3 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title="Download chat"
          >
            <FaDownload className="text-xs sm:text-sm md:text-base" />
          </button>
          <button
            onClick={clearChat}
            className="p-1.5 sm:p-2 md:p-3 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title="Clear chat"
          >
            <FaTrash className="text-xs sm:text-sm md:text-base" />
          </button>
          <button
            onClick={onMinimize}
            className="p-1.5 sm:p-2 md:p-3 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title="Minimize"
          >
            <FaMinusCircle className="text-xs sm:text-sm md:text-base" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 md:p-3 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            title="Close"
          >
            <FaTimes className="text-xs sm:text-sm md:text-base" />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {(userContext.region || farmProfile) && (
        <div className="px-3 sm:px-4 md:px-6 py-2 md:py-3 bg-blue-50 text-blue-700 text-xs sm:text-sm md:text-base border-b border-gray-100">
          {farmProfile ? (
            <>
              🌱 {farmProfile.personal.name} • {farmProfile.personal.region} •{" "}
              {farmProfile.farm.size.value} {farmProfile.farm.size.unit}
            </>
          ) : (
            <>📍 {userContext.region} region</>
          )}
          {userContext.weather &&
            ` • ${userContext.weather.condition} ${userContext.weather.temperature}°C`}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-3 sm:px-4 md:px-6 py-2 md:py-3 bg-red-50 text-red-700 text-xs sm:text-sm md:text-base border-b border-gray-100">
          ⚠️ {error}
        </div>
      )}

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6"
        style={{ maxHeight: "calc(100% - 180px)" }}
      >
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message.text}
            isUser={message.isUser}
            timestamp={message.timestamp}
            imageData={message.imageData}
            currentLanguage={currentLanguage}
            translatedText={!message.isUser ? translatedMessages.get(message.id) : null}
          />
        ))}

        {isLoading && (
          <MessageBubble message="" isUser={false} isTyping={true} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isLoading}
        placeholder={getDisplayText("chatPlaceholder", "Ask about crops, weather, diseases, or upload a photo...")}
        currentLanguage={currentLanguage}
      />

      {/* Farm Profile Modal */}
      <FarmProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileCreated={handleProfileCreated}
      />
    </div>
  );
};

ChatInterface.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onMinimize: PropTypes.func.isRequired,
  userContext: PropTypes.shape({
    region: PropTypes.string,
    weather: PropTypes.shape({
      condition: PropTypes.string,
      temperature: PropTypes.number,
      humidity: PropTypes.number,
    }),
    season: PropTypes.string,
    crops: PropTypes.arrayOf(PropTypes.string),
  }),
};

export default ChatInterface;
