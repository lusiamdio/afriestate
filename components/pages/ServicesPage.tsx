
import React, { useState, useEffect, useRef } from 'react';
import { BanknotesIcon, ShieldCheckIcon, TruckIcon, HomeIcon as HomeServiceIcon, CpuChipIcon, CheckBadgeIcon, UserGroupIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { TrophyIcon } from '@heroicons/react/24/outline';

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

const FadeInSection: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
            setVisible(true);
        }
      });
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

interface ServicesPageProps {
  onServiceClick: (service: string) => void;
}

const ServiceDetailCard: React.FC<{
    icon: React.ElementType;
    title: string;
    subheading: string;
    description: string;
    features: string[];
    ctaText: string;
    serviceKey: string;
    onCtaClick: (service: string) => void;
}> = ({ icon: Icon, title, subheading, description, features, ctaText, serviceKey, onCtaClick }) => (
    <div className="bg-white p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-slate-100 group flex flex-col h-full">
        <div className="w-16 h-16 rounded-2xl bg-brand-light flex items-center justify-center mb-8 group-hover:bg-brand-primary transition-colors duration-500">
            <Icon className="w-8 h-8 text-brand-primary group-hover:text-brand-secondary transition-colors duration-500" />
        </div>
        <h3 className="text-3xl font-heading font-bold text-brand-dark mb-2">{title}</h3>
        <p className="text-sm font-bold tracking-widest uppercase text-brand-secondary mb-6">{subheading}</p>
        <p className="text-slate-600 leading-relaxed font-light mb-8 flex-grow">{description}</p>
        <ul className="mb-10 space-y-4">
            {features.map((feature, i) => (
                <li key={i} className="flex items-start">
                    <CheckBadgeIcon className="w-6 h-6 text-brand-success mr-3 flex-shrink-0" />
                    <span className="text-slate-700 font-light">{feature}</span>
                </li>
            ))}
        </ul>
        <button onClick={() => onCtaClick(serviceKey)} className="w-full bg-brand-light text-brand-dark font-bold py-4 rounded-xl hover:bg-brand-primary hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
            {ctaText} <ArrowRightIcon className="w-5 h-5"/>
        </button>
    </div>
);

const ProcessStep: React.FC<{ number: string, title: string, description: string }> = ({ number, title, description }) => (
    <div className="relative pl-12">
        <div className="absolute top-0 left-0 w-10 h-10 bg-brand-primary text-brand-secondary font-bold text-xl rounded-full flex items-center justify-center shadow-lg">
            {number}
        </div>
        <h3 className="font-bold text-xl text-brand-dark mb-2 font-heading">{title}</h3>
        <p className="text-slate-500 leading-relaxed font-light">{description}</p>
    </div>
);

const FaqItem: React.FC<{ question: string, children: React.ReactNode }> = ({ question, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-slate-200">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left py-6 group">
                <h4 className="font-bold text-lg text-brand-dark group-hover:text-brand-primary transition-colors">{question}</h4>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-brand-primary text-white' : 'bg-brand-light text-brand-dark group-hover:bg-slate-200'}`}>
                    {isOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </div>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                <div className="text-slate-600 font-light leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
};

const ServicesPage: React.FC<ServicesPageProps> = ({ onServiceClick }) => {
  return (
    <div id="services" className="bg-brand-light text-brand-dark overflow-hidden font-sans">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Premium Real Estate Services" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-brand-dark/80 mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-16">
          <FadeInSection>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight font-heading mb-6">
              Exceptional <span className="text-brand-secondary">Services</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mt-6 max-w-3xl mx-auto font-light leading-relaxed">
              Empowering every stage of your real estate journey with comprehensive, secure, and world-class solutions.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="py-24">
        <div className="container mx-auto px-6 space-y-32 max-w-7xl">
          
          {/* What We Offer */}
          <section>
            <FadeInSection>
              <div className="text-center mb-16">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="w-12 h-1 bg-brand-secondary"></div>
                    <span className="text-brand-secondary font-bold tracking-widest uppercase text-sm">What We Offer</span>
                    <div className="w-12 h-1 bg-brand-secondary"></div>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold font-heading text-brand-dark mb-6">Integrated Solutions</h2>
                  <p className="text-xl text-slate-500 font-light max-w-2xl mx-auto">
                    From securing financing to managing your rental, our services are designed to simplify complexity and maximize opportunity.
                  </p>
              </div>
            </FadeInSection>
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 xl:gap-12">
              <FadeInSection delay={100}>
                <ServiceDetailCard
                  icon={BanknotesIcon}
                  title="Home Loans"
                  subheading="Financial Services"
                  description="We connect you with trusted lenders to find competitive mortgage rates, getting you pre-approved to make your offer stronger."
                  features={["Verified lender network", "Pre-approval assessment", "Streamlined application process"]}
                  ctaText="Explore Lenders"
                  serviceKey="Financial Services"
                  onCtaClick={onServiceClick}
                />
              </FadeInSection>
              <FadeInSection delay={200}>
                <ServiceDetailCard
                  icon={HomeServiceIcon}
                  title="Property Management"
                  subheading="Rental Services"
                  description="Tenant and landlord solutions ensuring a safe and reliable rental experience, from deposit management to online rent payments."
                  features={["Secure deposit management", "Automated rent collection", "Reliable tenant screening"]}
                  ctaText="Find Property Managers"
                  serviceKey="Property Management"
                  onCtaClick={onServiceClick}
                />
              </FadeInSection>
              <FadeInSection delay={300}>
                <ServiceDetailCard
                  icon={ShieldCheckIcon}
                  title="Asset Insurance"
                  subheading="Property Protection"
                  description="Protect your most valuable asset. Our insurance partners provide competitive quotes for comprehensive home and contents insurance."
                  features={["Compare top insurer quotes", "Comprehensive belongings protection", "Financial security assurance"]}
                  ctaText="Get an Insurance Quote"
                  serviceKey="Insurance"
                  onCtaClick={onServiceClick}
                />
              </FadeInSection>
              <FadeInSection delay={400}>
                <ServiceDetailCard
                  icon={TruckIcon}
                  title="Moving & Logistics"
                  subheading="Relocation Services"
                  description="We help you get settled by providing access to quotes from reliable, vetted moving companies making your transition seamless."
                  features={["Trusted moving partners", "Stress-free logistics planning", "Local & long-distance support"]}
                  ctaText="Find Movers"
                  serviceKey="Moving Services"
                  onCtaClick={onServiceClick}
                />
              </FadeInSection>
            </div>
          </section>

          {/* Our Process & Why Choose Us (Side by Side on Large Screens) */}
          <section className="grid lg:grid-cols-2 gap-16 items-start">
              {/* Our Process */}
              <div>
                <FadeInSection>
                    <h2 className="text-4xl font-bold font-heading text-brand-dark mb-12">Our Proven Process</h2>
                    <div className="space-y-12 relative">
                    <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-brand-gold/30"></div>
                    <ProcessStep number="1" title="Discovery" description="We begin by understanding your unique needs, goals, and financial situation through an initial consultation."/>
                    <ProcessStep number="2" title="Strategy" description="We develop a customized plan, whether for securing loans, managing properties, or relocating."/>
                    <ProcessStep number="3" title="Execution" description="Our professional network gets to work, handling complex applications and logistics efficiently."/>
                    <ProcessStep number="4" title="Delivery" description="We ensure a smooth final delivery of the service with ongoing support to guarantee satisfaction."/>
                    </div>
                </FadeInSection>
              </div>

              {/* Why Choose Us */}
              <div>
                <FadeInSection delay={200}>
                    <h2 className="text-4xl font-bold font-heading text-brand-dark mb-12">The AfriEstate Advantage</h2>
                    <div className="space-y-8">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex gap-6 items-start">
                            <TrophyIcon className="w-12 h-12 text-brand-secondary flex-shrink-0"/>
                            <div>
                                <h3 className="font-bold text-xl mb-2 font-heading">Credentialed Expertise</h3>
                                <p className="text-slate-500 font-light leading-relaxed">Built on years of expertise with a curated network of vetted professionals ensuring you are in safe hands.</p>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex gap-6 items-start">
                            <CpuChipIcon className="w-12 h-12 text-brand-secondary flex-shrink-0"/>
                            <div>
                                <h3 className="font-bold text-xl mb-2 font-heading">Innovation Driven</h3>
                                <p className="text-slate-500 font-light leading-relaxed">Leveraging cutting-edge AI for personalized matches, market insights, and tools that provide a competitive edge.</p>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex gap-6 items-start">
                            <UserGroupIcon className="w-12 h-12 text-brand-secondary flex-shrink-0"/>
                            <div>
                                <h3 className="font-bold text-xl mb-2 font-heading">Client-Centric</h3>
                                <p className="text-slate-500 font-light leading-relaxed">Your success is our success. Everything is designed to be user-friendly, transparent, and immensely supportive.</p>
                            </div>
                        </div>
                    </div>
                </FadeInSection>
              </div>
          </section>

          {/* Client Results Banner */}
          <section className="relative overflow-hidden rounded-[3rem] text-white">
              <div className="absolute inset-0 bg-brand-primary"></div>
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-secondary rounded-full filter blur-[120px] opacity-20 -mr-[400px] -mt-[400px]"></div>
              
              <div className="relative z-10 py-20 px-6">
                <FadeInSection>
                    <h2 className="text-4xl font-bold font-heading text-center mb-16">Metrics of Excellence</h2>
                    <div className="grid md:grid-cols-3 gap-12 text-center max-w-5xl mx-auto">
                        <div>
                            <p className="text-6xl font-black text-brand-secondary mb-4 drop-shadow-md">30%</p>
                            <p className="text-xl font-light text-slate-200 uppercase tracking-widest">Faster Processing</p>
                        </div>
                        <div>
                            <p className="text-6xl font-black text-brand-secondary mb-4 drop-shadow-md">2.5k+</p>
                            <p className="text-xl font-light text-slate-200 uppercase tracking-widest">Verified Partners</p>
                        </div>
                        <div>
                            <p className="text-6xl font-black text-brand-secondary mb-4 drop-shadow-md">98%</p>
                            <p className="text-xl font-light text-slate-200 uppercase tracking-widest">Client Satisfaction</p>
                        </div>
                    </div>
                </FadeInSection>
              </div>
          </section>

          {/* FAQ & CTA Section */}
          <section className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <FadeInSection>
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-1 bg-brand-primary"></div>
                    <span className="text-brand-primary font-bold tracking-widest uppercase text-sm">Insights</span>
                </div>
                <h2 className="text-4xl font-bold font-heading text-brand-dark mb-10">Frequently Asked</h2>
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
                    <FaqItem question="Are your service providers vetted?">
                        Absolutely. Every professional in our network undergoes a rigorous verification process, including credential checks and continuous peer reviews.
                    </FaqItem>
                    <FaqItem question="How do I start a home loan application?">
                        Use our "Explore Lenders" tool to compare rates and initiate a secure pre-approval process directly through our unified platform.
                    </FaqItem>
                    <FaqItem question="What are the fee structures?">
                        Browsing and initial connections are completely free. Individual service providers maintain competitive, transparent fee structures clearly outlined before commitment.
                    </FaqItem>
                     <FaqItem question="Is my data encrypted?">
                        We deploy bank-grade encryption and stringent privacy protocols to protect all sensitive information shared through AfriEstate.
                    </FaqItem>
                </div>
              </FadeInSection>
            </div>
            
            <div className="text-center bg-white p-16 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-gold/10 rounded-full blur-2xl"></div>
                <FadeInSection delay={200}>
                    <h2 className="text-4xl font-bold font-heading text-brand-dark mb-6">Ready to Elevate?</h2>
                    <p className="text-lg text-slate-500 font-light mb-10 max-w-md mx-auto">Contact our dedicated team today to begin your world-class real estate journey.</p>
                    <button onClick={() => onServiceClick('Legal Services')} className="bg-brand-primary text-white font-bold text-lg px-10 py-5 rounded-full hover:bg-brand-dark transition-all transform hover:-translate-y-1 shadow-2xl w-full sm:w-auto">
                        Book a Consultation
                    </button>
                </FadeInSection>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ServicesPage;