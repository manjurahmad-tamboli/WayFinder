import Navbar from './components/portfolio/Navbar'
import Hero from './components/portfolio/Hero'
import About from './components/portfolio/About'
import Skills from './components/portfolio/Skills'
import Projects from './components/portfolio/Projects'
import Journey from './components/portfolio/Journey'
import Contact from './components/portfolio/Contact'
import Footer from './components/portfolio/Footer'

export default function Portfolio() {
  return <div className="portfolio"><div className="noise" aria-hidden="true" /><Navbar /><main><Hero /><About /><Skills /><Projects /><Journey /><Contact /></main><Footer /></div>
}
