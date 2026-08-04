import { useNavigate } from 'react-router-dom'
import ChatWidget from './ChatWidget'
import '../styles/ChatPage.css'

function ChatPage() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="chat-page-wrap">
        <button className="back-link" onClick={() => navigate('/')}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M8.5 3L4 7l4.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <ChatWidget />
      </div>
    </div>
  )
}

export default ChatPage