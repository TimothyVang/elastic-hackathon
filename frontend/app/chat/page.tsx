"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, AlertTriangle } from "lucide-react";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  "Triage the latest critical alerts from 10.10.15.42",
  "Is there any beaconing activity in the last 24 hours?",
  "Check for lateral movement across our network",
  "Analyze process chains on WS-PC0142 for suspicious activity",
  "Look up threat intel for 198.51.100.23",
];

// Pre-recorded triage result shown as fallback when Agent Builder API is unavailable
const FALLBACK_TRIAGE = `## DCO Triage Report — Multi-Stage Intrusion from 10.10.15.42

**Triage Result: TRUE POSITIVE — Severity: CRITICAL**

### Kill Chain Reconstruction

| Phase | MITRE Technique | Evidence |
|-------|----------------|----------|
| Initial Access | T1566 (Phishing) | Macro-enabled attachment \`Q4_Report.xlsm\` delivered to jpark@corpsec.local |
| Execution + C2 | T1059 + T1071 | PowerShell with Base64 encoding → beaconing to 198.51.100.23 every ~345s |
| Credential Access | T1003 | LSASS memory dump via procdump.exe on WS-PC0142 |
| Lateral Movement | T1021 | SMB auth to DC-01, FILE-01, DB-01, WEB-01 using harvested credentials |
| Exfiltration | T1560 + T1041 | Data staged via 7z → exfil over HTTPS to 198.51.100.23 |

### Threat Intel Matches
- **198.51.100.23** — Known Lazarus Group C2 server (confidence: 95%)
- **evil-update.darkops.net** — Malware distribution domain (confidence: 92%)
- **a1b2c3d4...** — SHA-256 matches known PowerShell RAT dropper

### Containment Recommendations
1. **Isolate WS-PC0142** immediately — active C2 beaconing
2. **Block 198.51.100.23** at network perimeter (all ports)
3. **Force password reset** for jpark and all accounts used in lateral movement
4. **Sweep** DC-01, FILE-01, DB-01, WEB-01 for persistence mechanisms
5. **Preserve LSASS dump** as forensic evidence

### Risk Score: 95/100
Active multi-stage intrusion with confirmed credential theft and data exfiltration preparation. Immediate incident response required.`;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentAvailable, setAgentAvailable] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check if Agent Builder API is available
  useEffect(() => {
    fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "__ping__" }) })
      .then((r) => {
        setAgentAvailable(r.ok);
      })
      .catch(() => setAgentAvailable(false));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: "user", content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.response || "No response received.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Fallback: show pre-recorded triage
      const fallbackMsg: Message = {
        role: "assistant",
        content: FALLBACK_TRIAGE,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-xl font-bold text-white">Agent Chat</h1>
        <p className="text-sm text-gray-500 mt-1">
          Interact with the DCO Triage Agent to investigate alerts
        </p>
        {agentAvailable === false && (
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Agent Builder API unavailable — showing pre-recorded triage results
          </div>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-blue-400/40 mb-4" />
            <p className="text-gray-500 text-sm mb-6">
              Ask the DCO Triage Agent to investigate security alerts
            </p>
            <div className="grid grid-cols-1 gap-2 max-w-lg w-full">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-xs text-gray-400 bg-surface-raised border border-border-subtle rounded-lg px-4 py-2.5 hover:border-blue-500/40 hover:text-gray-300 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-surface-raised border border-border-subtle text-gray-300"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-invert prose-sm max-w-none [&_table]:text-xs [&_th]:px-2 [&_th]:py-1 [&_td]:px-2 [&_td]:py-1 [&_table]:border-collapse [&_th]:border [&_th]:border-border-subtle [&_td]:border [&_td]:border-border-subtle [&_th]:bg-surface-overlay/50 [&_pre]:bg-surface-overlay [&_code]:text-blue-400 [&_h2]:text-gray-200 [&_h3]:text-gray-300 [&_strong]:text-gray-200 whitespace-pre-wrap">
                  {msg.content}
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="shrink-0 w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-400" />
            </div>
            <div className="bg-surface-raised border border-border-subtle rounded-lg px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-400/60 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-blue-400/60 animate-bounce [animation-delay:0.15s]" />
                <div className="w-2 h-2 rounded-full bg-blue-400/60 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 pt-4 border-t border-border-subtle mt-4">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ask the agent to investigate..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
            className="flex-1 bg-surface-raised border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/30 text-white px-4 py-2.5 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
