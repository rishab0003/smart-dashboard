import React, { useRef } from 'react';

export default function SpotlightCard({ children, className = '', style = {}, ...props }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  // Separate layout styles for the inner wrapper
  const {
    display,
    flexDirection,
    flexWrap,
    justifyContent,
    alignItems,
    gap,
    ...outerStyle
  } = style;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`r-card ${className}`}
      style={{ position: 'relative', ...outerStyle }}
      {...props}
    >
      {/* Spotlight overlay glow */}
      <div 
        className="r-card-spotlight-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0,
          transition: 'opacity 0.4s var(--ease)',
          background: 'radial-gradient(350px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(232, 93, 38, 0.08), transparent 80%)'
        }}
      />
      
      {/* Content wrapper to ensure children sit above the absolute overlay if needed */}
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        height: '100%', 
        width: '100%', 
        display: display || 'flex', 
        flexDirection: flexDirection || 'column',
        flexWrap: flexWrap,
        justifyContent: justifyContent,
        alignItems: alignItems,
        gap: gap
      }}>
        {children}
      </div>
    </div>
  );
}
