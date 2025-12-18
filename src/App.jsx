import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Background from './components/Background';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import MyWardrobe from './pages/MyWardrobe';
import Recommendations from './pages/Recommendations';
import Shop from './pages/Shop';

function App() {
  return (
    <Router>
      <div className="app">
        <Background />
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/wardrobe" element={<MyWardrobe />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;