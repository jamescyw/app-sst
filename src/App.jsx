import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Page0 from './pages/page0/Page0';
import Page1 from './pages/page1/Page1';
import Page2 from './pages/page2/Page2';
import Page3 from './pages/page3/Page3';
import Page4 from './pages/page4/Page4';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Page0 />} />
          <Route element={<MainLayout />}>
            <Route path="/page1" element={<Page1 />} />
            <Route path="/page2" element={<Page2 />} />
            <Route path="/page3" element={<Page3 />} />
            <Route path="/page4" element={<Page4 />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}