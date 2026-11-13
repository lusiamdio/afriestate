import React from 'react';
import type { BlogPost } from '../types';
import { useTranslations } from '../contexts/LanguageContext';

interface BlogSectionProps {
    posts: BlogPost[];
    onPostClick: (post: BlogPost) => void;
    isLoading: boolean;
}

const BlogCardSkeleton: React.FC = () => (
    <div className="bg-[#FAF8F5] dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden animate-pulse">
        <div className="w-full h-56 bg-slate-200 dark:bg-slate-700"></div>
        <div className="p-6">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-full mb-1"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
        </div>
    </div>
);

const BlogSection: React.FC<BlogSectionProps> = ({ posts, onPostClick, isLoading }) => {
    const { t } = useTranslations();

    return (
        <section id="blog" className="py-16 lg:py-24 bg-white dark:bg-slate-900">
            <div className="w-full px-4 sm:px-6 lg:px-10">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-brand-dark dark:text-white">{t.blog.title}</h2>
                    <p className="text-center text-slate-500 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
                        {t.blog.subtitle}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => <BlogCardSkeleton key={i} />)
                    ) : (
                        posts.map((post) => (
                            <div key={post.title} className="bg-[#FAF8F5] dark:bg-slate-800/80 rounded-2xl shadow-sm overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">
                                <div className="relative overflow-hidden">
                                    <img src={post.image} alt={post.title} className="w-full h-56 object-cover transform group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                                </div>
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="text-lg font-bold text-brand-dark dark:text-white mb-2">{post.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">By {post.author} on {post.date}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 flex-grow">{post.summary}</p>
                                    <button onClick={() => onPostClick(post)} className="font-semibold text-brand-primary dark:text-amber-300 hover:text-brand-dark dark:hover:text-white transition-colors mt-4 self-start">
                                        Read More &rarr;
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default BlogSection;