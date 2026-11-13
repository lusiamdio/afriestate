import React, { useState, useMemo } from 'react';
import type { User, ForumPost, CoInvestmentDeal, ProfessionalContact, Property } from '../../../types';
import {
  FORUM_CATEGORIES,
  INVESTOR_FORUM_POSTS,
  CO_INVESTMENT_DEALS,
  PROFESSIONAL_CONTACTS,
  ALL_PROPERTIES,
} from '../../../constants';
import { CommunityIcon, BriefcaseIcon, HandshakeIcon } from '../../icons/InvestorDashboardIcons';
import { StarIcon } from '../../icons/ActionIcons';
import NewPostModal from '../../NewPostModal';
import ForumPostDetailModal from '../../ForumPostDetailModal';
import CoInvestmentDealModal from '../../CoInvestmentDealModal';
import BookConsultationModal from '../../BookConsultationModal';
import { useToast } from '../../../contexts/ToastContext';
import { useCurrency } from '../../../contexts/CurrencyContext';

interface InvestorCommunityProps {
  user: User;
}

type CommunityTab = 'forum' | 'co-invest' | 'advisors';

interface DealWithProperty extends CoInvestmentDeal {
  property: Property;
}

export const InvestorCommunity: React.FC<InvestorCommunityProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<CommunityTab>('forum');
  const [posts, setPosts] = useState<ForumPost[]>(INVESTOR_FORUM_POSTS);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealWithProperty | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalContact | null>(null);
  const { addToast } = useToast();

  const handleAddPost = (post: { title: string; content: string }) => {
    const newPost: ForumPost = {
      ...post,
      id: `ifp_${Date.now()}`,
      author: user.username,
      timestamp: Date.now(),
      replies: 0,
      views: 0,
      category: 'General',
    };
    setPosts((prev) => [newPost, ...prev]);
    setIsPostModalOpen(false);
    addToast('Discussion thread published to investor forum.', 'success');
  };

  const handleViewDeal = (deal: CoInvestmentDeal) => {
    const property = ALL_PROPERTIES.find((p) => p.id === deal.propertyId);
    if (property) {
      setSelectedDeal({ ...deal, property });
      setIsDealModalOpen(true);
    } else {
      addToast('Property syndicate dossier unavailable.', 'error');
    }
  };

  const handleBookConsultation = (professional: ProfessionalContact) => {
    setSelectedProfessional(professional);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Investor Network
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Syndicate co-investments, diligence threads, and vetted advisory partners.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('forum')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'forum'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CommunityIcon className="w-4 h-4" /> Forums
          </button>
          <button
            onClick={() => setActiveTab('co-invest')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'co-invest'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HandshakeIcon className="w-4 h-4" /> Co-Investment
          </button>
          <button
            onClick={() => setActiveTab('advisors')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'advisors'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BriefcaseIcon className="w-4 h-4" /> Advisors
          </button>
        </div>
      </div>

      {activeTab === 'forum' && (
        <InvestorForums posts={posts} onNewPost={() => setIsPostModalOpen(true)} onPostClick={setSelectedPost} />
      )}
      {activeTab === 'co-invest' && <CoInvestmentOpportunities onViewDeal={handleViewDeal} />}
      {activeTab === 'advisors' && <AdvisorsConnect onBook={handleBookConsultation} />}

      <NewPostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} onAddPost={handleAddPost} />
      {selectedPost && (
        <ForumPostDetailModal isOpen={!!selectedPost} onClose={() => setSelectedPost(null)} post={selectedPost} />
      )}
      {selectedDeal && (
        <CoInvestmentDealModal isOpen={isDealModalOpen} onClose={() => setIsDealModalOpen(false)} deal={selectedDeal} />
      )}
      {selectedProfessional && (
        <BookConsultationModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          professional={selectedProfessional}
        />
      )}
    </div>
  );
};

const InvestorForums: React.FC<{
  posts: ForumPost[];
  onNewPost: () => void;
  onPostClick: (post: ForumPost) => void;
}> = ({ posts, onNewPost, onPostClick }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    if (!selectedCategory) return posts;
    return posts.filter((p) => p.category === selectedCategory);
  }, [posts, selectedCategory]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-sans">Recent Discussions</h3>
          <button
            onClick={onNewPost}
            className="bg-[#0F2D25] text-white font-semibold px-3.5 py-1.5 rounded-lg hover:bg-[#173f34] text-xs transition-colors whitespace-nowrap"
          >
            New Thread
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Topic</th>
                <th className="px-4 py-3 text-right font-medium">Replies</th>
                <th className="px-5 py-3 text-right font-medium">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPosts.map((post) => (
                <tr
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900 dark:text-white hover:underline">{post.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {post.author} · {new Date(post.timestamp).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
                    {post.replies}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
                    {post.views}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-sans">
            Topics
          </h3>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-semibold text-[#0F2D25] dark:text-emerald-400 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
        <div className="space-y-2">
          {FORUM_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedCategory === cat.name
                  ? 'border-[#0F2D25] bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <p className="text-xs font-semibold text-slate-900 dark:text-white">{cat.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{cat.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const CoInvestmentOpportunities: React.FC<{ onViewDeal: (deal: CoInvestmentDeal) => void }> = ({ onViewDeal }) => {
  const { formatCurrency } = useCurrency();
  const dealsWithProperties = useMemo(
    () =>
      CO_INVESTMENT_DEALS.map((deal) => ({
        ...deal,
        property: ALL_PROPERTIES.find((p) => p.id === deal.propertyId),
      })).filter((d): d is { property: Property } & CoInvestmentDeal => Boolean(d.property)),
    []
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {dealsWithProperties.map((deal) => {
        const pct = Math.min(100, Math.round((deal.fundedAmount / deal.fundingGoal) * 100));
        return (
          <div
            key={deal.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <img
                src={deal.property.images[0]}
                alt={deal.property.title}
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0 bg-slate-100 dark:bg-slate-800"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <h4 className="font-semibold text-base text-slate-900 dark:text-white truncate">{deal.property.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{deal.property.address.city}</p>
                <p className="text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold mt-2">
                  {pct}% subscribed · {deal.investorCount} LPs committed
                </p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono tabular-nums mb-1.5">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(deal.fundedAmount)} raised
                </span>
                <span className="text-slate-500 dark:text-slate-400">Target {formatCurrency(deal.fundingGoal)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-[#0F2D25] dark:bg-emerald-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <button
                onClick={() => onViewDeal(deal)}
                className="w-full mt-4 bg-[#0F2D25] text-white font-semibold py-2.5 rounded-lg hover:bg-[#173f34] text-xs transition-colors"
              >
                Review Syndicate Terms
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdvisorsConnect: React.FC<{ onBook: (pro: ProfessionalContact) => void }> = ({ onBook }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {PROFESSIONAL_CONTACTS.map((pro) => (
      <div
        key={pro.id}
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <img src={pro.image} alt={pro.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{pro.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{pro.specialty}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
            <StarIcon className="w-4 h-4 text-[#C9A35D]" />
            <span className="font-semibold">{pro.rating}</span>
            <span className="text-slate-400">({pro.reviewCount})</span>
          </div>
          <button
            onClick={() => onBook(pro)}
            className="bg-[#0F2D25] text-white font-semibold px-3.5 py-2 rounded-lg text-xs hover:bg-[#173f34] transition-colors whitespace-nowrap"
          >
            Schedule
          </button>
        </div>
      </div>
    ))}
  </div>
);