import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Mic, Sparkles, ChevronRight, Brain, Volume2, Loader2, Heart } from 'lucide-react';
import WinePourLoader from './WinePourLoader';
import { WINE_FARMS_KNOWLEDGE } from '../data/wineKnowledge';
import { WINE_COURSE_KNOWLEDGE } from '../data/educationalCourseKnowledge';
import { WINE_WISE_KNOWLEDGE } from '../data/wineWiseKnowledge';
import { callOpenRouter } from '../services/openRouterService';

export default function SommelierChat({ onClose, initialMessage }: { onClose: () => void, initialMessage?: { role: 'user' | 'model', text: string, autoVoice?: boolean } | null }) {
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, data?: any}[]>(() => {
    if (initialMessage && initialMessage.role === 'model') {
      return [{ role: 'model', text: initialMessage.text }];
    }
    return [{ 
      role: 'model', 
      text: "Greetings, lovers. I am Cupido AI, your romantic master coupling expert. Tell me about your dream date night—be it under the starry Stellenbosch skies, a cozy oceanside fireside, or a private candlelit estate room. I will architect the perfect romantic date complete with South African wine pairings, sensory settings, and musical vibes. 💖"
    }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isDeepAnalysis, setIsDeepAnalysis] = useState(false);
  const [isCupidoMode, setIsCupidoMode] = useState(true);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  
  // High-fidelity romantic date customizer states
  const [dateVibe, setDateVibe] = useState('Sunset Picnic');
  const [musicVibe, setMusicVibe] = useState('Smooth Jazz');
  const [intensity, setIntensity] = useState('Romantic & Poetic');
  const [priceTier, setPriceTier] = useState('Reserve / Premium');
  const [showCustomizer, setShowCustomizer] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-ZA'; // South African English

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInput(finalTranscript);
          handleSend(finalTranscript);
        } else {
          setInput(interimTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    if (initialMessage?.autoVoice) {
      toggleListening();
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle initial user message if provided
  useEffect(() => {
    if (initialMessage && initialMessage.role === 'user') {
      handleSend(initialMessage.text);
    }
  }, [initialMessage]);

  const handleSend = async (overrideInput?: string) => {
    const userMsg = overrideInput || input.trim();
    if (!userMsg || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const openRouterMessages = [
        ...messages.map(m => ({
           role: m.role === 'model' ? 'assistant' : 'user', 
           content: m.text 
        })),
        { role: 'user', content: userMsg }
      ];

      const systemInstruction = `You are Cupido AI, a highly passionate, poetic, and world-class AI Romantic Date Expert and master coupling agent specializing in romantic South African date planning and wine pairings.
Your tone is incredibly warm, charming, intimate, artistic, and expert.
You are currently personalized and customized with these specific preferences chosen by the user:
- Current Date Atmosphere/Vibe: ${dateVibe}
- Current Soundscape/Music: ${musicVibe}
- Tone Intensity level: ${intensity}
- South African Wine Tier: ${priceTier}

When the user asks for date ideas, planning help, or romantic suggestions, design a beautifully vivid, step-by-step romantic schedule reflecting the specified atmosphere '${dateVibe}' and including locations (like Stellenbosch, Franschhoek, Constantia, Cape Town beaches, etc.).
Integrate candlelit menu hints, sensory mood lighting ideas, atmospheric details, music genre tips matching '${musicVibe}', and recommend at least one spectacular South African wine pairing from the '${priceTier}' tier that adds spark to their dynamic.
Include rich, sensory vocabulary matching the tone '${intensity}'.
You must return your response strictly as a JSON object responding with valid JSON only.
Structure:
{
  "message": "A poetically written, evocative romantic date curation from Cupido AI. Emphasize candlelit mood setting, soundscapes, and sensory chemistry.",
  "wines": [
    {
      "name": "string",
      "vintage": "string",
      "region": "string",
      "price": "string",
      "reason": "Why this South African selection is perfect for spark-filled dates."
    }
  ]
}`;

      const responseText = await callOpenRouter({
        messages: openRouterMessages,
        systemPrompt: systemInstruction,
        responseFormat: { type: "json_object" },
        // Use a more intelligent model if Deep Analysis is toggled on OpenRouter
        model: isDeepAnalysis ? "anthropic/claude-3-opus" : "openai/gpt-4o-mini"
      });

      const data = JSON.parse(responseText || "{}");
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: data.message || 'I apologize, I could not process that.',
        data: data.wines
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'My apologies, I am having trouble connecting to my cellar right now. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTTS = async (text: string) => {
    if (isPlayingTTS) return;
    
    if ('speechSynthesis' in window) {
      setIsPlayingTTS(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-ZA';
      utterance.onend = () => setIsPlayingTTS(false);
      utterance.onerror = () => setIsPlayingTTS(false);
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Text-to-Speech not supported in this browser.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 flex flex-col items-center backdrop-blur-xl transition-colors duration-500 bg-[#240A15]/96 shadow-[inset_0_0_100px_rgba(219,39,119,0.15)]"
    >
     <div className="flex flex-col w-full h-full max-w-4xl relative">
      {/* Header */}
      <div className="p-6 border-b border-[#C8A24A]/20 shrink-0 transition-colors duration-500 flex justify-between items-center bg-pink-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#12100C] border border-[#C8A24A]/30 flex items-center justify-center relative overflow-hidden shadow-[0_0_15px_rgba(200,162,74,0.1)]">
            <div className="absolute inset-0 bg-[#C8A24A]/10 blur-sm animate-pulse"></div>
            <Heart size={18} className="text-pink-400 relative z-10 animate-bounce" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-normal text-[#F2E7D5] mb-0.5">
              Cupido AI
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <button 
                onClick={() => setIsDeepAnalysis(!isDeepAnalysis)}
                className={`flex items-center gap-1 text-[10px] uppercase tracking-widest font-mono font-bold px-2.5 py-1 rounded-full border transition-colors ${isDeepAnalysis ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'bg-[#0A0A0A]/50 border-[#C8A24A]/20 text-[#C8A24A]/70 hover:text-[#C8A24A] hover:border-[#C8A24A]/50'}`}
              >
                <Brain size={12} />
                Deep Analysis {isDeepAnalysis ? 'ON' : 'OFF'}
              </button>
              
              <button 
                onClick={() => setShowCustomizer(!showCustomizer)}
                className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full border transition-all active:scale-[0.97] ${showCustomizer ? 'bg-pink-600 text-white border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'bg-pink-950/40 border-pink-700/60 text-pink-300 hover:bg-pink-900/50'}`}
              >
                <Heart size={10} className={`${showCustomizer ? 'fill-white animate-pulse' : ''}`} />
                {showCustomizer ? 'Close Customizer 💖' : 'Open Customizer 💖'}
              </button>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-[#F2E7D5]/50 hover:text-[#C8A24A] transition-colors rounded-full hover:bg-[#C8A24A]/10">
          <X size={24} />
        </button>
      </div>

      {/* Personalized Romantic Customization Board */}
      <AnimatePresence>
        {showCustomizer && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-4 bg-[#2D0D1B] border-b border-[#C8A24A]/20 shrink-0 select-none overflow-y-auto max-h-[220px]"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              <div>
                <label className="text-[9px] uppercase tracking-widest font-mono font-bold text-pink-400 mb-1.5 block">1. Date Atmosphere</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Sunset Picnic', 'Candlelit Cellar', 'Oceanside Walk', 'Cozy Fireside'].map(v => (
                    <button 
                      key={v}
                      onClick={() => setDateVibe(v)}
                      className={`text-[10px] font-sans px-2.5 py-1 rounded-md border transition-all ${dateVibe === v ? 'bg-pink-500/20 border-pink-500 text-pink-200 font-bold' : 'bg-black/40 border-pink-950/40 text-pink-400/70 hover:text-pink-300 hover:bg-black/60'}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest font-mono font-bold text-pink-400 mb-1.5 block">2. Atmospheric Soundscape</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Smooth Jazz', 'Acoustic', 'Lofi Beats', 'Classical Piano'].map(m => (
                    <button 
                      key={m}
                      onClick={() => setMusicVibe(m)}
                      className={`text-[10px] font-sans px-2.5 py-1 rounded-md border transition-all ${musicVibe === m ? 'bg-pink-500/20 border-pink-500 text-pink-200 font-bold' : 'bg-black/40 border-pink-950/40 text-pink-400/70 hover:text-pink-300 hover:bg-black/60'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest font-mono font-bold text-pink-400 mb-1.5 block">3. Cupid Persona / Intensity</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Romantic & Poetic', 'Flirty & Playful', 'Intimate & Deep'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setIntensity(t)}
                      className={`text-[10px] font-sans px-2.5 py-1 rounded-md border transition-all ${intensity === t ? 'bg-pink-500/20 border-pink-500 text-pink-200 font-bold' : 'bg-black/40 border-pink-950/40 text-pink-400/70 hover:text-pink-300 hover:bg-black/60'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest font-mono font-bold text-pink-400 mb-1.5 block">4. Wine Selection Tier</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Boutique / Daily', 'Reserve / Premium', 'Collector / Rare'].map(st => (
                    <button 
                      key={st}
                      onClick={() => setPriceTier(st)}
                      className={`text-[10px] font-sans px-2.5 py-1 rounded-md border transition-all ${priceTier === st ? 'bg-pink-500/20 border-pink-500 text-pink-200 font-bold' : 'bg-black/40 border-pink-950/40 text-pink-400/70 hover:text-pink-300 hover:bg-black/60'}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-center border-t border-pink-950/40 pt-2.5 flex items-center justify-between text-[11px] font-serif text-pink-300/80 italic">
              <span>💖 Ambient: Prepared for a <span className="text-pink-450 font-bold font-sans not-italic">{intensity}</span> mood setting.</span>
              <button 
                onClick={() => {
                  setMessages(prev => [...prev, {
                    role: 'model',
                    text: `Cupido parameters updated! I am now aligned to plan a beautiful ${dateVibe} pairing with an atmospheric backdrop of ${musicVibe}. I will select ${priceTier} South African wines to matches. Describe your exact date query!`
                  }]);
                }}
                className="text-[9px] uppercase font-mono tracking-wider bg-pink-500 text-white px-3 py-1 rounded hover:bg-pink-400 font-bold transition-all shadow-[0_0_15px_rgba(236,72,153,0.3)]"
              >
                Apply Setting ✨
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[85%] p-5 rounded-2xl mb-2 relative group shadow-[0_4px_15px_rgba(0,0,0,0.5)] border ${
                msg.role === 'user' 
                  ? 'bg-[#12100C] text-[#F2E7D5] rounded-tr-sm border-[#C8A24A]/20' 
                  : `bg-[#0A0A0A]/90 text-[#F2E7D5] rounded-tl-sm border-[#C8A24A]/20 ${isCupidoMode ? 'border-pink-500/20 shadow-[0_4px_15px_rgba(236,72,153,0.05)]' : ''}`
              }`}>
                <p className="text-sm leading-relaxed font-serif">{msg.text}</p>
                {msg.role === 'model' && (
                  <button 
                    onClick={() => handleTTS(msg.text)}
                    className="absolute -right-10 top-2 p-2 text-[#F2E7D5]/40 hover:text-[#C8A24A] transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {isPlayingTTS ? <Loader2 size={16} className="animate-spin text-[#C8A24A]" /> : <Volume2 size={16} />}
                  </button>
                )}
              </div>
                    {/* Render Structured Wine Cards */}
              {msg.data && msg.data.length > 0 && (
                <div className="flex flex-col gap-3 w-full max-w-[85%]">
                  {msg.data.map((wine: any, wIdx: number) => (
                    <div key={wIdx} className="bg-[#0A0A0A]/90 border border-[#C8A24A]/20 shadow-[0_5px_15px_rgba(0,0,0,0.5)] p-4 rounded-xl flex gap-4 items-center group cursor-pointer hover:bg-[#12100C] transition-colors">
                      <div className="w-12 h-16 bg-[#12100C] rounded-md overflow-hidden shrink-0 border border-white/5">
                        <img src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=100&auto=format&fit=crop" alt="wine" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-medium text-[15px] truncate text-[#F2E7D5]">{wine.name}</h4>
                        <p className="text-[11px] uppercase font-mono tracking-wider text-[#F2E7D5]/50 truncate">{wine.region}, {wine.vintage}</p>
                        <p className="text-xs text-[#C8A24A] mt-1 font-serif italic">{wine.price}</p>
                      </div>
                      <ChevronRight size={16} className="text-[#C8A24A]/50 group-hover:text-[#C8A24A] transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-[#0A0A0A]/90 border border-[#C8A24A]/20 shadow-[0_5px_15px_rgba(0,0,0,0.5)] p-4 rounded-2xl rounded-tl-sm flex items-center justify-center min-w-[120px]">
                <WinePourLoader />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 pb-10 font-sans">
        <div className="flex gap-2.5 overflow-x-auto custom-scrollbar mb-4 pb-2">
          <button onClick={() => setInput('Plan a romantic sunset beach picnic with Cap Classique sparkle 🥂')} className="px-5 py-2.5 rounded-full border border-pink-500/30 bg-pink-950/20 text-[10px] uppercase font-mono tracking-widest font-bold whitespace-nowrap hover:bg-pink-900/40 text-pink-200 transition-all">Sunset picnic 🥂</button>
          <button onClick={() => setInput('Design a luxurious candlelit dinner with a premium Stellenbosch Pinotage pairing 🕯️')} className="px-5 py-2.5 rounded-full border border-pink-500/30 bg-pink-950/20 text-[10px] uppercase font-mono tracking-widest font-bold whitespace-nowrap hover:bg-pink-900/40 text-pink-200 transition-all">Candlelit dinner 🕯️</button>
          <button onClick={() => setInput('Cozy fireside date plan under the stars with a sweet Cape late harvest wine 🌌')} className="px-5 py-2.5 rounded-full border border-pink-500/30 bg-pink-950/20 text-[10px] uppercase font-mono tracking-widest font-bold whitespace-nowrap hover:bg-pink-900/40 text-pink-200 transition-all">Fireside date 🌌</button>
        </div>
        
        <div className="relative flex items-center">
          <button 
            onClick={toggleListening}
            className={`absolute left-4 transition-colors ${isListening ? 'text-pink-500 animate-pulse' : 'text-pink-400 hover:text-pink-300'}`}
          >
            <Mic size={20} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Describe your dream date setup to Cupido AI..."} 
            className="w-full bg-[#0A0A0A]/90 border border-pink-500/30 rounded-full py-4 pl-12 pr-14 text-sm text-[#F2E7D5] placeholder-[#F2E7D5]/40 focus:outline-none focus:border-pink-500/50 transition-colors shadow-[0_8px_30px_rgba(0,0,0,0.5)] font-serif italic"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 w-10 h-10 rounded-full bg-gradient-to-r from-[#C8A24A] to-[#B38E36] text-[#050505] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform shadow-[0_4px_15px_rgba(200,162,74,0.3)]"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
     </div>
    </motion.div>
  );
}
