import { Suspense, lazy, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
// import OfflineNotification from "../components/common/OfflineNotification";
import { useChatbot } from "../contexts/ChatbotContext";

const ChatbotWidget = lazy(() => import("../components/Chatbot/ChatbotWidget"));

const Layout = () => {
  const { getEnhancedContext } = useChatbot();
  const chatContext = getEnhancedContext();
  const [shouldMountChatbot, setShouldMountChatbot] = useState(false);

  useEffect(() => {
    const scheduleMount = () => setShouldMountChatbot(true);

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(scheduleMount, { timeout: 2000 });

      return () => window.cancelIdleCallback(idleId);
    }

    const timerId = window.setTimeout(scheduleMount, 1200);
    return () => window.clearTimeout(timerId);
  }, []);

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
      {shouldMountChatbot && (
        <Suspense fallback={null}>
          <ChatbotWidget userContext={chatContext} />
        </Suspense>
      )}
    </div>
  );
};

export default Layout;
