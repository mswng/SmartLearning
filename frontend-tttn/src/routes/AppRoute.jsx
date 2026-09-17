import React from "react";
import { Route, Routes } from "react-router-dom";

import { privateRoute, publicRoute } from "./routes.jsx";
import PrivateRoute from "./PrivateRoute.jsx";

import DefaultLayout from "~/components/layouts/defaultLayout/DefaultLayout.jsx";
import NotFoundPage from "~/page/NotFoundPage.jsx";

function AppRouter() {
  return (
    <Routes>
      {publicRoute.map((item) => {
        const Layout = item.layout === null ? React.Fragment : DefaultLayout;

        return (
          <Route
            key={item.path}
            path={item.path}
            element={<Layout>{item.element}</Layout>}
          />
        );
      })}

      {privateRoute.map((item) => (
        <Route
          key={item.path}
          path={item.path}
          element={
            <PrivateRoute>
              <DefaultLayout>{item.element}</DefaultLayout>
            </PrivateRoute>
          }
        />
      ))}

      {/* Không khớp route nào -> 404, không cần đăng nhập để xem */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRouter;
