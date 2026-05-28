import Navbar from '../components/neuralveil/Navbar'
import Hero from '../components/neuralveil/Hero'
import About from '../components/neuralveil/About'
import ToolTensor from '../components/neuralveil/ToolTensor'
import ToolGPU from '../components/neuralveil/ToolGPU'
import SectionDivider from '../components/neuralveil/SectionDivider'
import LaunchPage from '../components/neuralveil/LaunchPage'
import Footer from '../components/neuralveil/Footer'
import ContactUs from '../components/neuralveil/ContactUs'

export const Neuralveil = () => {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <ToolTensor />
        <ToolGPU />
        <SectionDivider />
        <LaunchPage />
        <ContactUs />
      </main>
      <Footer />
    </>
  )
}
