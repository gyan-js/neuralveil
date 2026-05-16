import { TensorShapeDebugger } from "./pages/TensorShapeDebugger.jsx"
import { Neuralveil } from "./pages/Neuralveil.jsx"
import { GPUMemoryEstimator } from "./pages/GPUMemoryEstimator.jsx"
import {Routes, Route} from 'react-router'

import './index.css'
import './App.css'
import "./styles/globals.css"
export default function App() {
  return (
    <>
 
      <Routes>
        <Route path="/" element={<Neuralveil />} />
     
      </Routes>
    </>
  )
}