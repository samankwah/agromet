import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ChatbotWidget from "../components/Chatbot/ChatbotWidget";
import { ChatbotProvider, useChatbot } from "../contexts/ChatbotContext";
import OfflineNotification from "../components/common/OfflineNotification";

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
