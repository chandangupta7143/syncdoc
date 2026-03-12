import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import DocumentEditorPage from './pages/DocumentEditorPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/shared" element={<DashboardPage />} />
        <Route path="/recent" element={<DashboardPage />} />
        <Route path="/settings" element={<DashboardPage />} />
        <Route path="/document/:id" element={<DocumentEditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
