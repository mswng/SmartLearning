// import React from 'react';
// import Home from '~/page/DashboardPage.jsx';
// import LoginPage from '~/page/auth/LoginPage.jsx';
// import DocumentPage from '~/page/DocumentsPage.jsx';
// import HistoryPage from '~/page/HistoryPage.jsx';
// import SearchPage from '~/page/SearchPage.jsx';
// import ErrorPage from '~/page/NotFoundPage.jsx';
// // import OAuthRedirect from '~/page/auth/OAuthRedirect.jsx';


// const publicRoute = [
//     {path: '/login', element: <LoginPage/>, layout: null},
//     // {path: '/oauth2/redirect', element: <OAuthRedirect/>, layout: null},
//     {path: '/', element: <Home/>},
// ]

// // const adminRouter = [
// //     {path: '/admin', element: <Dashboard/>},
// //     {path: '/admin/users', element: <UserManagement/>},
// //     {path: '/admin/places', element: <PlaceManagement/>},
// // ]

// const privateRoute = [
//     {path: '/history', element: <HistoryPage/>},
//     {path: '/document/:id', element: <DocumentPage/>},
//     {path: '/search', element: <SearchPage/>},
//     {path: '/error', element: <ErrorPage/>},
    
// ]
// // adminRouter
// export {publicRoute, privateRoute};
import Home from "~/page/DashboardPage.jsx";
import LoginPage from "~/page/auth/LoginPage.jsx";
import DocumentPage from "~/page/DocumentsPage.jsx";
import HistoryPage from "~/page/HistoryPage.jsx";
import SearchPage from "~/page/SearchPage.jsx";
import ErrorPage from "~/page/NotFoundPage.jsx";

const publicRoute = [
  {
    path: "/login",
    element: <LoginPage />,
    layout: null,
  },
  {
    path: "/",
    element: <Home />,
  },
];

const privateRoute = [
  {
    path: "/history",
    element: <HistoryPage />,
  },
  {
    path: "/document/:id",
    element: <DocumentPage />,
  },
  {
    path: "/search",
    element: <SearchPage />,
  },
  {
    path: "/error",
    element: <ErrorPage />,
  },
];

export { publicRoute, privateRoute };