import { HiOutlineCloudArrowUp, HiOutlineCog6Tooth, HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';
import { useScrollAnimation, useStaggeredAnimation } from '../hooks/useScrollAnimation';

const HowItWorks = () => {
  const titleRef = useScrollAnimation();
  const stepsRef = useStaggeredAnimation('.animate-item', 0.2);

  const steps = [
    {
      id: 1,
      title: "Upload Your Notes",
      description: "Snap a photo or upload a file of your notes.",
      icon: HiOutlineCloudArrowUp,
      isLast: false
    },
    {
      id: 2,
      title: "AI Organizes and Structures", 
      description: "Our AI intelligently organizes your notes into a structured format.",
      icon: HiOutlineCog6Tooth,
      isLast: false
    },
    {
      id: 3,
      title: "Export to Notion",
      description: "Seamlessly export your organized notes directly to your Notion workspace.",
      icon: HiOutlineArrowRightOnRectangle,
      isLast: true
    }
  ];

  return (
    <section id="how-it-works" className="py-5 px-4 sm:px-6 lg:px-8">
      <div className="w-full mx-auto">
        {/* Section Title */}
        <div ref={titleRef} className="px-4 py-5 mb-3">
          <h2 className="text-[22px] font-bold theme-text-primary leading-tight">How It Works</h2>
        </div>

        {/* Vertical Timeline */}
        <div className="px-4 pb-3">
          <div ref={stepsRef} className="space-y-0">
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div key={step.id} className="relative flex items-start animate-item">
                  {/* Timeline Line and Icon */}
                  <div className="flex flex-col items-center mr-4">
                    {/* Icon/Indicator */}
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                      style={{ 
                        backgroundColor: 'var(--accent-color)',
                        color: 'var(--bg-primary)'
                      }}
                    >
                      <IconComponent 
                        className="w-4 h-4" 
                        style={{ 
                          color: 'var(--bg-primary)',
                          fill: 'var(--bg-primary)'
                        }}
                      />
                    </div>
                    
                    {/* Vertical Connector Line */}
                    {!step.isLast && (
                      <div className="w-0.5 h-16 mt-2" style={{ backgroundColor: 'var(--border-color)' }}></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <h3 className="text-base font-medium theme-text-primary mb-1 leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-base theme-text-muted leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 