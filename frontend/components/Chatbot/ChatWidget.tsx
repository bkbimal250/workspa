 'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { FaComments, FaTimes, FaSpinner } from 'react-icons/fa';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import JobSuggestionCard from './JobSuggestionCard';
import SpaSuggestionCard from './SpaSuggestionCard';
import QuerySuggestions from './QuerySuggestions';
import { chatbotAPI, ChatbotJob, ChatbotSpa } from '@/lib/chatbot';
import { useLocation } from '@/hooks/useLocation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  text: string;
  isUser: boolean;
  jobs?: ChatbotJob[];
  spas?: ChatbotSpa[];
  suggestions?: string[];
}

// List of 20 Indian girls' names for personalized chatbot
const ASSISTANT_NAMES = [
  'Komal',
  'Sita',
  'Pooja',
  'Anjali',
  'Neha',
  'Priya',
  'Riya',
  'Sneha',
  'Kavya',
  'Aarti',
  'Nisha',
  'Shreya',
  'Meera',
  'Simran',
  'Isha',
  'Ayesha',
  'Payal',
  'Tanvi',
  'Swati',
  'Muskan',
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTrackedOpen, setHasTrackedOpen] = useState(false);
  const [assistantName, setAssistantName] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { location } = useLocation(true); // Auto-detect location
  
  // Rotating hints for chat button
  const hints = [
    "therapist",
    "receptionist",
    "spa manager",
    "Beautician",
    "House Keeping",
    "Best spa near",
  ];
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [typingDots, setTypingDots] = useState('');
  const [isHintVisible, setIsHintVisible] = useState(true);

  // Initialize assistant name and welcome message
  useEffect(() => {
    // Randomly select an assistant name
    const randomName = ASSISTANT_NAMES[Math.floor(Math.random() * ASSISTANT_NAMES.length)];
    setAssistantName(randomName);
    
    // Set initial welcome message with the selected name
    setMessages([
      {
        text: `Hello! I'm ${randomName}, Workspa assistant. I can help you find Work Spa and spas. What are you looking for?`,
        isUser: false,
        suggestions: [
          "Find spa therapist jobs in Mumbai",
          "Show me spas near me",
          "Part-time jobs near me",
          "Massage therapist jobs in Delhi",
        ],
      },
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Rotate hints and animate typing dots
  useEffect(() => {
    if (isOpen) return; // Don't animate when chat is open
    
    const hintInterval = setInterval(() => {
      setIsHintVisible(false);
      setTimeout(() => {
        setCurrentHintIndex((prev) => (prev + 1) % hints.length);
        setTypingDots('');
        setIsHintVisible(true);
      }, 300); // Fade out, change, fade in
    }, 3500); // Change hint every 3.5 seconds

    const dotsInterval = setInterval(() => {
      setTypingDots((prev) => {
        if (prev.length >= 3) return '';
        return prev + '.';
      });
    }, 500); // Add dot every 500ms

    return () => {
      clearInterval(hintInterval);
      clearInterval(dotsInterval);
    };
  }, [isOpen, hints.length]);

  const trackChatbotOpen = () => {
    if (hasTrackedOpen) return;
    setHasTrackedOpen(true);
    try {
      fetch(`${API_URL}/api/analytics/track?event_type=chat_opened`, {
        method: 'POST',
      }).catch((err) => { 
        console.log('Analytics tracking disabled or offline'); 
      });
    } catch (err) {
      console.log('Analytics call failed');
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    void trackChatbotOpen();
  };

  const handleSend = async (message: string) => {
    // Add user message
    const userMessage: Message = { text: message, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Call chatbot API
      const response = await chatbotAPI.search({
        message,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });

      // Add bot response
      const botMessage: Message = {
        text: response.message,
        isUser: false,
        jobs: response.jobs,
        spas: response.spas,
        suggestions: response.suggestions,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        text: error?.response?.data?.detail || 'Sorry, I encountered an error. Please try again.',
        isUser: false,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Button with Rotating Hints */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          {/* Hint Text Bubble */}
          <div className="bg-white rounded-xl shadow-2xl px-4 py-3 border-2 border-brand-200 relative">
            {/* Arrow pointing down */}
            <div className="absolute bottom-[-8px] right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-brand-200"></div>
            <div className="absolute bottom-[-6px] right-6 w-0 h-0 border-l-7 border-r-7 border-t-7 border-l-transparent border-r-transparent border-t-white"></div>
            
            <p 
              key={currentHintIndex}
              className={`text-sm text-gray-800 font-medium whitespace-nowrap transition-opacity duration-300 ${
                isHintVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="text-brand-600 font-semibold">Find</span>{' '}
              <span className="text-brand-700 font-bold">
                {hints[currentHintIndex]}
              </span>
              <span className="text-brand-600 inline-block w-4">{typingDots}</span>
            </p>
          </div>
          
          {/* Chat Button */}
          <button
            onClick={handleOpen}
            className="w-16 h-16 bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center hover:scale-110 border-2 border-white/20 overflow-hidden group relative animate-bounce-subtle"
            aria-label="Open chat"
          >
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
              <Image
                src="/uploads/chatbotimage.png"
                alt="Chatbot"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="relative z-10">
              <FaComments size={24} />
            </div>
          </button>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-full max-w-md h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-4 rounded-t-lg flex items-center justify-between relative overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 opacity-10">
              <Image
                src="/uploads/chatbotimage.png"
                alt="Chatbot background"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
              {/* Chatbot Avatar with Image */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shadow-lg border-2 border-white/30">
                <Image
                  src="/uploads/chatbotimage.png"
                  alt={assistantName ? `${assistantName}, Workspa Assistant` : 'Workspa Assistant'}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
              <div>
                <h3 className="font-semibold text-base">
                  {assistantName ? `${assistantName}, Workspa Assistant` : 'Workspa Assistant'}
                </h3>
                <p className="text-xs text-white/90">Ask me about jobs & spas</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-white/80 transition-colors relative z-10 p-1 hover:bg-white/10 rounded"
              aria-label="Close chat"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.map((msg, index) => (
              <div key={index}>
                <ChatMessage message={msg.text} isUser={msg.isUser} />
                
                {/* Query Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && !msg.isUser && (
                  <div className="ml-11 mb-4">
                    <QuerySuggestions 
                      suggestions={msg.suggestions} 
                      onSelect={(query) => handleSend(query)} 
                    />
                  </div>
                )}
                
                {/* Job Suggestions */}
                {msg.jobs && msg.jobs.length > 0 && (
                  <div className="ml-11 mb-4">
                    <p className="text-xs text-gray-500 mb-2 font-semibold">
                      Job Suggestions:
                    </p>
                    {msg.jobs.map((job) => (
                      <JobSuggestionCard key={job.id} job={job} />
                    ))}
                  </div>
                )}
                
                {/* SPA Suggestions */}
                {msg.spas && msg.spas.length > 0 && (
                  <div className="ml-11 mb-4">
                    <p className="text-xs text-gray-500 mb-2 font-semibold">
                      SPA Suggestions:
                    </p>
                    {msg.spas.map((spa) => (
                      <SpaSuggestionCard key={spa.id} spa={spa} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="animate-spin">
                  <FaSpinner size={14} />
                </div>
                <span>Searching jobs...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <ChatInput onSend={handleSend} disabled={loading} />
        </div>
      )}
    </>
  );
}


