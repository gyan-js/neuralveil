import { TensorShapeDebugger } from "./pages/TensorShapeDebugger.jsx"
import { NeuralVeil } from "./pages/NeuralVeil.jsx"
import { GPUMemoryEstimator } from "./pages/GPUMemoryEstimator.jsx"
import {Routes, Route} from 'react-router'
import Nav from "./components/neuralveil/Nav.jsx"
export default function App() {
  return (
    <>
      <Nav />
      <Routes>
        <Route path="/" element={<NeuralVeil />} />
      </Routes>
    </>
  )
}