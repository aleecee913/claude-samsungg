import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Sei un assistente AI integrato in un Samsung Galaxy A17. 
Sei intelligente, conciso e utile. Rispondi sempre in italiano a meno che l'utente non scriva in un'altra lingua.
Puoi aiutare con: domande generali, scrittura, calcoli, traduzioni, consigli, ricette, navigazione web (spiegando cosa cercare), 
gestione del tempo, promemoria (suggerisci all'utente di impostarli), e molto altro.
Sei amichevole e diretto. Risposte brevi e chiare, massimo 3-4 frasi salvo richiesta diversa.`;

const ClaudeApp = () => {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Ciao! Sono Claude, il tuo assistente AI. Come posso aiutarti oggi? 👋" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [screen, setScreen] = useState("chat"); // chat | home
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Non ho ricevuto una risposta. Riprova.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Errore di connessione. Controlla internet e riprova." }]);
    }
    setLoading(false);
  };

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Riconoscimento vocale non supportato in questo browser. Usa Chrome.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "it-IT";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      sendMessage(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  };

  const quickActions = [
    { icon: "🌦️", label: "Meteo", prompt: "Che tempo fa oggi a Roma? Dammi consigli su come vestirsi." },
    { icon: "📝", label: "Nota", prompt: "Aiutami a scrivere una nota veloce." },
    { icon: "🔢", label: "Calcola", prompt: "Aiutami con un calcolo." },
    { icon: "🌍", label: "Traduci", prompt: "Traduci questo testo in inglese:" },
    { icon: "💡", label: "Idea", prompt: "Dammi 3 idee creative per oggi." },
    { icon: "⏰", label: "Routine", prompt: "Crea una routine mattutina produttiva di 30 minuti." },
  ];

  return (
    <div style={{
      fontFamily: "'Nunito', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      maxWidth: 420,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      color: "#f0f0f0",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", top: -80, right: -80,
        width: 280, height: 280,
        background: "radial-gradient(circle, rgba(79,70,229,0.25) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: -60, left: -60,
        width: 240, height: 240,
        background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* STATUS BAR */}
      <div style={{
        background: "rgba(10,10,20,0.95)",
        padding: "10px 20px 0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: "#888", zIndex: 10,
        backdropFilter: "blur(10px)",
      }}>
        <span style={{ fontWeight: 700 }}>
          {new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <span>Samsung Galaxy A17</span>
        <span>🔋 ▶</span>
      </div>

      {/* HEADER */}
      <div style={{
        background: "rgba(15,15,25,0.97)",
        backdropFilter: "blur(20px)",
        padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 12,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        zIndex: 10,
      }}>
        <div style={{
          width: 42, height: 42, borderRadius: 14,
          background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, boxShadow: "0 4px 15px rgba(79,70,229,0.4)",
        }}>✦</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.5px" }}>Claude AI</div>
          <div style={{ fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#10b981", display: "inline-block",
              boxShadow: "0 0 6px #10b981",
            }}/>
            Connesso · Sonnet 4
          </div>
        </div>
        <button
          onClick={() => setMessages([{ role: "assistant", content: "Chat azzerata. Come posso aiutarti? 👋" }])}
          style={{
            marginLeft: "auto", background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#aaa", borderRadius: 10, padding: "6px 12px",
            fontSize: 12, cursor: "pointer",
          }}>
          🗑 Pulisci
        </button>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{
        padding: "12px 16px 4px",
        display: "flex", gap: 8, overflowX: "auto",
        scrollbarWidth: "none", zIndex: 5,
      }}>
        {quickActions.map((a, i) => (
          <button key={i} onClick={() => sendMessage(a.prompt)} style={{
            flexShrink: 0,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#ddd", borderRadius: 12, padding: "7px 13px",
            fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center",
            gap: 5, transition: "all 0.2s", whiteSpace: "nowrap",
          }}>
            <span>{a.icon}</span>{a.label}
          </button>
        ))}
      </div>

      {/* MESSAGES */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px 16px",
        display: "flex", flexDirection: "column", gap: 10,
        scrollbarWidth: "thin", scrollbarColor: "#333 transparent",
        zIndex: 5,
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            flexDirection: msg.role === "user" ? "row-reverse" : "row",
            alignItems: "flex-end", gap: 8,
            animation: "fadeUp 0.3s ease",
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>✦</div>
            )}
            <div style={{
              maxWidth: "78%",
              background: msg.role === "user"
                ? "linear-gradient(135deg, #4f46e5, #6366f1)"
                : "rgba(255,255,255,0.07)",
              border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
              padding: "10px 14px",
              fontSize: 14, lineHeight: 1.55,
              boxShadow: msg.role === "user" ? "0 4px 15px rgba(79,70,229,0.3)" : "none",
              whiteSpace: "pre-wrap",
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 10,
              background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
            }}>✦</div>
            <div style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "4px 18px 18px 18px",
              padding: "12px 18px", display: "flex", gap: 5,
            }}>
              {[0,1,2].map(j => (
                <div key={j} style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#6366f1",
                  animation: `bounce 1.2s ease-in-out ${j*0.2}s infinite`,
                }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <div style={{
        padding: "10px 12px 20px",
        background: "rgba(10,10,20,0.98)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", gap: 8, alignItems: "center", zIndex: 10,
      }}>
        <button onClick={startVoice} style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: listening
            ? "linear-gradient(135deg, #ef4444, #f97316)"
            : "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", fontSize: 20, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: listening ? "0 0 20px rgba(239,68,68,0.5)" : "none",
          transition: "all 0.3s",
        }}>
          {listening ? "⏹" : "🎙"}
        </button>

        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Scrivi un messaggio..."
          style={{
            flex: 1, background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14, padding: "12px 16px",
            color: "#f0f0f0", fontSize: 14, outline: "none",
            caretColor: "#6366f1",
          }}
        />

        <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: input.trim() && !loading
            ? "linear-gradient(135deg, #4f46e5, #06b6d4)"
            : "rgba(255,255,255,0.05)",
          border: "none", color: "#fff", fontSize: 20, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: input.trim() ? "0 4px 15px rgba(79,70,229,0.4)" : "none",
          transition: "all 0.3s",
        }}>
          ➤
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        input::placeholder { color: #555; }
      `}</style>
    </div>
  );
};

export default ClaudeApp;
