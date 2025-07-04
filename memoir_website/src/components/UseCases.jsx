import { useState, useEffect, useRef } from 'react';
import { HiOutlineAcademicCap, HiOutlineBriefcase, HiOutlinePaintBrush, HiOutlineBeaker } from 'react-icons/hi2';
import { useScrollAnimation, useStaggeredAnimation } from '../hooks/useScrollAnimation';
import { gsap } from 'gsap';

const UseCases = () => {
  const [activeTab, setActiveTab] = useState(0);
  const sectionRef = useScrollAnimation();
  const tabsRef = useStaggeredAnimation('.animate-item', 0.1);
  const contentRef = useRef(null);
  const illustrationRef = useRef(null);

  const useCases = [
    {
      tab: "Students",
      icon: HiOutlineAcademicCap,
      title: "Transform Lecture Notes Into Study Guides",
      content: "Convert handwritten lecture notes into comprehensive study materials. Our AI identifies key concepts, creates summaries, and organizes information by topics - making exam preparation effortless.",
      illustration: "Student studying with organized notes"
    },
    {
      tab: "Professionals",
      icon: HiOutlineBriefcase,
      title: "Meeting Notes to Action Items",
      content: "Turn messy meeting notes into structured action plans. Our AI extracts key decisions, assigns tasks, and creates timelines - ensuring nothing falls through the cracks.",
      illustration: "Professional using organized meeting notes"
    },
    {
      tab: "Creatives",
      icon: HiOutlinePaintBrush,
      title: "Organize Creative Brainstorms",
      content: "Transform scattered creative ideas into organized project plans. Our AI categorizes concepts, identifies themes, and structures your creative process for maximum productivity.",
      illustration: "Creative professional organizing ideas"
    },
    {
      tab: "Researchers",
      icon: HiOutlineBeaker,
      title: "Research Notes to Structured Knowledge",
      content: "Transform scattered research notes and findings into structured knowledge bases. Our AI helps you organize literature reviews, experimental observations, and research insights for better analysis and publication.",
      illustration: "Researcher organizing studies and findings"
    }
  ];

  const animateTabChange = (newIndex) => {
    if (newIndex === activeTab || !contentRef.current || !illustrationRef.current) return;

    // Use GSAP context for proper cleanup
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      // Animate out current content
      tl.to([contentRef.current, illustrationRef.current], {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.inOut"
      })
      // Update the state in the middle of animation
      .call(() => {
        setActiveTab(newIndex);
      })
      // Animate in new content
      .fromTo([contentRef.current, illustrationRef.current], {
        opacity: 0,
        y: -20
      }, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        stagger: 0.1
      });
    });

    // Cleanup is handled automatically by React when component updates
  };

  // Initial animation for content when component mounts
  useEffect(() => {
    if (!contentRef.current || !illustrationRef.current) return;

    // Use GSAP context for proper cleanup
    const ctx = gsap.context(() => {
      gsap.fromTo([contentRef.current, illustrationRef.current], {
        opacity: 0,
        y: 30
      }, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1
      });
    });

    // Cleanup function
    return () => ctx.revert();
  }, []);

  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      // Kill any remaining animations for this component
      const elementsToCleanup = [contentRef.current, illustrationRef.current].filter(Boolean);
      elementsToCleanup.forEach(element => {
        if (element) {
          gsap.killTweensOf(element);
        }
      });
    }
  }, []);

  return (
    <section id="use-cases" ref={sectionRef} className="py-16 px-4 sm:px-6 lg:px-8 theme-bg-secondary">
      <div className="w-full mx-auto">
        {/* Tab Navigation */}
        <div ref={tabsRef} className="flex justify-start gap-16 mb-12 px-4">
          {useCases.map((useCase, index) => {
            const IconComponent = useCase.icon;
            return (
              <button
                key={index}
                onClick={() => animateTabChange(index)}
                className={`text-lg font-medium animate-item flex items-center gap-2 ${
                  activeTab === index
                    ? 'theme-text-primary'
                    : 'theme-text-muted hover:theme-text-secondary'
                }`}
                style={{ 
                  background: 'none',
                  border: 'none',
                  padding: '0',
                  margin: '0',
                  outline: 'none',
                  cursor: 'pointer',
                  borderRadius: '0',
                  borderBottom: activeTab === index ? '2px solid var(--accent-color)' : '2px solid transparent',
                  paddingBottom: '2px'
                }}
              >
                <IconComponent className="w-5 h-5" />
                {useCase.tab}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex flex-col lg:flex-row items-center gap-12 px-4">
          {/* Text Content */}
          <div ref={contentRef} className="flex-1 max-w-[608px]">
            <h2 className="text-3xl font-bold theme-text-primary mb-6 leading-tight">
              {useCases[activeTab].title}
            </h2>
            <p className="text-lg theme-text-muted leading-relaxed">
              {useCases[activeTab].content}
            </p>
          </div>

          {/* Illustration */}
          <div ref={illustrationRef} className="flex-1 flex justify-center lg:justify-end">
            <div className="w-80 h-80 theme-bg-tertiary rounded-lg flex items-center justify-center">
              <p className="theme-text-muted text-center px-4">
                {useCases[activeTab].illustration}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases; 