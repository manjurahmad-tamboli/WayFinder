import { Routes, Route } from 'react-router-dom'
import { Navbar, Footer } from './components/Layout'
import Home from './pages/Home'
import MapPage from './pages/MapPage'
import LocationDetails from './pages/LocationDetails'
import About from './pages/About'
import Contact from './pages/Contact'
import NotFound from './pages/NotFound'

export default function App() { return <div className="min-h-screen"><Navbar /><main><Routes><Route path="/" element={<Home />} /><Route path="/map" element={<MapPage />} /><Route path="/locations/:id" element={<LocationDetails />} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} /><Route path="*" element={<NotFound />} /></Routes></main><Footer /></div> }
