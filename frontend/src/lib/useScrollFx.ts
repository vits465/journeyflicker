import { useEffect } from "react";

export function useScrollFx() {
  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      threshold: 0.01,
      rootMargin: "0px 0px -30px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    }, observerOptions);

    // Observe all reveal elements
    const revealEls = document.querySelectorAll(
      ".reveal-on-scroll, .reveal, .animate-reveal",
    );
    revealEls.forEach((el) => {
      observer.observe(el);
      // Immediately activate elements that are already in view on mount
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("active");
      }
    });

    const onScroll = () => {
      document.querySelectorAll<HTMLElement>(".parallax-bg").forEach((bg) => {
        const parent = bg.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        const visible = rect.top < window.innerHeight && rect.bottom > 0;
        if (!visible) return;

        const speed = 0.15;
        const yPos = -(rect.top * speed);
        bg.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
}

