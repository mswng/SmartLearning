import Header from "~/components/adminLayouts/header/Header.jsx";
import Footer from "~/components/adminLayouts/footer/Footer.jsx";
import Sidebar from "~/components/adminLayouts/sidebar/Sidebar.jsx";

import "./defaultAdminLayout.scss";

function DefaultLayout({ children }) {
  return (
    <div className="default-layout">
      <Header />

      <div className="default-layout__body">
        <Sidebar />

        <main className="default-layout__content">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default DefaultLayout;
