import { useNavigate } from 'react-router-dom'
import '../styles/LandingV2.css'
import c3poIcon from '../assets/c3po_icon.jpg'
import r2d2Icon from '../assets/r2d2_icon.jpg'

const BOTS = [
  {
    id: 'spending',
    name: 'C-3PO the Credit Droid',
    icon: c3poIcon,
    description: 'Ask about your spending, monthly totals, category breakdowns, and trends.',
    route: '/chat',
  },
  {
    id: 'processor',
    name: 'R2-D2 the Statement Processor',
    icon: r2d2Icon,
    description: 'Upload a new visa statement PDF, review the extracted transactions, and confirm.',
    route: '/processorchat',
  },
]

function BotAvatar({ bot, size = 56 }) {
  return (
    <div className="bot-avatar" style={{ width: size, height: size }}>
      {bot.icon ? (
        <img src={bot.icon} alt="" className="bot-avatar-img" />
      ) : (
        <DocumentBotIcon />
      )}
    </div>
  )
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function LandingV2() {
  const navigate = useNavigate()

  return (
    <div className="page-v2">
      <h1 className="page-v2-title">Chats</h1>

      <div className="favorites-row">
        {BOTS.map((bot) => (
          <button key={bot.id} className="favorite-item" onClick={() => navigate(bot.route)}>
            <BotAvatar bot={bot} size={56} />
            <span className="favorite-name">{bot.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="chat-list">
        {BOTS.map((bot) => (
          <button key={bot.id} className="chat-row" onClick={() => navigate(bot.route)}>
            <BotAvatar bot={bot} size={44} />
            <div className="chat-row-content">
              <div className="chat-row-header">
                <span className="chat-row-name">{bot.name}</span>
              </div>
              <p className="chat-row-preview">{bot.description}</p>
            </div>
            <ChevronIcon />
          </button>
        ))}
      </div>
    </div>
  )
}