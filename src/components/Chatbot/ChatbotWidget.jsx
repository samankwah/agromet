import { useState, useEffect } from 'react';
import { FaComments, FaExpand } from 'react-icons/fa';
import ChatInterface from './ChatInterface';
import PropTypes from 'prop-types';

const ChatbotWidget = ({ userContext = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Show a notification animation when the widget first loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 3000);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleToggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
    setHasNewMessage(false);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimizeChat = () => {
    setIsOpen(false);
    setIsMinimized(true);
    setHasNewMessage(true);
  };

  // Pulse animation for new messages or initial load
  const shouldPulse = hasNewMessage || isAnimating;

  return (
    <>
      {/* Floating Chat Button - Only show when chat is NOT open */}
      {!isOpen && !isMinimized && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleToggleChat}
            className={`relative bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
              shouldPulse ? 'animate-pulse' : ''
            }`}
            title={isMinimized ? 'Expand chat' : 'Chat with AgriBot'}
            aria-label="Open chat"
          >
            {isMinimized ? (
              <FaExpand className="text-xl" />
            ) : (
              <FaComments className="text-xl" />
            )}
            
            {/* New message indicator */}
            {hasNewMessage && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
            
            {/* Ripple effect for animation */}
            {isAnimating && (
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
            )}
          </button>
          
          {/* Tooltip/Welcome Message */}
          {!isMinimized && isAnimating && (
            <div className="absolute bottom-16 right-0 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                  🤖
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    Hi! I&apos;m AgriBot. Need help with farming? Ask me anything!
                  </p>
                </div>
              </div>
              <div className="absolute bottom-0 right-4 transform translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-200"></div>
            </div>
          )}
        </div>
      )}

      {/* Minimized Chat Button - Only show when minimized */}
      {isMinimized && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={handleToggleChat}
            className="relative bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110"
            title="Expand chat"
            aria-label="Expand chat"
          >
            <FaExpand className="text-xl" />
            
            {/* New message indicator */}
            {hasNewMessage && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Chat Interface */}
      <ChatInterface
        isOpen={isOpen}
        onClose={handleCloseChat}
        onMinimize={handleMinimizeChat}
        userContext={userContext}
      />
    </>
  );
};

ChatbotWidget.propTypes = {
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

export default ChatbotWidget;