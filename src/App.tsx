import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/home-page';
import ManagePage from './pages/manage-page';
import AboutPage from './pages/about-page';

function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<ManagePage />} path="/manage" />
      <Route element={<AboutPage />} path="/about" />
    </Routes>
  );
}

export default App;
