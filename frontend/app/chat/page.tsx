"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Bot,
  User,
  AlertTriangle,
  Database,
  Search,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Shield,
  GitBranch,
} from "lucide-react";

interface Step {
  type: string;
  tool_id?: string;
  reasoning?: string;
  params?: unknown;
  results?: unknown;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolsUsed?: string[];
  backend?: "agent_builder" | "groq";
  steps?: Step[];
}

const SUGGESTED_PROMPTS = [
  "Triage the latest critical alerts from 10.10.15.42",
  "Is there any beaconing activity in the last 24 hours?",
  "Check for lateral movement across our network",
  "Analyze process chains on WS-PC0142 for suspicious activity",
  "Look up threat intel for 198.51.100.23",
];

const AGENT_TOOLS = [
  { name: "Correlated Events", type: "ES|QL", icon: Database },
  { name: "Lateral Movement", type: "ES|QL", icon: Database },
  { name: "Beaconing Detection", type: "ES|QL", icon: Database },
  { name: "Process Chain", type: "ES|QL", icon: Database },
  { name: "Privilege Escalation", type: "ES|QL", icon: Shield },
  { name: "Threat Intel", type: "Search", icon: Search },
  { name: "Incident Workflow", type: "Workflow", icon: GitBranch },
];

function ExecutionTrace({ steps }: { steps: Step[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-3 border border-divider bg-base-dark/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted/60 hover:text-primary transition-colors"
      >
        {expanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        Agent Execution Trace ({steps.length} step{steps.length !== 1 ? "s" : ""})
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-[11px] text-muted/50"
            >
              <span className="text-muted/30 font-mono w-4 shrink-0 text-right">
                {i + 1}.
              </span>
              {step.type === "tool_call" ? (
                <span>
                  <span className="text-accent-orange font-bold">[tool_call]</span>{" "}
                  <span className="text-primary/80">{step.tool_id}</span>
                  {step.results != null && (
                    <span className="text-muted/40">
                      {" "}
                      &rarr;{" "}
                      {typeof step.results === "string"
                        ? `${(step.results as string).slice(0, 60)}...`
                        : "results returned"}
                    </span>
                  )}
                </span>
              ) : (
                <span>
                  <span className="text-green-500/80 font-bold">[{step.type}]</span>{" "}
                  {step.reasoning
                    ? step.reasoning.slice(0, 80) + (step.reasoning.length > 80 ? "..." : "")
                    : "Agent processing"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BackendBadge({ backend }: { backend?: "agent_builder" | "groq" }) {
  if (!backend) return null;

  if (backend === "agent_builder") {
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.15em] text-green-700 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Agent Builder
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.15em] text-accent-orange bg-accent-orange/10 border border-accent-orange/20 px-1.5 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-accent-orange" />
      Groq Fallback
    </span>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentAvailable, setAgentAvailable] = useState<boolean | null>(null);
  const [activeBackend, setActiveBackend] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "__ping__" }),
    })
      .then(async (r) => {
        setAgentAvailable(r.ok);
        if (r.ok) {
          const data = await r.json();
          setActiveBackend(data.backend || null);
        }
      })
      .catch(() => setAgentAvailable(false));
  }, []);

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
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Send conversation history for multi-turn context
      const history = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          conversation_id: conversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      // Store conversation_id for multi-turn
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const assistantMsg: Message = {
        role: "assistant",
        content: data.response || "No response received.",
        timestamp: new Date(),
        toolsUsed: data.toolsUsed || [],
        backend: data.backend || undefined,
        steps: data.steps || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Unknown error";
      const errorMsg: Message = {
        role: "assistant",
        content: `Agent error: ${detail}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Hero header */}
      <div className="shrink-0 mb-6 relative">
        {/* Blob */}
        <div
          className="absolute -top-16 -right-16 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{
            background: "#F8A348",
            filter: "blur(120px)",
            mixBlendMode: "multiply",
            opacity: 0.1,
          }}
        />

        <div className="relative z-10">
          <h1 className="font-display font-bold text-[clamp(2rem,5vw,3.5rem)] uppercase tracking-[-0.05em] leading-[0.85] text-primary">
            Agent<br />
            <span className="text-accent-red ml-[5vw]">Chat</span>
          </h1>
          <p className="mt-3 text-muted/60 text-[14px] max-w-[500px] leading-relaxed">
            Interact with the DCO Triage Agent — powered by Elastic Agent Builder with 7 tools for autonomous threat analysis.
          </p>

          {/* Active backend indicator */}
          {activeBackend && (
            <div className="mt-2">
              <BackendBadge backend={activeBackend as "agent_builder" | "groq"} />
            </div>
          )}

          {/* Agent tools mini display */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {AGENT_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.name}
                  className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-muted/40 border border-divider px-2 py-1 bg-base-dark/30"
                >
                  <Icon className="w-3 h-3" />
                  {tool.name}
                </div>
              );
            })}
          </div>

          {agentAvailable === false && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-accent-orange bg-accent-orange/8 border border-accent-orange/20 px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Using local Groq fallback — Agent Builder API unavailable
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-1 border-t border-divider pt-4"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 bg-primary flex items-center justify-center mb-4">
              <Bot className="w-7 h-7 text-base" />
            </div>
            <p className="text-muted/50 text-sm mb-8 max-w-sm">
              Ask the DCO Triage Agent to investigate security alerts, detect attack patterns, or look up threat intelligence.
            </p>
            <div className="grid grid-cols-1 gap-2 max-w-lg w-full">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-[13px] text-muted/70 bg-base-dark/40 border border-divider px-4 py-3 hover:border-accent-red/30 hover:text-primary hover:shadow-brutal-sm hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-200"
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
            data-backend={msg.backend || undefined}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="shrink-0 w-8 h-8 bg-primary flex items-center justify-center">
                <Bot className="w-4 h-4 text-base" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-base"
                  : "bg-base-dark/60 border border-divider text-primary"
              }`}
            >
              {/* Backend badge for assistant messages */}
              {msg.role === "assistant" && msg.backend && (
                <div className="mb-2">
                  <BackendBadge backend={msg.backend} />
                </div>
              )}

              {msg.role === "assistant" ? (
                <div className="chat-prose"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
              ) : (
                msg.content
              )}

              {/* Tool badges */}
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="mt-3 pt-2 border-t border-divider flex flex-wrap gap-1.5">
                  <Zap className="w-3 h-3 text-accent-orange" />
                  {msg.toolsUsed.map((tool) => (
                    <span
                      key={tool}
                      className="text-[9px] font-bold uppercase tracking-[0.1em] text-accent-orange/70 bg-accent-orange/8 border border-accent-orange/15 px-1.5 py-0.5"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}

              {/* Execution trace */}
              {msg.steps && msg.steps.length > 0 && (
                <ExecutionTrace steps={msg.steps} />
              )}
            </div>
            {msg.role === "user" && (
              <div className="shrink-0 w-8 h-8 bg-muted/20 flex items-center justify-center">
                <User className="w-4 h-4 text-muted" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 bg-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-base" />
            </div>
            <div className="bg-base-dark/60 border border-divider px-4 py-3">
              <div className="flex gap-2 items-center text-[11px] text-muted/50 uppercase tracking-[0.1em]">
                <div className="w-2 h-2 bg-accent-red animate-pulse" />
                Running agent tools...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 pt-4 border-t border-divider mt-4">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Ask the agent to investigate..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={loading}
            className="flex-1 bg-base-dark/50 border border-divider px-4 py-3 text-sm text-primary placeholder-muted/30 focus:outline-none focus:border-primary/40 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="btn-brutalist disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="relative z-10">
              <Send className="w-4 h-4" />
            </span>
          </button>
        </div>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted/30 uppercase tracking-[0.1em]">
          <ExternalLink className="w-3 h-3" />
          <a
            href={`${process.env.NEXT_PUBLIC_KIBANA_URL || ""}/app/agent_builder/agents/dco_triage_agent`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-red transition-colors"
          >
            Open in Kibana
          </a>
        </div>
      </div>
    </div>
  );
}
