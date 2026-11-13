import React, { useState, useEffect, useMemo } from 'react';
import type { Property, User, Review, AgentProfile } from '../../../types';
import { PropertyStatus } from '../../../types';
import { TwitterIcon, LinkedInIcon, FacebookIcon } from '../../icons/SocialIcons';
import { StarIcon, UserCircleIcon, StarIconOutline } from '../../icons/ActionIcons';
import { useCurrency } from '../../../contexts/CurrencyContext';
import { useToast } from '../../../contexts/ToastContext';

interface AgentProfilePageProps {
  user: User;
  allProperties: Property[];
  agentProfile: AgentProfile | null;
  agentReviews: Review[];
  onUpdateAgentProfile: (profile: AgentProfile) => void;
}

const socialIcons: Record<string, React.ElementType> = {
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
  facebook: FacebookIcon,
};

const StarRating: React.FC<{ rating: number; className?: string }> = ({ rating, className = 'w-4 h-4' }) => (
  <div className="flex items-center gap-0.5">
    {[...Array(5)].map((_, i) =>
      i < Math.round(rating) ? (
        <StarIcon key={i} className={`${className} text-amber-400`} />
      ) : (
        <StarIconOutline key={i} className={`${className} text-slate-300 dark:text-slate-600`} />
      )
    )}
  </div>
);

const AgentProfilePage: React.FC<AgentProfilePageProps> = ({
  user,
  allProperties,
  agentProfile,
  agentReviews,
  onUpdateAgentProfile,
}) => {
  const { formatCurrency } = useCurrency();
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<AgentProfile | null>(agentProfile);
  const [activePropertyTab, setActivePropertyTab] = useState<'active' | 'sold'>('active');

  useEffect(() => {
    setFormData(agentProfile);
  }, [agentProfile]);

  const userProperties = useMemo(
    () => allProperties.filter((p) => p.agent.name === user.username),
    [allProperties, user.username]
  );

  const activeProperties = useMemo(
    () => userProperties.filter((p) => p.status === PropertyStatus.ACTIVE),
    [userProperties]
  );
  const soldProperties = useMemo(
    () => userProperties.filter((p) => p.status === PropertyStatus.SOLD),
    [userProperties]
  );

  const { averageRating, reviewCount } = useMemo(() => {
    const count = agentReviews.length;
    if (count === 0) return { averageRating: 0, reviewCount: 0 };
    const totalRating = agentReviews.reduce((sum, r) => sum + r.rating, 0);
    return {
      averageRating: parseFloat((totalRating / count).toFixed(1)),
      reviewCount: count,
    };
  }, [agentReviews]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    if (name.startsWith('socials.')) {
      const socialKey = name.split('.')[1] as keyof AgentProfile['socials'];
      setFormData({ ...formData, socials: { ...formData.socials, [socialKey]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = () => {
    if (formData) {
      onUpdateAgentProfile(formData);
      addToast('Agent profile updated.', 'success');
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData(agentProfile);
    setIsEditing(false);
  };

  if (!agentProfile || !formData) {
    return <div className="p-8 text-sm text-slate-500">Loading agent profile...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-[1400px] mx-auto">
      {/* Left Profile Card */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 lg:sticky lg:top-6">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
            Agent Identity
          </h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold text-[#0F2D25] dark:text-amber-300 hover:underline"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100 dark:border-slate-800">
          <img
            src={formData.profilePicture}
            alt={formData.username}
            className="w-20 h-20 rounded-full object-cover border-2 border-[#C9A35D] mb-3"
          />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{formData.username}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Verified Brokerage Partner</p>
        </div>

        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Biography</label>
          {isEditing ? (
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full text-sm text-slate-700 dark:text-slate-200 mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
            />
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{formData.bio}</p>
          )}
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Email</label>
            {isEditing ? (
              <input
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full text-sm mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{formData.email}</p>
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Direct Phone</label>
            {isEditing ? (
              <input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full text-sm mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            ) : (
              <p className="text-sm font-mono text-slate-700 dark:text-slate-300 mt-0.5">{formData.phone}</p>
            )}
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Social Channels</label>
          <div className="mt-2 space-y-2">
            {Object.keys(socialIcons).map((key) =>
              isEditing ? (
                <input
                  key={key}
                  name={`socials.${key}`}
                  value={formData.socials[key as keyof typeof formData.socials] || ''}
                  onChange={handleInputChange}
                  placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} URL`}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              ) : (
                formData.socials[key as keyof typeof formData.socials] && (
                  <a
                    key={key}
                    href={formData.socials[key as keyof typeof formData.socials]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-amber-300 hover:underline"
                  >
                    {React.createElement(socialIcons[key], { className: 'w-4 h-4' })}
                    <span className="truncate">{formData.socials[key as keyof typeof formData.socials]}</span>
                  </a>
                )
              )
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleCancel}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold bg-[#0F2D25] text-white rounded-lg hover:bg-[#173f34]"
            >
              Save Profile
            </button>
          </div>
        )}
      </div>

      {/* Right Column */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white font-sans">Portfolio Showcase</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setActivePropertyTab('active')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activePropertyTab === 'active'
                    ? 'bg-[#0F2D25] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Active ({activeProperties.length})
              </button>
              <button
                onClick={() => setActivePropertyTab('sold')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  activePropertyTab === 'sold'
                    ? 'bg-[#0F2D25] text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Closed ({soldProperties.length})
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(activePropertyTab === 'active' ? activeProperties : soldProperties).map((prop) => (
              <div key={prop.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <img
                  src={prop.images[0] || '/images/house_suburbs_1779978598551.png'}
                  alt={prop.title}
                  className="w-14 h-12 object-cover rounded-lg shrink-0 border border-slate-200 dark:border-slate-700"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{prop.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {prop.address.street}, {prop.address.city}
                  </p>
                </div>
                <p className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white shrink-0">
                  {formatCurrency(prop.price)}
                </p>
              </div>
            ))}
            {(activePropertyTab === 'active' ? activeProperties : soldProperties).length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 py-6 text-center">
                No {activePropertyTab} properties recorded.
              </p>
            )}
          </div>
        </div>

        {/* Client Reviews */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white font-sans">Client Reviews</h3>
            {agentReviews.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {averageRating}
                </span>
                <StarRating rating={averageRating} />
                <span className="text-xs text-slate-500">({reviewCount})</span>
              </div>
            )}
          </div>

          {agentReviews.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {agentReviews.map((review) => (
                <div key={review.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex items-center gap-2">
                      <UserCircleIcon className="w-5 h-5 text-slate-400" />
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">
                        {review.reviewerUsername}
                      </span>
                    </div>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {review.comment}
                  </p>
                  <p className="text-[11px] font-mono text-slate-400 mt-1.5">
                    {new Date(review.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
              Verified client reviews appear here once transactions complete.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentProfilePage;