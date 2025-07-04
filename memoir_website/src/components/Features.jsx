import { HiOutlineDocumentText, HiOutlineArrowPathRoundedSquare, HiOutlineMicrophone, HiOutlineSparkles, HiOutlineBoltSlash, HiOutlineShieldCheck } from 'react-icons/hi2';
import { useScrollAnimation, useStaggeredAnimation } from '../hooks/useScrollAnimation';

const Features = () => {
  const titleRef = useScrollAnimation();
  const featuresRef = useStaggeredAnimation('.animate-item', 0.15);

  const features = [
    {
      title: "Intelligent Summarization",
      description: "AI automatically identifies and summarizes key points from your notes",
      icon: HiOutlineDocumentText
    },
    {
      title: "Auto-Sync",
      description: "Seamlessly sync your organized notes directly to your Notion workspace",
      icon: HiOutlineArrowPathRoundedSquare
    },
    {
      title: "Voice-to-Text",
      description: "Convert audio recordings and voice notes into structured text",
      icon: HiOutlineMicrophone
    },
    {
      title: "Smart Formatting",
      description: "Automatically format notes with proper headings, lists, and structure",
      icon: HiOutlineSparkles
    },
    {
      title: "Lightning Fast",
      description: "Process and organize your notes in seconds, not hours",
      icon: HiOutlineBoltSlash
    },
    {
      title: "Privacy First",
      description: "Your notes are processed securely and never stored permanently",
      icon: HiOutlineShieldCheck
    }
  ];

  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="w-full mx-auto">
        {/* Section Title */}
        <div ref={titleRef} className="text-center mb-12">
          <h2 className="text-3xl font-bold theme-text-primary mb-4">
            Powerful Features for Every Note
          </h2>
          <p className="text-lg theme-text-muted max-w-2xl mx-auto">
            Transform any note into a structured, searchable document with our AI-powered features
          </p>
        </div>

        {/* Features Grid */}
        <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index} 
                className="p-6 theme-bg-secondary rounded-lg transition-all duration-200 hover:shadow-lg group animate-item"
                style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border-color)' }}
                onMouseEnter={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-color)'}
              >
                <div className="mb-4">
                  <div className="w-12 h-12 theme-bg-tertiary rounded-lg flex items-center justify-center group-hover:opacity-80 transition-colors">
                    <IconComponent className="w-6 h-6 theme-accent-text theme-icon" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold theme-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="theme-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features; 