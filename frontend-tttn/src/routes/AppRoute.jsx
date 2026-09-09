// import React from 'react'
// import { Route, Routes } from 'react-router-dom';
// import { privateRoute, publicRoute } from './routes.jsx';
// import DefaultLayout from '~/components/layouts/defaultLayout/DefaultLayout.jsx';
// // import AdminLayout from '~/components/adminLayouts/AdminLayouts.jsx';
// import PrivateRoute from './PrivateRoute.jsx';

// function AppRouter() {
//     return (
//         //public router
//         <Routes>
//             {publicRoute.map((item, index) => {

//                 const Layout =
//                     item.layout === null
//                         ? React.Fragment
//                         : DefaultLayout;

//                 return (

//                     <Route
//                         key={index}
//                         path={item.path}
//                         element={
//                             <Layout>
//                                 {item.element}
//                             </Layout>
//                         }
//                     />

//                 );
//             })}
//         {/* private router */}
//             {privateRoute.map((item, index) => (
//                 <Route key={index} path={item.path} element={
//                     <PrivateRoute>
//                         <DefaultLayout>
//                             {item.element}
//                         </DefaultLayout>
//                     </PrivateRoute>
//                 }></Route>
//             ))}
//         {/* admin router
//             {adminRouter.map((item, index) => (
//                 <Route key={index} path={item.path} element={
//                     <PrivateRoute>
//                         <AdminLayout>
//                             {item.element}
//                         </AdminLayout>
//                     </PrivateRoute>
//                 }></Route>
//             ))} */}
//         </Routes>
//     )
// }
// export default AppRouter;
import React from "react";
import { Route, Routes } from "react-router-dom";

import { privateRoute, publicRoute } from "./routes.jsx";
import PrivateRoute from "./PrivateRoute.jsx";

import DefaultLayout from "~/components/layouts/defaultLayout/DefaultLayout.jsx";

function AppRouter() {
  return (
    <Routes>
      {publicRoute.map((item) => {
        const Layout = item.layout === null ? React.Fragment : DefaultLayout;

        return (
          <Route
            key={item.path}
            path={item.path}
            element={
              <Layout>
                {item.element}
              </Layout>
            }
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
    </Routes>
  );
}

export default AppRouter;