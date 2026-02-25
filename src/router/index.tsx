import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/home-page';
import ManagePage from '../pages/manage-page';
import AboutPage from '../pages/about-page';

export const router = createBrowserRouter(
  [
    { path: '/', element: <HomePage /> },
    { path: '/manage', element: <ManagePage /> },
    { path: '/about', element: <AboutPage /> },
  ],
  {
    basename: '/',
  }
);
