import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow">{children}</main>

      <Footer />
    </div>
  );
};

export default Layout;
