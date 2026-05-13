import React from 'react'
import Nav from '../components/neuralveil/Nav'
import Hero from '../components/neuralveil/Hero.jsx'
import About from '../components/neuralveil/About.jsx'
import Tool01 from '../components/neuralveil/Tool01.jsx'
import Tool02 from '../components/neuralveil/Tool02.jsx'
import Launch from '../components/neuralveil/Launch.jsx'
import Footer from '../components/neuralveil/Footer.jsx'
import SectionDivider from '../components/neuralveil/SectionDivider.jsx'

export const NeuralVeil = () => {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      
      <main>
        <Hero />
        <SectionDivider variant="gold" />
        <About />
        <SectionDivider variant="ember" />
        <Tool01 />
        <SectionDivider variant="cyan" />
        <Tool02 />
        <SectionDivider variant="gold" />
        <Launch />
      </main>
      <Footer />
    </div>
  )
}
