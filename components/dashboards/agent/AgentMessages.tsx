import React, { useMemo } from 'react';
import type { Message, User } from '../../../types';
import { ChatBubbleLeftRightIcon } from '../../icons/ActionIcons';

interface AgentMessagesProps {
  user: User;
  messages: Message[];
}

const AgentMessages: React.FC<AgentMessagesProps> = ({ user, messages }) => {
  const conversations = useMemo(() => {
    const grouped: Record<string, { propertyTitle: string; otherUser: string; messages: Message[] }> = {};

    messages.forEach((msg) => {
      const otherUser = msg.senderUsername === user.username ? msg.receiverUsername : msg.senderUsername;
      const key = `${msg.propertyId}-${otherUser}`;
      if (!grouped[key]) {
        grouped[key] = {
          propertyTitle: msg.propertyTitle,
          otherUser,
          messages: [],
        };
      }
      grouped[key].messages.push(msg);
    });

    Object.values(grouped).forEach((conv) => {
      conv.messages.sort((a, b) => a.timestamp - b.timestamp);
    });

    return Object.values(grouped).sort(
      (a, b) => b.messages[b.messages.length - 1].timestamp - a.messages[a.messages.length - 1].timestamp
    );
  }, [messages, user.username]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Client Messages
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Centralized threads with prospective buyers, tenants, and investors.
        </p>
      </div>

      <div className="space-y-4">
        {conversations.length > 0 ? (
          conversations.map((conv, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white font-sans">
                  {conv.otherUser}{' '}
                  <span className="font-normal text-slate-500 dark:text-slate-400">
                    regarding &ldquo;{conv.propertyTitle}&rdquo;
                  </span>
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {conv.messages.length} message{conv.messages.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {conv.messages.map((msg) => {
                  const isMine = msg.senderUsername === user.username;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold shrink-0 text-slate-700 dark:text-slate-300">
                          {msg.senderUsername.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-xl max-w-lg text-sm ${
                          isMine
                            ? 'bg-[#0F2D25] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                        <p className="text-[11px] opacity-70 mt-1 text-right font-mono">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-6">
            <ChatBubbleLeftRightIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mt-3">No Conversations Yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Client inquiries and direct messages on your listings will appear here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentMessages;
