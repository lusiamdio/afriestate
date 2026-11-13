import React, { useMemo, useState } from 'react';
import type { Message, User } from '../../../types';
import { ChatBubbleLeftRightIcon } from '../../icons/ActionIcons';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../contexts/ToastContext';

interface InvestorMessagesProps {
  user: User;
  messages: Message[];
}

const InvestorMessages: React.FC<InvestorMessagesProps> = ({ user, messages }) => {
  const { addToast } = useToast();
  const [localReplies, setLocalReplies] = useState<Record<string, Message[]>>({});
  const [draft, setDraft] = useState('');

  const conversations = useMemo(() => {
    const grouped: Record<string, { key: string; propertyTitle: string; otherUser: string; messages: Message[] }> = {};
    const investorMessages = messages.filter(
      (msg) => msg.senderUsername === user.username || msg.receiverUsername === user.username
    );

    investorMessages.forEach((msg) => {
      const otherUser = msg.senderUsername === user.username ? msg.receiverUsername : msg.senderUsername;
      const key = `${msg.propertyId}-${otherUser}`;
      if (!grouped[key]) {
        grouped[key] = {
          key,
          propertyTitle: msg.propertyTitle,
          otherUser,
          messages: [],
        };
      }
      grouped[key].messages.push(msg);
    });

    Object.values(grouped).forEach((conv) => {
      const extra = localReplies[conv.key] || [];
      conv.messages = [...conv.messages, ...extra].sort((a, b) => a.timestamp - b.timestamp);
    });

    return Object.values(grouped).sort(
      (a, b) => b.messages[b.messages.length - 1].timestamp - a.messages[a.messages.length - 1].timestamp
    );
  }, [messages, user.username, localReplies]);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const activeConversation = conversations.find((c) => c.key === selectedKey) || conversations[0] || null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !draft.trim()) return;
    const reply: Message = {
      id: `local_${Date.now()}`,
      propertyId: activeConversation.messages[0]?.propertyId || 'prop_1',
      propertyTitle: activeConversation.propertyTitle,
      senderUsername: user.username,
      receiverUsername: activeConversation.otherUser,
      text: draft.trim(),
      timestamp: Date.now(),
    };
    setLocalReplies((prev) => ({
      ...prev,
      [activeConversation.key]: [...(prev[activeConversation.key] || []), reply],
    }));
    setDraft('');
    addToast(`Message sent to ${activeConversation.otherUser}`, 'success');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Developer &amp; Advisor Threads
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Direct due-diligence correspondence on active deals and mandates.
        </p>
      </div>

      {conversations.length > 0 && activeConversation ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[480px]">
          {/* Thread List */}
          <div className="border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
            {conversations.map((conv) => {
              const lastMsg = conv.messages[conv.messages.length - 1];
              const isSelected = conv.key === activeConversation.key;
              return (
                <button
                  key={conv.key}
                  onClick={() => setSelectedKey(conv.key)}
                  className={`w-full text-left p-4 transition-colors ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{conv.otherUser}</span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                      {new Date(lastMsg.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#0F2D25] dark:text-emerald-400 truncate mt-0.5">
                    {conv.propertyTitle}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{lastMsg.text}</p>
                </button>
              );
            })}
          </div>

          {/* Active Thread */}
          <div className="lg:col-span-2 flex flex-col justify-between h-full">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{activeConversation.otherUser}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{activeConversation.propertyTitle}</p>
            </div>

            <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[360px]">
              {activeConversation.messages.map((msg) => {
                const isSelf = msg.senderUsername === user.username;
                return (
                  <div key={msg.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-xl max-w-md text-xs leading-relaxed ${
                        isSelf
                          ? 'bg-[#0F2D25] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <p className="text-[10px] opacity-70 mt-1 text-right font-mono tabular-nums">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleSend}
              className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message to developer or agent..."
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D25]"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F2D25] text-white text-xs font-semibold rounded-lg hover:bg-[#173f34] transition-colors shrink-0"
              >
                <PaperAirplaneIcon className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <ChatBubbleLeftRightIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-3">No Active Threads</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Correspondence regarding investment dossiers and viewings will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default InvestorMessages;
