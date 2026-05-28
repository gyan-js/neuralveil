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
        <Route path="/b7f4d9a3c2e81f6ab94d7735f1c8e4a6d2b5f0c19a7e3d84b6c1f92e5a7d3c8f" element={<TensorShapeDebugger />} />
      </Routes>
    </>
  )
}