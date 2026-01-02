import { Outlet } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import ChatbotWidget from "../components/Chatbot/ChatbotWidget";
// import OfflineNotification from "../components/common/OfflineNotification";
import { useChatbot } from "../contexts/ChatbotContext";

const Layout = () => {
  const { getEnhancedContext } = useChatbot();
  const chatContext = getEnhancedContext();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Offline notification banner - Disabled for frontend-only development */}
      {/* <OfflineNotification /> */}

      <Header />

      <main className="flex-grow">
        <Outlet />
      </main>

      <Footer />

      {/* AI Chatbot Widget - Fixed floating button */}
      <ChatbotWidget userContext={chatContext} />
    </div>
  );
};

export default Layout;
