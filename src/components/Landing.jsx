import { useNavigate } from 'react-router-dom'
import '../styles/Landing.css'
import muFavicon from '../assets/mu_favicon.png'

function Landing() {
  const navigate = useNavigate()

  return (
    <div className="page landing-page">
      <div className="card landing-card">
        <div className="logo-mark" aria-hidden="true">
          <img src={muFavicon} alt="" className="logo-img" />
        </div>

        <h1 className="landing-title">Statement tools</h1>
        <p className="landing-subtitle">Upload new statements, or ask questions about the ones you've already sent.</p>

        <div className="landing-actions">
          <button className="landing-btn primary" onClick={() => navigate('/process')}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
              <path d="M8.5 2v10M4 6.5l4.5-4.5 4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 13.5h13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
            Process visa statements
          </button>

          <button className="landing-btn secondary" onClick={() => navigate('/chat')}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden="true">
              <path d="M2 4.5A2.5 2.5 0 014.5 2h8A2.5 2.5 0 0115 4.5v5A2.5 2.5 0 0112.5 12H7l-3.5 3v-3h-1A2.5 2.5 0 010 9.5v-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            Ask about my spending
          </button>
        </div>
      </div>
    </div>
  )
}

export default Landing