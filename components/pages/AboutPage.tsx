import React, { useEffect, useState } from 'react';
import { RocketLaunchIcon, TrophyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { EyeIcon, CpuChipIcon, CheckBadgeIcon, SparklesIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';

const FadeInSection: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => setVisible(entry.isIntersecting));
    });
    
    if (domRef.current) {
        observer.observe(domRef.current);
    }
    return () => {
        if (domRef.current) observer.unobserve(domRef.current);
    }
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

interface AboutPageProps {
  onExploreProperties: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onExploreProperties }) => {
  return (
    <div id="about" className="bg-brand-light text-brand-dark overflow-hidden font-sans">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Luxury African Estate" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-dark/70 mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <FadeInSection>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tight font-heading mb-6 drop-shadow-lg">
              Redefining <span className="text-brand-secondary">Real Estate</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-200 mt-6 max-w-3xl mx-auto font-light leading-relaxed">
              Empowering dreams across Africa with a world-class blend of technology, trust, and community.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24 px-6 relative bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeInSection>
              <div className="relative">
                <div className="absolute -inset-4 bg-brand-gold/20 rounded-t-full transform -rotate-3 z-0"></div>
                <img 
                  src="https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Our Heritage" 
                  className="relative z-10 w-full h-[600px] object-cover rounded-t-full shadow-2xl"
                />
              </div>
            </FadeInSection>
            <FadeInSection delay={200}>
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-1 bg-brand-primary"></div>
                  <span className="text-brand-primary font-bold tracking-widest uppercase text-sm">Our Story</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-heading font-bold mb-8 text-brand-dark leading-tight">
                  From a simple idea to a <span className="text-brand-secondary border-b-4 border-brand-secondary">Continental Movement</span>
                </h2>
                <div className="space-y-6 text-lg text-slate-600 font-light leading-relaxed">
                  <p>
                    AfriEstate was born from a powerful vision: to make real estate in Africa accessible, transparent, and undeniably beautiful for everyone. Our founders, rooted deeply in local communities, saw a gap between aspiring homeowners and quality properties.
                  </p>
                  <p>
                    What began as a localized project to connect landlords and tenants has evolved into an AI-powered, sophisticated platform. Today, we stand as the bridge connecting buyers, sellers, and global investors with tangible luxury and affordable opportunities alike.
                  </p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-24 bg-brand-primary text-white">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            <FadeInSection>
              <div className="group p-10 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-500 transform hover:-translate-y-2">
                <RocketLaunchIcon className="w-16 h-16 text-brand-secondary mb-8 transform group-hover:scale-110 transition-transform duration-500" />
                <h3 className="text-3xl font-heading font-bold mb-6">Our Mission</h3>
                <p className="text-xl text-slate-300 font-light leading-relaxed">
                  "To democratize property ownership by creating an inclusive, transparent, and exquisitely efficient marketplace for everyone."
                </p>
              </div>
            </FadeInSection>
            <FadeInSection delay={200}>
              <div className="group p-10 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-all duration-500 transform hover:-translate-y-2">
                <EyeIcon className="w-16 h-16 text-brand-secondary mb-8 transform group-hover:scale-110 transition-transform duration-500" />
                <h3 className="text-3xl font-heading font-bold mb-6">Our Vision</h3>
                <p className="text-xl text-slate-300 font-light leading-relaxed">
                  "To be Africa's premier real estate platform, where every transaction is an experience of security and every listing is a masterpiece."
                </p>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 px-6 bg-brand-light">
        <div className="container mx-auto max-w-7xl text-center">
            <FadeInSection>
              <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-12 h-1 bg-brand-secondary"></div>
                  <span className="text-brand-secondary font-bold tracking-widest uppercase text-sm">Core Principles</span>
                  <div className="w-12 h-1 bg-brand-secondary"></div>
              </div>
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-16 text-brand-dark">The Pillars of Our Success</h2>
            </FadeInSection>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: CheckBadgeIcon, title: "Integrity", desc: "Unwavering transparency and honesty in every interaction." },
                { icon: SparklesIcon, title: "Innovation", desc: "Leveraging cutting-edge tech to simplify complexity." },
                { icon: UserGroupIcon, title: "Community", desc: "Empowering local communities through inclusive housing." },
                { icon: TrophyIcon, title: "Excellence", desc: "Pursuing the highest standards in our platform and service." }
              ].map((val, i) => (
                <FadeInSection key={i} delay={i * 100}>
                  <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 hover:shadow-2xl transition-all duration-500 group h-full">
                    <div className="w-20 h-20 mx-auto bg-brand-light rounded-full flex items-center justify-center mb-6 group-hover:bg-brand-primary transition-colors duration-500">
                      <val.icon className="w-10 h-10 text-brand-primary group-hover:text-brand-secondary transition-colors duration-500" />
                    </div>
                    <h4 className="text-xl font-bold mb-4 font-heading">{val.title}</h4>
                    <p className="text-slate-500 leading-relaxed font-light">{val.desc}</p>
                  </div>
                </FadeInSection>
              ))}
            </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-brand-dark rounded-[3rem] p-12 lg:p-20 relative overflow-hidden text-center text-white">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-secondary rounded-full filter blur-[100px] opacity-20 -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-primary rounded-full filter blur-[100px] opacity-20 -ml-48 -mb-48"></div>
            
            <FadeInSection>
              <img 
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" 
                alt="Naledi Radebe" 
                className="w-40 h-40 object-cover rounded-full mx-auto border-4 border-brand-secondary shadow-2xl relative z-10"
              />
              <h3 className="text-3xl font-heading font-bold mt-8 mb-2 relative z-10">Naledi Radebe</h3>
              <p className="text-brand-secondary font-semibold tracking-widest uppercase text-sm mb-8 relative z-10">Founder & CEO</p>
              
              <p className="text-2xl md:text-3xl font-light italic text-slate-300 max-w-4xl mx-auto leading-relaxed relative z-10">
                "We didn't just build a platform; we built a promise. A promise that no matter who you are, the dream of owning a piece of this continent is within your reach. Technology is our tool, but community is our heart."
              </p>
            </FadeInSection>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-32 px-6 text-center relative overflow-hidden bg-brand-light">
          <FadeInSection>
            <h2 className="text-5xl md:text-7xl font-heading font-black text-brand-dark mb-8">Ready to <span className="text-brand-secondary">Begin?</span></h2>
            <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto mb-12">Join thousands of others discovering their next dream property with AfriEstate today.</p>
            <button onClick={onExploreProperties} className="bg-brand-primary text-white font-bold text-lg px-12 py-5 rounded-full hover:bg-brand-dark transition-all transform hover:-translate-y-1 shadow-2xl flex items-center gap-3 mx-auto">
              Explore Properties <ArrowRightIcon className="w-5 h-5"/>
            </button>
          </FadeInSection>
      </section>
    </div>
  );
};

export default AboutPage;