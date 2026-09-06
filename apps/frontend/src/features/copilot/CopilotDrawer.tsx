import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  X,
  Send,
  CheckCircle2,
  MapPin as MapPinIcon,
  ShieldCheck,
  Compass,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import {
  askAgent,
  executeAgentAction,
  type AgentResponse,
  type AgentActionProposal,
  type AgentStepLog,
  type AttendanceMapData,
} from '../../api/agent';
import './CopilotDrawer.css';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  steps?: AgentStepLog[];
  actionProposal?: AgentActionProposal | null;
  mapData?: AttendanceMapData;
  auditSummary?: any;
  actionExecuted?: boolean;
}

const QUICK_PROMPTS = [
  { label: "📍 Audit remote check-ins", prompt: "Audit today's remote check-ins and check GPS perimeter" },
  { label: "🗺️ Map radar pins", prompt: "Show me the map radar coordinates and pins for today's punches" },
  { label: "⚡ Batch-approve WFH", prompt: "Batch-approve verified remote check-ins and clear pending HR review alerts" },
  { label: "📊 Payroll pre-flight", prompt: "Run payroll preflight audit to check for missing check-outs and expiring contracts" },
  { label: "👥 Attendance pulse", prompt: "Who is clocked in right now and how many are working from home?" },
];

/** Minimalist markdown formatter for agent answers */
const formatInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = (keyPrefix: number) => {
    if (currentList.length > 0) {
      elements.push(<ul key={`ul-${keyPrefix}`}>{currentList}</ul>);
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const itemText = trimmed.substring(2);
      currentList.push(<li key={`li-${idx}`}>{formatInline(itemText)}</li>);
      return;
    }

    flushList(idx);

    if (trimmed.startsWith('#### ')) {
      elements.push(<h4 key={`h4-${idx}`}>{formatInline(trimmed.replace('#### ', ''))}</h4>);
    } else if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={`h3-${idx}`}>{formatInline(trimmed.replace('### ', ''))}</h3>);
    } else if (trimmed === '---') {
      elements.push(<hr key={`hr-${idx}`} style={{ margin: '10px 0', borderColor: 'var(--border)' }} />);
    } else if (trimmed.length > 0) {
      elements.push(<p key={`p-${idx}`}>{formatInline(line)}</p>);
    } else {
      elements.push(<div key={`sp-${idx}`} style={{ height: '4px' }} />);
    }
  });

  flushList(lines.length);

  return <div className="copilot-prose">{elements}</div>;
};

export const CopilotDrawer: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);
  const isPrivileged = hasAnyRole(['ADMIN', 'HR_MANAGER', 'PAYROLL_USER']);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      text: "Hello! I am your **PeoplePay360 Copilot**, powered by Gemini.\n\nI audit attendance geofencing, verify remote WFH check-ins, and inspect payroll readiness before payruns. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isPrivileged) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setIsLoading(true);

    try {
      const response: AgentResponse = await askAgent(textToSend);

      const agentMessage: Message = {
        id: `agent_${Date.now()}`,
        sender: 'agent',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        steps: response.steps,
        actionProposal: response.actionProposal,
        mapData: response.toolResults?.getAttendanceMapData,
        auditSummary: response.toolResults?.auditWfhAndGeolocation,
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: `err_${Date.now()}`,
        sender: 'agent',
        text: `**Error processing request:** ${err?.message || 'Server did not respond.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (msgId: string, action: AgentActionProposal) => {
    setExecutingActionId(action.actionId);
    try {
      const result = await executeAgentAction(action);

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === msgId) {
            return {
              ...msg,
              actionExecuted: true,
              text: `${msg.text}\n\n---\n✅ **Action Completed:** ${result.message || 'Action executed successfully.'}`,
            };
          }
          return msg;
        })
      );
    } catch (err: any) {
      alert(`Action failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setExecutingActionId(null);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'agent',
        text: "Conversation reset. Select a quick action below or ask any question.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="copilot-trigger"
          aria-label="Open HR Copilot"
        >
          <Bot size={16} />
          <span>Copilot</span>
          <span className="copilot-trigger-dot" />
        </button>
      )}

      {/* Slide-over Drawer Overlay */}
      {isOpen && (
        <div className="copilot-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="copilot-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Clean & High-Contrast */}
            <div className="copilot-header">
              <div className="copilot-header-info">
                <div className="copilot-header-avatar">
                  <Bot size={20} />
                </div>
                <div>
                  <div className="copilot-title-row">
                    <h3 className="copilot-title">PeoplePay Copilot</h3>
                    <span className="copilot-badge">
                      <span className="copilot-badge-dot" />
                      Gemini 2.5
                    </span>
                  </div>
                  <p className="copilot-subtitle">
                    Attendance Geofencing & Payroll Intelligence
                  </p>
                </div>
              </div>

              <div className="copilot-header-actions">
                <button
                  onClick={handleClearChat}
                  title="Reset conversation"
                  className="copilot-icon-btn"
                  aria-label="Reset conversation"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close copilot"
                  className="copilot-icon-btn"
                  aria-label="Close drawer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="copilot-body">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`copilot-msg-group ${msg.sender}`}
                >
                  {/* Sender Metadata */}
                  <div className="copilot-msg-meta">
                    {msg.sender === 'user' ? (
                      <span>You • {msg.timestamp}</span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={11} style={{ color: 'var(--success)' }} />
                        Copilot • {msg.timestamp}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={msg.sender === 'user' ? 'copilot-bubble-user' : 'copilot-bubble-agent'}>
                    {msg.sender === 'user' ? (
                      <div className="copilot-user-text">{msg.text}</div>
                    ) : (
                      <>
                        {/* Autonomous Step Indicator */}
                        {msg.steps && msg.steps.length > 0 && (
                          <div className="copilot-steps-container">
                            <div className="copilot-steps-label">
                              <Compass size={11} style={{ color: 'var(--success)' }} />
                              <span>Reasoning Steps:</span>
                            </div>
                            <div className="copilot-steps-list">
                              {msg.steps.map((step, idx) => (
                                <span key={idx} className="copilot-step-chip">
                                  <span className="copilot-step-indicator" />
                                  {step.step}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Markdown Message Text */}
                        <FormattedContent content={msg.text} />
                      </>
                    )}

                    {/* Clean Geofence Triage Breakdown */}
                    {msg.auditSummary && (
                      <div className="copilot-triage-section">
                        <div className="copilot-section-title">
                          Geofence Triage Breakdown
                        </div>
                        <div className="copilot-triage-grid">
                          <div className="copilot-triage-card office">
                            <div className="copilot-triage-val">
                              {msg.auditSummary.verifiedOffice}
                            </div>
                            <div className="copilot-triage-lbl">In-Office</div>
                          </div>
                          <div className="copilot-triage-card wfh">
                            <div className="copilot-triage-val">
                              {msg.auditSummary.verifiedWfh}
                            </div>
                            <div className="copilot-triage-lbl">Verified WFH</div>
                          </div>
                          <div className="copilot-triage-card anomaly">
                            <div className="copilot-triage-val">
                              {msg.auditSummary.suspiciousPunches}
                            </div>
                            <div className="copilot-triage-lbl">Out-of-Bounds</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Clean GPS Perimeter Radar Pins */}
                    {msg.mapData && msg.mapData.pins.length > 0 && (
                      <div className="copilot-map-section">
                        <div className="copilot-map-header">
                          <span style={{ fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)' }}>
                            <MapPinIcon size={13} style={{ color: 'var(--success)' }} />
                            GPS Perimeter Pins ({msg.mapData.totalPins})
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            HQ: {msg.mapData.companyHq.latitude.toFixed(4)}, {msg.mapData.companyHq.longitude.toFixed(4)}
                          </span>
                        </div>
                        <div className="copilot-map-pins-list">
                          {msg.mapData.pins.map((pin) => (
                            <div key={pin.id} className="copilot-pin-item">
                              <div className="copilot-pin-left">
                                <span
                                  className="copilot-pin-color"
                                  style={{ backgroundColor: pin.pinColor }}
                                />
                                <span className="copilot-pin-name">
                                  {pin.employeeName}
                                </span>
                                <span className="copilot-pin-badge">
                                  {pin.workMode}
                                </span>
                              </div>
                              <span
                                className={`copilot-pin-dist ${
                                  pin.classification.includes('SUSPICIOUS') ? 'suspicious' : ''
                                }`}
                              >
                                {pin.distanceFromHqKm ?? 0} km away
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Clean Action Proposal Card */}
                    {msg.actionProposal && !msg.actionExecuted && (
                      <div className="copilot-action-card">
                        <div className="copilot-action-header">
                          <div className="copilot-action-icon">
                            <ShieldCheck size={16} />
                          </div>
                          <div>
                            <h4 className="copilot-action-title">
                              {msg.actionProposal.title}
                            </h4>
                            <p className="copilot-action-desc">
                              {msg.actionProposal.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleExecuteAction(msg.id, msg.actionProposal!)}
                          disabled={executingActionId === msg.actionProposal.actionId}
                          className="copilot-btn-approve"
                        >
                          {executingActionId === msg.actionProposal.actionId ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Applying resolutions...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} />
                              <span>Approve & Clear Warnings</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="copilot-loading-row">
                  <Loader2 size={13} className="animate-spin" style={{ color: 'var(--success)' }} />
                  <span>Checking tools & reasoning...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Suggestion Chips */}
            <div className="copilot-suggestions-bar">
              <div className="copilot-chips-scroll">
                {QUICK_PROMPTS.map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(qp.prompt)}
                    disabled={isLoading}
                    className="copilot-chip-btn"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="copilot-input-bar">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask Copilot (e.g. Audit today's remote check-ins)..."
                disabled={isLoading}
                className="copilot-input-field"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="copilot-send-btn"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
