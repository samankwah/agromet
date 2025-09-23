import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ChatbotWidget from "../components/Chatbot/ChatbotWidget";
import { ChatbotProvider, useChatbot } from "../contexts/ChatbotContext";
import OfflineNotification from "../components/common/OfflineNotification";
import { Toaster } from "react-hot-toast";

const RootLayoutContent = () => {
  const { getEnhancedContext } = useChatbot();
  const chatContext = getEnhancedContext();

  return (
    <div>
      <OfflineNotification />
      <Header />
      <Outlet />
      <Footer />
      <ChatbotWidget userContext={chatContext} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#22c55e',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
    </div>
  );
};

const RootLayout = () => {
  return (
    <ChatbotProvider>
      <RootLayoutContent />
    </ChatbotProvider>
  );
};

export default RootLayout;
