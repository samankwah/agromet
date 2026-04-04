import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaMicrophone, FaStop, FaCamera, FaTimes } from 'react-icons/fa';
import PropTypes from 'prop-types';
import visualIntegrationService from '../../services/visualIntegrationService';
import voiceLanguageService from '../../services/voiceLanguageService';

const ChatInput = ({ onSendMessage, disabled = false, placeholder = "Ask me anything about farming...", currentLanguage = "en" }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((message.trim() || selectedImage) && !disabled) {
      let messageToSend = message.trim();
      let imageData = null;

      // Handle image upload with analysis
      if (selectedImage) {
        setIsProcessingImage(true);
        try {
          const imageAnalysis = await visualIntegrationService.processChatbotImageQuery(
            messageToSend || "Analyze this crop image",
            selectedImage,
            {}
          );

          if (imageAnalysis.success) {
            messageToSend = imageAnalysis.response;
            imageData = {
              file: selectedImage,
              analysis: imageAnalysis.detailedAnalysis,
              processing: imageAnalysis.imageProcessing
            };
          } else {
            messageToSend = `Image analysis failed: ${imageAnalysis.error}. Please try uploading a clearer image.`;
          }
        } catch (error) {
          messageToSend = `Error processing image: ${error.message}`;
        }
        setIsProcessingImage(false);
      }

      onSendMessage(messageToSend, imageData);
      setMessage('');
      clearImage();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      
      // Map language codes to browser-supported language codes
      const languageMap = {
        'en': 'en-US',
        'tw': 'en-GH', // Use Ghana English for Twi
        'gaa': 'en-GH', // Use Ghana English for Ga
        'ee': 'en-GH', // Use Ghana English for Ewe
        'dag': 'en-GH' // Use Ghana English for Dagbani
      };
      
      const browserLang = languageMap[currentLanguage] || 'en-US';
      
      const recognition = await voiceLanguageService.startVoiceRecognition(browserLang, {
        continuous: false,
        interimResults: true,
        onInterimResult: (transcript) => {
          setMessage(transcript);
        },
        onStart: () => {
          console.log(`Voice recognition started for ${currentLanguage}`);
        }
      });

      recognition.then((result) => {
        if (result.success) {
          setMessage(result.transcript);
        }
        setIsRecording(false);
      }).catch((error) => {
        console.error('Voice recognition error:', error);
        setIsRecording(false);
      });

      // Store recognition control for stopping
      mediaRecorderRef.current = recognition;
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (typeof mediaRecorderRef.current.stop === 'function') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  const handleVoiceClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };


  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Image Preview */}
      {imagePreview && (
        <div className="p-3 border-b border-gray-100">
          <div className="relative inline-block">
            <img 
              src={imagePreview} 
              alt="Selected crop image" 
              className="max-w-24 max-h-24 rounded-lg border border-gray-300"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              title="Remove image"
            >
              <FaTimes />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            📸 Image ready for analysis. Add a message or click send to analyze.
          </p>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedImage ? "Describe what you see or ask about this image..." : placeholder}
              disabled={disabled || isProcessingImage}
              className="w-full resize-none border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              rows={1}
              maxLength={1000}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {message.length}/1000
            </div>
          </div>
          
          {/* Camera/Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={handleCameraClick}
            disabled={disabled || isProcessingImage}
            className="p-2 sm:p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white"
            title="Upload crop image for analysis"
          >
            <FaCamera className="text-sm" />
          </button>
          
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={handleVoiceClick}
            disabled={disabled || isProcessingImage}
            className={`p-2 sm:p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
            title={isRecording ? 'Stop recording' : 'Start voice input'}
          >
            {isRecording ? <FaStop className="text-sm" /> : <FaMicrophone className="text-sm" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || isProcessingImage || (!message.trim() && !selectedImage)}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 sm:p-3 rounded-lg transition-colors"
            title={isProcessingImage ? 'Processing image...' : 'Send message'}
          >
            {isProcessingImage ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <FaPaperPlane className="text-sm" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

ChatInput.propTypes = {
  onSendMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  currentLanguage: PropTypes.string,
};

export default ChatInput;