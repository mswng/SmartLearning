import Header from "~/components/layouts/header/Header.jsx";
import Footer from "~/components/layouts/footer/Footer.jsx";
import Sidebar from "~/components/layouts/sidebar/Sidebar.jsx";

import "./default-layout.scss";

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
