import './Logo.css';

export function Logo({ className = '', textClassName = '' }: { className?: string, textClassName?: string }) {
  return (
    <div className={`journey-logo ${className}`}>
      <img 
        src="/favicon.svg" 
        alt="JourneyFlicker Logo" 
        className="journey-logo-img"
      />

      {/* Vertical Divider */}
      <div className={`journey-logo-divider ${textClassName}`} />

      {/* Brand Text */}
      <span className={`journey-logo-text ${textClassName}`}>
        JourneyFlicker
      </span>
    </div>
  );
}
