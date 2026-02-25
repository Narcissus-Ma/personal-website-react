import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/home-page';
import ManagePage from './pages/manage-page';
import AboutPage from './pages/about-page';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/manage" element={<ManagePage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

export default App;
