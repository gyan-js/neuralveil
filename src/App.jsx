import { TensorShapeDebugger } from "./pages/TensorShapeDebugger.jsx"
import { Neuralveil } from "./pages/Neuralveil.jsx"
import { GPUMemoryEstimator } from "./pages/GPUMemoryEstimator.jsx"
import TermsOfUse from "./components/TermsOfUse.jsx"
import {Routes, Route} from 'react-router'
import ProtectedRoute from "./components/neuralveil/ProtectedRoute.jsx"
import './index.css'
import './App.css'
import "./styles/globals.css"
import PrivacyPolicy from "./components/PrivacyPolicy.jsx"
export default function App() {
  return (
    <>
 
      <Routes>
        <Route path="/" element={<Neuralveil />} />
        <Route path="/termsofuse" element={<TermsOfUse />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route
          path="/nvtsd"
          element={
            <ProtectedRoute>
              <TensorShapeDebugger />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nvgme"
          element={
            <ProtectedRoute>
              <GPUMemoryEstimator />
            </ProtectedRoute>
          }
        />

      </Routes>
    </>
  )
}