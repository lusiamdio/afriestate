import React, { useState } from 'react';
import { CloseIcon } from './icons/NavIcons';
import { SparklesIcon } from './icons/ActionIcons';

interface LifestyleMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchFound: (neighborhoodId: string) => void;
}

const GLOBAL_QUESTIONS = [
    {
        question: "Which continent appeals to you most?",
        options: ["Europe", "Asia", "Africa", "Americas"],
        key: 'continent'
    },
    {
        question: "What climate do you prefer?",
        options: ["Warm & Tropical", "Four Seasons", "Cool & Crisp", "Hot & Arid"],
        key: 'climate'
    },
    {
        question: "What is your budget level?",
        options: ["Affordable ($)", "Mid-Range ($$)", "Luxury ($$$)"],
        key: 'budget'
    },
    {
        question: "What is the most important factor for you?",
        options: ["Safety & Healthcare", "Nightlife & Culture", "Nature & Outdoors", "Career & Tech"],
        key: 'factor'
    },
    {
        question: "What pace of life are you looking for?",
        options: ["Fast-paced & Energetic", "Balanced & Relaxed", "Quiet & Serene"],
        key: 'pace'
    }
];

const BEST_CITIES = [
    { name: "Tokyo, Japan", continent: "Asia", climate: "Four Seasons", budget: "Mid-Range ($$)", factor: "Career & Tech", pace: "Fast-paced & Energetic", description: "High tech, incredible safety, and a fast-paced urban lifestyle." },
    { name: "Vienna, Austria", continent: "Europe", climate: "Cool & Crisp", budget: "Mid-Range ($$)", factor: "Safety & Healthcare", pace: "Balanced & Relaxed", description: "Top safety, great healthcare, rich culture, and excellent quality of life." },
    { name: "Dubai, UAE", continent: "Asia", climate: "Hot & Arid", budget: "Luxury ($$$)", factor: "Career & Tech", pace: "Fast-paced & Energetic", description: "Luxury living, tax-free income, and incredible modern infrastructure." },
    { name: "Cape Town, South Africa", continent: "Africa", climate: "Warm & Tropical", budget: "Mid-Range ($$)", factor: "Nature & Outdoors", pace: "Balanced & Relaxed", description: "Amazing nature, outdoors, beautiful beaches, and vibrant culture." },
    { name: "Bali, Indonesia", continent: "Asia", climate: "Warm & Tropical", budget: "Affordable ($)", factor: "Nature & Outdoors", pace: "Balanced & Relaxed", description: "Affordable tropical living, rich culture, and a relaxed lifestyle." },
    { name: "Singapore", continent: "Asia", climate: "Warm & Tropical", budget: "Luxury ($$$)", factor: "Safety & Healthcare", pace: "Fast-paced & Energetic", description: "World-class safety, high-tech infrastructure, and a bustling economy." },
    { name: "Medellín, Colombia", continent: "Americas", climate: "Warm & Tropical", budget: "Affordable ($)", factor: "Nightlife & Culture", pace: "Balanced & Relaxed", description: "Known as the 'City of Eternal Spring', offering great weather, affordability, and culture." },
    { name: "Lisbon, Portugal", continent: "Europe", climate: "Warm & Tropical", budget: "Mid-Range ($$)", factor: "Nightlife & Culture", pace: "Balanced & Relaxed", description: "Sun-drenched, historic, with an amazing food scene and laid-back vibe." },
    { name: "Zurich, Switzerland", continent: "Europe", climate: "Four Seasons", budget: "Luxury ($$$)", factor: "Safety & Healthcare", pace: "Quiet & Serene", description: "Pristine nature, unmatched safety, and extreme economic stability." },
    { name: "Kigali, Rwanda", continent: "Africa", climate: "Warm & Tropical", budget: "Affordable ($)", factor: "Safety & Healthcare", pace: "Quiet & Serene", description: "One of the safest and cleanest cities in Africa, with lush hills and a serene environment." },
    { name: "New York City, USA", continent: "Americas", climate: "Four Seasons", budget: "Luxury ($$$)", factor: "Career & Tech", pace: "Fast-paced & Energetic", description: "The city that never sleeps, offering unmatched career opportunities and culture." },
    { name: "Vancouver, Canada", continent: "Americas", climate: "Cool & Crisp", budget: "Luxury ($$$)", factor: "Nature & Outdoors", pace: "Balanced & Relaxed", description: "Stunning mountains and ocean views, highly livable, with great focus on the outdoors." },
    { name: "Taipei, Taiwan", continent: "Asia", climate: "Warm & Tropical", budget: "Mid-Range ($$)", factor: "Safety & Healthcare", pace: "Balanced & Relaxed", description: "Extremely safe, world-leading healthcare, and an incredible street food culture." },
    { name: "Barcelona, Spain", continent: "Europe", climate: "Warm & Tropical", budget: "Mid-Range ($$)", factor: "Nightlife & Culture", pace: "Fast-paced & Energetic", description: "Beautiful beaches, unique architecture, and a vibrant nightlife scene." },
    { name: "Marrakech, Morocco", continent: "Africa", climate: "Hot & Arid", budget: "Affordable ($)", factor: "Nightlife & Culture", pace: "Fast-paced & Energetic", description: "Immersive culture, bustling souks, and stunning historical architecture." }
];

const WORST_CITIES = [
    { name: "Caracas, Venezuela", continent: "Americas", climate: "Warm & Tropical", description: "Extreme economic instability, poor safety, and failing infrastructure." },
    { name: "Norilsk, Russia", continent: "Asia", climate: "Cool & Crisp", description: "Extremely cold, severe industrial pollution, and very isolated." },
    { name: "Damascus, Syria", continent: "Asia", climate: "Hot & Arid", description: "Severe conflict, low safety, and heavily damaged infrastructure." },
    { name: "Luanda, Angola", continent: "Africa", climate: "Warm & Tropical", description: "Extremely high cost of living with limited infrastructure and high inequality." },
    { name: "Port Moresby, Papua New Guinea", continent: "Asia", climate: "Warm & Tropical", description: "Very high crime rates, lack of infrastructure, and challenging living conditions." },
    { name: "Dhaka, Bangladesh", continent: "Asia", climate: "Warm & Tropical", description: "Extreme overpopulation, severe traffic congestion, and heavy air pollution." },
    { name: "Lagos, Nigeria", continent: "Africa", climate: "Warm & Tropical", description: "Though an economic hub, it suffers from extreme traffic, unreliable power, and overcrowding." }
];

const LifestyleMatcherModal: React.FC<LifestyleMatcherModalProps> = ({ isOpen, onClose, onMatchFound }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [results, setResults] = useState<{best: any[], worst: any} | null>(null);

    const handleAnswer = (key: string, value: string) => {
        const newAnswers = { ...answers, [key]: value };
        setAnswers(newAnswers);
        if (step < GLOBAL_QUESTIONS.length - 1) {
            setStep(step + 1);
        } else {
            calculateMatch(newAnswers);
            setStep(step + 1);
        }
    };
    
    const calculateMatch = (finalAnswers: Record<string, string>) => {
        let bestScores = BEST_CITIES.map(city => {
            let score = 0;
            if (city.continent === finalAnswers.continent) score += 2;
            if (city.climate === finalAnswers.climate) score += 2;
            if (city.budget === finalAnswers.budget) score += 2;
            if (city.factor === finalAnswers.factor) score += 3;
            if (city.pace === finalAnswers.pace) score += 1;
            // Add a small random tie-breaker
            score += Math.random() * 0.1;
            return { ...city, score };
        });

        bestScores.sort((a, b) => b.score - a.score);
        const top3 = bestScores.slice(0, 3);

        let worstScores = WORST_CITIES.map(city => {
            let score = 0;
            if (city.continent === finalAnswers.continent) score += 3;
            if (city.climate === finalAnswers.climate) score += 2;
            score += Math.random() * 0.1;
            return { ...city, score };
        });
        worstScores.sort((a, b) => b.score - a.score);
        const worstMatch = worstScores[0];

        setResults({
            best: top3,
            worst: worstMatch
        });
    };

    const resetQuiz = () => {
        setStep(0);
        setAnswers({});
        setResults(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[120] p-4" onClick={onClose}>
            <div 
                className="glass-panel rounded-xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale bg-white dark:bg-slate-900" 
                onClick={e => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-brand-dark dark:text-white">Find Your Perfect Global Destination</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-8 min-h-[300px]">
                    {step < GLOBAL_QUESTIONS.length ? (
                        <div>
                             <p className="text-sm font-semibold text-brand-primary">Question {step + 1} of {GLOBAL_QUESTIONS.length}</p>
                             <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{GLOBAL_QUESTIONS[step].question}</h3>
                             <div className="mt-6 space-y-3">
                                {GLOBAL_QUESTIONS[step].options.map(option => (
                                    <button 
                                        key={option}
                                        onClick={() => handleAnswer(GLOBAL_QUESTIONS[step].key, option)}
                                        className="w-full text-left p-4 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-brand-light dark:hover:bg-slate-800 hover:border-brand-primary transition-colors font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        {option}
                                    </button>
                                ))}
                             </div>
                        </div>
                    ) : (
                        <div className="text-left">
                            <div className="flex items-center gap-3 mb-6">
                                <SparklesIcon className="w-8 h-8 text-brand-primary" />
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Your Global Matches</h3>
                            </div>
                            
                            {results && (
                                <div className="space-y-6">
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-6 rounded-2xl">
                                        <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-sm mb-4">Top 3 Recommended Destinations</p>
                                        <div className="space-y-4 shadow-sm border border-emerald-100 dark:border-emerald-800 bg-white dark:bg-slate-800 rounded-xl overflow-hidden divide-y divide-emerald-50 dark:divide-emerald-800/50">
                                            {results.best.map((city, index) => (
                                                <div key={city.name} className="p-4 flex gap-4 items-start hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold flex flex-shrink-0 items-center justify-center text-lg">{index + 1}</div>
                                                    <div>
                                                        <p className="text-xl font-black text-emerald-900 dark:text-emerald-100 mb-1">{city.name}</p>
                                                        <p className="text-emerald-800 dark:text-emerald-200 text-sm mb-2">{city.description}</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded text-xs font-semibold">{city.climate}</span>
                                                            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded text-xs font-semibold">{city.budget}</span>
                                                            <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded text-xs font-semibold">{city.factor}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-6 rounded-2xl">
                                        <p className="text-red-500 font-bold uppercase tracking-wider text-sm mb-2">Destination to Avoid</p>
                                        <p className="text-xl font-bold text-red-950 dark:text-red-100 mb-1">{results.worst.name}</p>
                                        <p className="text-red-800 dark:text-red-200 text-sm">{results.worst.description}</p>
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <button onClick={resetQuiz} className="flex-1 px-6 py-3 font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700">Retake Quiz</button>
                                        <button onClick={onClose} className="flex-1 px-6 py-3 font-semibold bg-brand-primary text-white rounded-xl hover:bg-opacity-90">Close</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale {
                    animation: fadeInScale 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default LifestyleMatcherModal;
