import { Routes, Route } from "react-router-dom";
import { Navbar, Footer } from "./components/Layout";
import Home from "./pages/Home";
import MapPage from "./pages/MapPage";
import LocationDetails from "./pages/LocationDetails";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";
import AIChatWidget from "./components/AIChatWidget";
import { MapActionProvider } from "./contexts/MapActionContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { DistanceProvider } from "./contexts/DistanceContext";

export default function App() {
  return (
    <DistanceProvider>
      <FavoritesProvider>
        <MapActionProvider>
          <div className="site-root">
            <Navbar />
            <main className="site-main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/locations/:id" element={<LocationDetails />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <AIChatWidget />
          </div>
        </MapActionProvider>
      </FavoritesProvider>
    </DistanceProvider>
  );
}
