import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useScrollAnimation = (trigger = "bottom 85%", start = "top bottom") => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Set initial state - invisible and slightly moved down
    gsap.set(element, {
      opacity: 0,
      y: 50,
      scale: 0.95
    });

    // Create scroll-triggered animation
    const animation = gsap.to(element, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: element,
        start: start,
        end: trigger,
        toggleActions: "play none none reverse",
        scrub: false,
        once: false
      }
    });

    return () => {
      animation.kill();
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [trigger, start]);

  return ref;
};

export const useStaggeredAnimation = (itemSelector = ".animate-item", stagger = 0.1) => {
  const ref = useRef(null);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const items = container.querySelectorAll(itemSelector);
    if (items.length === 0) return;

    // Set initial state for all items
    gsap.set(items, {
      opacity: 0,
      y: 30,
      scale: 0.98
    });

    // Create staggered animation
    const animation = gsap.to(items, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.8,
      ease: "power2.out",
      stagger: stagger,
      scrollTrigger: {
        trigger: container,
        start: "top bottom-=100",
        end: "bottom 85%",
        toggleActions: "play none none reverse",
        scrub: false,
        once: false
      }
    });

    return () => {
      animation.kill();
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === container) {
          trigger.kill();
        }
      });
    };
  }, [itemSelector, stagger]);

  return ref;
}; 