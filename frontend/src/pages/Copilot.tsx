import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Sparkles, BrainCircuit, Mic, MicOff, Volume2 } from 'lucide-react'
import AgentThinkingTimeline from '../components/AgentThinkingTimeline.tsx'
import type { TraceStep } from '../components/AgentThinkingTimeline.tsx'

// Extend window type for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface ChatMessage {
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export default function Copilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'agent',
      text: 'Hello! I am your DeadlineAI Multi-Agent Copilot. Give me a goal (e.g. "I have an interview next Monday") or speak using the 🎤 mic button — and I will coordinate all specialized agents to design your optimal work schedule.',
      timestamp: new Date().toISOString()
    }
  ])
  const [input, setInput] = useState('')
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [interimText, setInterimText] = useState('')
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setVoiceSupported(true)
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.continuous = false
      recognition.interimResults = true

      recognition.onresult = (event: any) => {
        let interim = ''
        let final = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            final += transcript
          } else {
            interim += transcript
          }
        }
        if (final) {
          setInput(prev => (prev + ' ' + final).trim())
          setInterimText('')
        } else {
          setInterimText(interim)
        }
      }

      recognition.onerror = () => {
        setIsListening(false)
        setInterimText('')
      }

      recognition.onend = () => {
        setIsListening(false)
        setInterimText('')
      }

      recognitionRef.current = recognition
    }
  }, [])

  const toggleVoice = () => {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setInterimText('')
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const textToSend = input.trim()
    if (!textToSend) return

    // Stop voice if still listening
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }

    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setInterimText('')
    setIsThinking(true)
    setTraceSteps([])

    try {
      const response = await fetch('http://localhost:5000/api/agent/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      })
      const data = await response.json()

      if (data.trace) setTraceSteps(data.trace)

      const agentMsg: ChatMessage = {
        sender: 'agent',
        text: data.message || 'I have analyzed and optimized your schedule.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, agentMsg])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, {
        sender: 'agent',
        text: 'Sorry, I encountered an error during my agent reasoning loop. Make sure the backend is running on port 5000.',
        timestamp: new Date().toISOString()
      }])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-4" style={{ height: 'calc(100vh - 120px)' }}>
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          AI Copilot Hub
        </h2>
        <p className="text-slate-400 text-sm mt-1">Talk or type to the Orchestrator. Watch agents reason in real time.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-4 min-h-0">

        {/* Chat panel */}
        <div className="xl:col-span-2 glass-panel rounded-2xl flex flex-col min-h-0" style={{ minHeight: '400px' }}>
          {/* Header */}
          <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Active Session</span>
            </div>
            <div className="flex items-center gap-2">
              {voiceSupported && (
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  Voice Enabled
                </span>
              )}
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                <Sparkles className="w-3 h-3" />
                <span>Orchestrator Online</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
            {messages.map((msg, idx) => {
              const isUser = msg.sender === 'user'
              return (
                <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed border ${
                    isUser
                      ? 'bg-purple-600 border-purple-500 text-white rounded-tr-none'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )
            })}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] text-slate-400">Agents coordinating...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interim voice text preview */}
          {interimText && (
            <div className="px-4 pb-1">
              <p className="text-xs text-purple-400 italic opacity-75">🎤 "{interimText}"</p>
            </div>
          )}

          {/* Input form */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-slate-950/20 flex gap-2 shrink-0">
            {/* Voice Button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                title={isListening ? 'Stop listening' : 'Speak your goal'}
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                  isListening
                    ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-purple-400 hover:border-purple-500/40'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isListening ? '🎤 Listening... speak now' : 'Type or use mic to speak your goal...'}
              className={`flex-1 px-4 py-2.5 glass-input text-xs transition-all ${isListening ? 'border-red-500/40' : ''}`}
              disabled={isThinking}
            />

            <button
              type="submit"
              disabled={isThinking || (!input.trim() && !interimText)}
              className="w-11 h-11 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-colors shrink-0 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Agent Thinking Timeline */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col min-h-0 xl:max-h-full max-h-72 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BrainCircuit className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-bold text-slate-200">Execution Inspector</span>
          </div>
          <div className="flex-1 min-h-0">
            <AgentThinkingTimeline steps={traceSteps} isThinking={isThinking} />
          </div>
        </div>

      </div>
    </div>
  )
}
