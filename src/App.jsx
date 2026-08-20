import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

import Landing from './components/Landing'
import Processor from './components/Processor'
import ChatPage from './components/ChatPage'
import LandingV2 from './components/LandingV2'
import ProcessorChat from './components/ProcessorChat'



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/process" element={<Processor />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/v2" element={<LandingV2 />} />
        <Route path="/processorchat" element={<ProcessorChat />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App