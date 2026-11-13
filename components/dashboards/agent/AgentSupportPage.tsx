import React, { useState, useMemo, useRef, useEffect } from 'react';
import { GoogleGenAI } from '../../../lib/ai';
import type { User, ForumPost } from '../../../types';
import { KNOWLEDGE_BASE_ARTICLES, FORUM_POSTS } from '../../../constants';
import { BookOpenIcon, UsersIcon, ChatBubbleLeftRightIcon } from '../../icons/AgentDashboardIcons';
import { CpuChipIcon } from '../../icons/ActionIcons';
import { SearchIcon } from '../../icons/SearchIcons';
import { SendIcon } from '../../icons/NavIcons';
import NewPostModal from '../../NewPostModal';
import ForumPostDetailModal from '../../ForumPostDetailModal';

interface AgentSupportPageProps {
  user: User;
}

type SupportTab = 'kb' | 'chat' | 'forum';

interface ChatMessage {
  sender: 'agent' | 'support';
  text: string;
}

const AgentSupportPage: React.FC<AgentSupportPageProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<SupportTab>('kb');
  const [forumPosts, setForumPosts] = useState<ForumPost[]>(FORUM_POSTS);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);

  const handleAddPost = (post: { title: string; content: string }) => {
    const newPost: ForumPost = {
      ...post,
      id: `fp_${Date.now()}`,
      author: user.username,
      timestamp: Date.now(),
      replies: 0,
      views: 0,
    };
    setForumPosts((prev) => [newPost, ...prev]);
    setIsPostModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col space-y-5 max-w-[1400px] mx-auto">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          Support & Knowledge Base
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Playbooks, direct desk support, and agent community discussions.
        </p>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800 flex gap-6 overflow-x-auto">
        {[
          { id: 'kb' as const, label: 'Knowledge Base', icon: BookOpenIcon },
          { id: 'chat' as const, label: 'Brokerage Desk', icon: ChatBubbleLeftRightIcon },
          { id: 'forum' as const, label: 'Agent Forum', icon: UsersIcon },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-2.5 border-b-2 text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'border-[#0F2D25] dark:border-amber-400 text-[#0F2D25] dark:text-amber-300'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-y-auto">
        {activeTab === 'chat' && <ChatSupport />}
        {activeTab === 'kb' && <KnowledgeBase />}
        {activeTab === 'forum' && (
          <CommunityForum
            posts={forumPosts}
            onNewPost={() => setIsPostModalOpen(true)}
            onPostClick={setSelectedPost}
          />
        )}
      </div>

      <NewPostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onAddPost={handleAddPost}
      />

      {selectedPost && (
        <ForumPostDetailModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          post={selectedPost}
        />
      )}
    </div>
  );
};

const ChatSupport: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'support', text: 'Welcome to the AfriEstate Brokerage Support Desk. How can we assist with your listings today?' },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: 'agent', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'support',
          text: 'Your ticket has been logged with Brokerage Operations. Typical SLA is under 2 hours.',
        },
      ]);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="flex-grow p-5 space-y-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-end gap-2 ${msg.sender === 'agent' ? 'justify-end' : ''}`}>
            {msg.sender === 'support' && (
              <div className="w-7 h-7 rounded-full bg-[#0F2D25] text-[#C9A35D] flex items-center justify-center text-xs font-bold shrink-0">
                A
              </div>
            )}
            <div
              className={`max-w-md px-3.5 py-2.5 rounded-xl text-sm ${
                msg.sender === 'agent'
                  ? 'bg-[#0F2D25] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe your question or listing ID..."
          className="flex-1 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <button
          onClick={handleSend}
          className="bg-[#0F2D25] text-white p-2.5 rounded-lg hover:bg-[#173f34]"
          aria-label="Send message"
        >
          <SendIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const KnowledgeBase: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState<{ title: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredArticles = useMemo(
    () =>
      KNOWLEDGE_BASE_ARTICLES.filter(
        (a) =>
          a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.content.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [searchTerm]
  );

  const handleGenerateArticle = async () => {
    if (!aiTopic.trim()) return;
    setIsLoading(true);
    setGeneratedArticle(null);
    try {
      const ai = new GoogleGenAI();
      const prompt = `Write a concise, actionable real estate agent playbook note on: "${aiTopic}".`;
      const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      setGeneratedArticle({ title: `Playbook: ${aiTopic}`, content: result.text || '' });
    } catch {
      setGeneratedArticle({
        title: `Playbook: ${aiTopic}`,
        content: `Key best practices for ${aiTopic}: verify deed registry & off-grid utilities upfront, include clear square-meter pricing benchmarks, and respond to tour inquiries within 15 minutes.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 space-y-6">
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          AI Agent Playbook Assistant
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="Ask for a playbook e.g., Staging coastal villas for diaspora buyers"
            className="flex-1 px-3.5 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            onClick={handleGenerateArticle}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold bg-[#0F2D25] text-white rounded-lg hover:bg-[#173f34] inline-flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            <CpuChipIcon className="w-4 h-4 text-[#C9A35D]" />
            {isLoading ? 'Generating...' : 'Generate Guide'}
          </button>
        </div>
        {generatedArticle && (
          <div className="mt-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{generatedArticle.title}</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {generatedArticle.content}
            </p>
          </div>
        )}
      </div>

      <div>
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search knowledge base articles..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {filteredArticles.map((article) => (
            <details key={article.id} className="p-4 bg-white dark:bg-slate-900 cursor-pointer group">
              <summary className="font-semibold text-sm text-slate-800 dark:text-slate-200 list-none flex items-center justify-between">
                <span>{article.title}</span>
                <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                {article.content}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

const CommunityForum: React.FC<{
  posts: ForumPost[];
  onNewPost: () => void;
  onPostClick: (post: ForumPost) => void;
}> = ({ posts, onNewPost, onPostClick }) => (
  <div className="p-5 sm:p-6">
    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
      <h3 className="text-base font-semibold text-slate-900 dark:text-white font-sans">Brokerage Discussions</h3>
      <button
        onClick={onNewPost}
        className="bg-[#0F2D25] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#173f34] self-start sm:self-auto"
      >
        + New Topic
      </button>
    </div>
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-800/70 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="py-3 px-4 text-left font-semibold">Topic</th>
            <th className="py-3 px-4 text-right font-semibold">Replies</th>
            <th className="py-3 px-4 text-right font-semibold">Views</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {posts.map((post) => (
            <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <td className="py-3 px-4">
                <button
                  onClick={() => onPostClick(post)}
                  className="font-semibold text-slate-900 dark:text-white hover:underline text-left"
                >
                  {post.title}
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {post.author} · {new Date(post.timestamp).toLocaleDateString()}
                </p>
              </td>
              <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                {post.replies}
              </td>
              <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                {post.views}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AgentSupportPage;
