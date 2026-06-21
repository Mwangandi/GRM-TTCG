import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, RefreshCw, Send, CheckCircle2, AlertTriangle, 
  Copy, Info, Users, Phone, ArrowUpRight, ArrowDownLeft, 
  Search, Trash2, Calendar, HelpCircle 
} from 'lucide-react';
import { motion } from 'motion/react';

interface WhatsAppLog {
  id: string;
  timestamp: string;
  direction: 'Inbound' | 'Outbound';
  phone: string;
  message: string;
  status: string;
  step: string;
}

interface ActiveSession {
  phone: string;
  step: string;
  feedback_type?: string;
  grievance_category?: string;
  ref_no?: string;
}

interface WhatsAppStats {
  totalInbound: number;
  totalOutbound: number;
  totalMessages: number;
  uniqueUsers: number;
  activeSessionCount: number;
}

export function WhatsAppIntegration() {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [stats, setStats] = useState<WhatsAppStats>({
    totalInbound: 0,
    totalOutbound: 0,
    totalMessages: 0,
    uniqueUsers: 0,
    activeSessionCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'All' | 'Inbound' | 'Outbound'>('All');

  // Trigger outbound test message
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Simulated Web Chatbot States
  const [simPhone, setSimPhone] = useState('+0002547111222');
  const [simInputText, setSimInputText] = useState('');
  const [simSending, setSimSending] = useState(false);

  const handleSendSimulatedMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simInputText.trim()) return;

    const userInput = simInputText.trim();
    setSimInputText('');
    setSimSending(true);

    try {
      const bodyParams = new URLSearchParams();
      bodyParams.append('From', `whatsapp:${simPhone}`);
      bodyParams.append('Body', userInput);

      const res = await fetch('/api/twilio/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyParams.toString()
      });

      if (res.ok) {
        await fetchStatus();
      } else {
        alert('Simulation endpoint returned an error status.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to transmit simulated request: ' + err.message);
    } finally {
      setSimSending(false);
    }
  };

  // Copy helper
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/whatsapp/status');
      if (!res.ok) throw new Error('Failed to load WhatsApp data.');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setActiveSessions(data.activeSessions || []);
        setStats(data.stats || {
          totalInbound: 0,
          totalOutbound: 0,
          totalMessages: 0,
          uniqueUsers: 0,
          activeSessionCount: 0
        });
      } else {
        throw new Error(data.error || 'Server reported failure loading logs.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred connecting to the Taita Taveta server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const handleCopyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleForceResetSession = async (phone: string) => {
    try {
      const res = await fetch('/api/whatsapp/reset-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
      } else {
        alert(data.error || 'Could not reset session.');
      }
    } catch (err) {
      console.error(err);
      alert('Error clearing session.');
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) return;

    setSendingTest(true);
    setTestResult(null);

    try {
      // Endpoint handles standard twilio formatting in background
      const res = await fetch(`/api/test-message?phone=${encodeURIComponent(testPhone)}&message=${encodeURIComponent(testMessage)}`);
      const data = await res.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: `Alert successfully handed over to Twilio Server. SID: ${data.sid}`
        });
        setTestMessage('');
        fetchStatus();
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Local transmission failed. Check your Twilio settings in the settings panel.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error occurred communicating with dispatcher.'
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Determine actual base URL for webhook
  const webhookUrl = `${window.location.origin}/api/twilio/webhook`;
  const alternativeWebhookUrl = `${window.location.origin}/webhook`;

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.phone.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.step.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDirection = directionFilter === 'All' || log.direction === directionFilter;

    return matchesSearch && matchesDirection;
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 h-full overflow-y-auto" id="whatsapp-integration-dashboard">
      
      {/* Top Description and Status Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
              WhatsApp Chatbot & Webhook Administration
            </h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure the Twilio sandbox or official sender, monitor active citizen chatbot logs, and manually dispatch notifications.
          </p>
        </div>
        
        <button 
          onClick={fetchStatus} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-medium rounded-lg text-sm transition-colors border border-slate-205 cursor-pointer self-start lg:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Webhook Configuration Guide Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-850 text-white rounded-xl overflow-hidden shadow-md border-b-4 border-emerald-500">
        <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="p-3 bg-emerald-600/25 rounded-xl border border-emerald-500/30 text-emerald-400 mt-1 flex-shrink-0">
            <Info className="w-8 h-8" />
          </div>
          <div className="flex-1 space-y-3">
            <h4 className="text-md font-bold uppercase tracking-wider text-emerald-400">Twilio Integration Instructions</h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              To wire up your Twilio Phone Number or sandbox helper in the Twilio Console, copy either webhook URL below and paste it into the 
              <strong> "WHEN A MESSAGE COMES IN" </strong> trigger configuration (ensure the request method is set to <strong>HTTP POST</strong>).
            </p>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-3">
              <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg flex items-center justify-between gap-3 text-xs font-mono">
                <div className="overflow-x-auto whitespace-nowrap scrollbar-none text-slate-200">
                  <span className="text-amber-400 mr-2 uppercase font-bold select-none">[Primary] Post:</span>
                  {webhookUrl}
                </div>
                <button 
                  onClick={() => handleCopyWebhook(webhookUrl)}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors cursor-pointer"
                  title="Copy URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg flex items-center justify-between gap-3 text-xs font-mono">
                <div className="overflow-x-auto whitespace-nowrap scrollbar-none text-slate-200">
                  <span className="text-amber-400 mr-2 uppercase font-bold select-none">[Fallback] Post:</span>
                  {alternativeWebhookUrl}
                </div>
                <button 
                  onClick={() => handleCopyWebhook(alternativeWebhookUrl)}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 transition-colors cursor-pointer"
                  title="Copy URL"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {copiedWebhook && (
              <p className="text-emerald-400 text-xs font-bold animate-fade-in flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Link copied to clipboard! Paste it into your Twilio Sandbox under WhatsApp Sandbox settings.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Transmitted</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalMessages}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inbound Received</p>
            <p className="text-2xl font-black text-slate-800 mt-1 flex items-baseline gap-1">
              {stats.totalInbound}
              <span className="text-xs font-semibold text-emerald-500">
                ({stats.totalMessages > 0 ? Math.round((stats.totalInbound / stats.totalMessages) * 100) : 0}%)
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">County Replied</p>
            <p className="text-2xl font-black text-slate-800 mt-1 flex items-baseline gap-1">
              {stats.totalOutbound}
              <span className="text-xs font-semibold text-blue-500">
                ({stats.totalMessages > 0 ? Math.round((stats.totalOutbound / stats.totalMessages) * 100) : 0}%)
              </span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unique Citizens</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{stats.uniqueUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Chat Flows</p>
            <p className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-1.5">
              {stats.activeSessionCount}
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Split Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Searchable Communication Logs List (2/3 size) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 flex flex-col min-h-[500px]">
          <div className="p-5 border-b border-slate-150 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Real-time Transmission Logs</h4>
              <p className="text-xs text-slate-500 mt-0.5">Continuous audit trail of WhatsApp message flow.</p>
            </div>

            {/* Quick Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Filter */}
              <div className="flex border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                {(['All', 'Inbound', 'Outbound'] as const).map(dir => (
                  <button
                    key={dir}
                    onClick={() => setDirectionFilter(dir)}
                    className={`px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      directionFilter === dir 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search bar inside logs */}
          <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search logs by phone number, message content, chatbot status..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-md border border-slate-200 outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-x-auto">
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-[340px]">
                <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">No matching logs found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchQuery ? 'Change your queries or search boundaries.' : 'Configure Twilio and submit or reply through WhatsApp to view messages.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-150">
                    <th className="p-3">Time</th>
                    <th className="p-3">Phone No</th>
                    <th className="p-3">Direction</th>
                    <th className="p-3">Message</th>
                    <th className="p-3">Chat Step</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => {
                    const date = new Date(log.timestamp);
                    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + date.toLocaleDateString();
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-500 whitespace-nowrap font-mono">{formattedTime}</td>
                        <td className="p-3 text-slate-800 font-mono font-medium">{log.phone}</td>
                        <td className="p-3 whitespace-nowrap">
                          {log.direction === 'Inbound' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 uppercase text-[10px]">
                              <ArrowDownLeft className="w-3 h-3" /> Inbound
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold border border-blue-100 uppercase text-[10px]">
                              <ArrowUpRight className="w-3 h-3" /> Outbound
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs xl:max-w-md break-words truncate" title={log.message}>
                          {log.message}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 font-semibold uppercase text-[10px] border border-slate-150">
                            {log.step}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-150 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
            <p>Showing {filteredLogs.length} logs of {logs.length} logged messages.</p>
            <p className="font-semibold text-emerald-600">Auto-refresh active (15s interval)</p>
          </div>
        </div>

        {/* Right Side: Interactive Chatbot Simulator + Active Flows + Dispatcher (1/3 size) */}
        <div className="space-y-6">

          {/* Interactive Chatbot Simulator */}
          <div className="bg-slate-900 rounded-xl border border-slate-950 overflow-hidden flex flex-col h-[480px] shadow-lg">
            {/* Simulator Header */}
            <div className="bg-emerald-800 text-white p-3.5 flex justify-between items-center border-b border-emerald-900">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider">WhatsApp GRS Chatbot</h4>
                  <p className="text-[10px] text-emerald-100 font-mono">Simulator Phone: {simPhone}</p>
                </div>
              </div>
              <button
                onClick={() => handleForceResetSession(simPhone)}
                className="px-2 py-1 text-[10px] bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 transition-colors rounded text-white font-bold cursor-pointer"
                title="Reset conversation state back to start"
              >
                Reset Flow
              </button>
            </div>

            {/* Simulated Msg History Box */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-950 flex flex-col justify-end">
              {logs.filter(log => {
                const logP = log.phone.replace(/[^0-9]/g, '');
                const simP = simPhone.replace(/[^0-9]/g, '');
                return logP.endsWith(simP) || simP.endsWith(logP);
              }).length === 0 ? (
                <div className="my-auto text-center p-4">
                  <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">Taita Taveta WhatsApp Simulator</p>
                  <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    Test the complete automated reporting flow in the browser. Type <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-400 font-mono">start</code> or <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-400 font-mono">1</code> below to begin!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[340px] pr-1">
                  {logs
                    .filter(log => {
                      const logP = log.phone.replace(/[^0-9]/g, '');
                      const simP = simPhone.replace(/[^0-9]/g, '');
                      return logP.endsWith(simP) || simP.endsWith(logP);
                    })
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((log) => {
                      const isUser = log.direction === 'Inbound';
                      return (
                        <div
                          key={log.id}
                          className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          <div
                            className={`p-2.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                              isUser
                                ? 'bg-emerald-700 text-white rounded-br-none font-medium'
                                : 'bg-slate-800 text-slate-100 rounded-bl-none font-medium border border-slate-755'
                            }`}
                          >
                            {log.message}
                          </div>
                          <span className="text-[9px] text-slate-500 mt-1 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendSimulatedMessage} className="p-2 border-t border-slate-800 bg-slate-900 flex gap-1.5">
              <input
                type="text"
                value={simInputText}
                onChange={e => setSimInputText(e.target.value)}
                placeholder="Type start, track, 1, confirm..."
                className="flex-1 bg-slate-950 text-slate-100 text-xs px-3 py-2 rounded-lg border border-slate-850 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                disabled={simSending}
              />
              <button
                type="submit"
                disabled={simSending || !simInputText.trim()}
                className="px-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer"
              >
                {simSending ? (
                  <span className="w-3 h-3 border-2 border-slate-300 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>
          </div>

          {/* Active Citizen Chatbot Session List */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center justify-between">
                Active Dialog Nodes
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                  {activeSessions.length} active
                </span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Complainants currently interacting with the WhatsApp bot.</p>
            </div>

            {activeSessions.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-lg">
                <Users className="w-8 h-8 text-slate-350 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">No ongoing flows right now</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Sessions expire automatically or reset after grievance lodgment.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                {activeSessions.map(session => (
                  <div key={session.phone} className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-all flex justify-between items-start gap-2 bg-slate-50/70">
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-800 font-mono flex items-center gap-1">{session.phone}</p>
                      <p className="text-slate-500">
                        Chat Node: <span className="text-emerald-700 font-semibold text-[10px] uppercase font-mono">{session.step}</span>
                      </p>
                      {session.feedback_type && (
                        <p className="text-slate-400 text-[10px]">
                          Forming: <span className="text-indigo-600">{session.feedback_type}</span> ({session.grievance_category || 'N/A'})
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleForceResetSession(session.phone)}
                      className="p-1 px-1.5 text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold rounded border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                      title="Force Clear Session Flow"
                    >
                      <Trash2 className="w-3 h-3" /> Reset
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp Direct Notification Alert Sender / Test Tool */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-500" />
                Citizen Broadcast Dispatcher
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 flex-wrap">
                Send manual support responses or notifications straight to a user's WhatsApp handset.
              </p>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-3.5">
              <div className="space-y-1.5 text-xs">
                <label className="block text-slate-700 font-semibold uppercase tracking-wider">Recipient Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="+2547XXXXXXXX or +1XXXXXXXXXX"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400">Ensure the recipient's phone number includes country prefix codes.</p>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block text-slate-700 font-semibold uppercase tracking-wider">Message Text Body</label>
                <textarea
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  rows={3}
                  placeholder="Ask for more information, provide custom resolution, or send grievance reminders..."
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-1 focus:ring-emerald-500 outline-none"
                  required
                ></textarea>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg border text-xs ${testResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                  {testResult.success ? (
                    <p className="flex items-start gap-1 font-medium"><CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" /> {testResult.message}</p>
                  ) : (
                    <p className="flex items-start gap-1 font-medium"><AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" /> {testResult.message}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={sendingTest}
                className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors shadow-sm text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sendingTest ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-200 border-t-white rounded-full animate-spin"></span>
                    Transmitting...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Transmit Alert Message
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
