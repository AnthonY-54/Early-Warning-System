import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ChatbotWidget() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isTeacher = user?.role === 'teacher';
  const initialGreeting = isTeacher
    ? "Hi! Ask me about any student or your class as a whole."
    : "Hi! Ask me anything about your academic progress.";
  const panelSubtitle = isTeacher
    ? "Ask about cohort & student risk"
    : "Ask about performance & risk";
  const apiEndpoint = isTeacher
    ? `${API_URL}/api/chatbot/teacher`
    : `${API_URL}/api/chatbot/student`;

  const [messages, setMessages] = useState([
    { role: 'assistant', content: initialGreeting, isGreeting: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Reset conversation when logged in user changes
  useEffect(() => {
    setMessages([
      { role: 'assistant', content: initialGreeting, isGreeting: true }
    ]);
  }, [user?.role, user?.id]);

  // Auto-scroll chat to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Render widget only for authenticated students or teachers
  if (!user || (user.role !== 'student' && user.role !== 'teacher')) {
    return null;
  }

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const newHistory = [...messages, { role: 'user', content: userText }];

    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Filter out UI-only initial greeting before sending payload to backend
      const payloadMessages = newHistory
        .filter(msg => !msg.isGreeting)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await axios.post(
        apiEndpoint,
        { messages: payloadMessages },
        { headers: { Authorization: token ? `Bearer ${token}` : '' } }
      );

      const replyText = response.data?.reply || "I didn't receive a response. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);
    } catch (error) {
      console.error('Error querying chatbot:', error);
      const fallbackReply = error.response?.data?.reply || error.response?.data?.message || "Looks like things went south on my side. Unlike you, I am a newbie in job. Let me restart my engines. Go for it again.";
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackReply }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-indigo-500/25 transition-transform duration-200 hover:rotate-[15deg] focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
          title={isTeacher ? "Open Teacher Assistant Chatbot" : "Open Academic Assistant Chatbot"}
          aria-label="Open Chatbot"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Popup Panel */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[500px] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-snug">
                  {isTeacher ? "Teacher Assistant" : "Academic Assistant"}
                </h3>
                <p className="text-xs text-blue-100 font-normal">{panelSubtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
              title="Close Chat"
              aria-label="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-2 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                  }`}
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                >
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                </div>
                <div
                  className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-none shadow-xs'
                    }`}
                >
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-snug">{children}</li>,
                        h2: ({ children }) => <h2 className="font-bold text-sm mt-2 mb-1">{children}</h2>,
                        h3: ({ children }) => <h3 className="font-bold text-sm mt-1.5 mb-0.5">{children}</h3>,
                        code: ({ children }) => <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start space-x-2">
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 px-4 py-3 rounded-2xl rounded-tl-none flex items-center space-x-1.5 shadow-xs">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl disabled:opacity-40 transition-all flex items-center justify-center shadow-xs"
              title="Send Message"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
