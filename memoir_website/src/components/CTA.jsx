import { HiOutlineArrowRight } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

const CTA = () => {
  const ctaRef = useScrollAnimation();
  const navigate = useNavigate();

  const handleStartFreeTrial = () => {
    navigate('/upload', { viewTransition: true });
  };

  const handleViewPricing = () => {
    // Placeholder for pricing page/modal
    console.log('Pricing clicked - pricing page or modal can be added here');
  };

  return (
    <section ref={ctaRef} className="py-16 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--accent-color)' }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight" style={{ color: 'var(--bg-primary)' }}>
          Ready to Transform Your Notes?
        </h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--bg-primary)', opacity: '0.9' }}>
        Be among the first to transform your note-taking experience with Memoir — built for students and professionals rethinking how ideas are captured.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleStartFreeTrial}
            className="px-8 py-3 rounded-[20px] text-lg font-bold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            style={{ 
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--accent-color)'
            }}
          >
            Get Started
            <HiOutlineArrowRight 
              className="w-5 h-5" 
              style={{ color: 'var(--accent-color)' }}
            />
          </button>
          {/* <button 
            onClick={handleViewPricing}
            className="px-8 py-3 rounded-[20px] text-lg font-bold hover:opacity-80 transition-all duration-200"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--bg-primary)',
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: 'var(--bg-primary)'
            }}
          >
            View Pricing
          </button> */}
        </div>
        {/* <p className="text-sm mt-6" style={{ color: 'var(--bg-primary)', opacity: '0.7' }}>
          No credit card required • 7-day free trial • Cancel anytime
        </p> */}
      </div>
    </section>
  );
};

export default CTA; 