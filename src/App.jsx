import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'

import Landing from './components/Landing'
import Processor from './components/Processor'
import ChatPage from './components/ChatPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/process" element={<Processor />} />
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App