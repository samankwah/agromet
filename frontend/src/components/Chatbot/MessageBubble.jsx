import { useState } from 'react';
import { FaUser, FaRobot, FaCopy, FaCheck, FaVolumeUp, FaStop } from 'react-icons/fa';
import PropTypes from 'prop-types';
import useTranslation from '../../hooks/useTranslation';

const MessageBubble = ({
  message,
  isUser,
  timestamp,
  isTyping = false,
  imageData = null,
  translatedText = null
}) => {
  const [copied, setCopied] = useState(false);
  const { speak, isSpeaking, stopSpeaking, getDisplayText } = useTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText || message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    speak(translatedText || message);
  };

  const formatMessage = (text) => {
    // Convert markdown-style formatting to HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-white/70 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br />');
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isTyping) {
    return (
      <div className="flex items-start space-x-3 mb-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <FaRobot className="text-white text-sm" />
          </div>
        </div>
        <div className="flex-1">
          <div className="neo-inset px-4 py-3 max-w-xs">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-neo-muted rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-neo-muted rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-neo-muted rounded-full animate-pulse delay-150"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-2 sm:space-x-3 mb-3 sm:mb-4 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className="flex-shrink-0">
        <div className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
          isUser ? 'bg-neo-teal' : 'bg-neo-accent'
        }`}>
          {isUser ? (
            <FaUser className="text-white text-xs sm:text-sm md:text-base" />
          ) : (
            <FaRobot className="text-white text-xs sm:text-sm md:text-base" />
          )}
        </div>
      </div>
      
      <div className="flex-1 max-w-[80%] sm:max-w-[75%] md:max-w-[80%]">
        <div
          className={`rounded-neo px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-4 ${
            isUser
              ? 'bg-neo-teal text-white ml-auto shadow-neo-soft'
              : 'neo-inset text-neo-text'
          }`}
        >
          {/* Image Display */}
          {imageData && (
            <div className="mb-3">
              <img 
                src={URL.createObjectURL(imageData.file)} 
                alt={getDisplayText('uploadedCropImage', 'Uploaded crop image')} 
                className="max-w-full h-auto rounded-neo border border-neo-border"
                style={{ maxHeight: '200px' }}
              />
              {imageData.processing && (
                <div className="text-xs mt-2 opacity-75">
                  📊 Compressed from {(imageData.processing.originalSize / 1024 / 1024).toFixed(1)}MB to {(imageData.processing.compressedSize / 1024 / 1024).toFixed(1)}MB
                </div>
              )}
            </div>
          )}
          
          <div
            data-no-auto-translate="true"
            className="text-xs sm:text-sm md:text-base leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: formatMessage(translatedText || message)
            }}
          />
          
          {!isUser && (
            <div className="flex items-center space-x-1 mt-1 sm:mt-2">
              <button
                onClick={handleSpeak}
                className="p-1 sm:p-2 text-neo-muted hover:text-neo-accent-strong transition-colors rounded-full"
                title={
                  isSpeaking
                    ? getDisplayText('stopSpeaking', 'Stop speaking')
                    : getDisplayText('listenToMessage', 'Listen to message')
                }
              >
                {isSpeaking ? (
                  <FaStop className="text-red-500 text-xs sm:text-sm md:text-base" />
                ) : (
                  <FaVolumeUp className="text-xs sm:text-sm md:text-base" />
                )}
              </button>
              <button
                onClick={handleCopy}
                className="p-1 sm:p-2 text-neo-muted hover:text-neo-accent-strong transition-colors rounded-full"
                title={getDisplayText('copyMessage', 'Copy message')}
              >
                {copied ? (
                  <FaCheck className="text-green-500 text-xs sm:text-sm md:text-base" />
                ) : (
                  <FaCopy className="text-xs sm:text-sm md:text-base" />
                )}
              </button>
            </div>
          )}
        </div>
        
        {timestamp && (
          <div
            data-no-auto-translate="true"
            className={`text-xs sm:text-sm text-neo-muted mt-1 ${isUser ? 'text-right' : 'text-left'}`}
          >
            {formatTimestamp(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

MessageBubble.propTypes = {
  message: PropTypes.string.isRequired,
  isUser: PropTypes.bool.isRequired,
  timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isTyping: PropTypes.bool,
  imageData: PropTypes.shape({
    file: PropTypes.object,
    analysis: PropTypes.object,
    processing: PropTypes.object
  }),
  currentLanguage: PropTypes.string,
  translatedText: PropTypes.string,
};

export default MessageBubble;
