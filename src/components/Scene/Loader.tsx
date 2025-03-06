import React, { useState } from 'react';
import styled from 'styled-components';

const Loader = () => {
  const [showInfo, setShowInfo] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  // Define boundary limits for the invisible barrier
  const boundaryLimits = {
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10
  };
  
  // Add state to track if user is hitting the barrier
  const [hittingBarrier, setHittingBarrier] = useState(false);
  // Add state to track resistance level (0-1)
  const [resistance, setResistance] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Calculate raw coordinates
    let rawX = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    let rawY = ((e.clientY - rect.top) / rect.height - 0.5) * 20;
    
    // Calculate distance from boundaries
    const distanceFromXMin = Math.abs(rawX - boundaryLimits.xMin);
    const distanceFromXMax = Math.abs(rawX - boundaryLimits.xMax);
    const distanceFromYMin = Math.abs(rawY - boundaryLimits.yMin);
    const distanceFromYMax = Math.abs(rawY - boundaryLimits.yMax);
    
    // Find the minimum distance to any boundary
    const minDistance = Math.min(distanceFromXMin, distanceFromXMax, distanceFromYMin, distanceFromYMax);
    
    // Calculate resistance (increases as we get closer to boundary)
    // Resistance zone is 3 units from the boundary
    const resistanceZone = 3;
    const newResistance = minDistance < resistanceZone ? 1 - (minDistance / resistanceZone) : 0;
    setResistance(newResistance);
    
    // Check if we're hitting the barrier before clamping
    const wouldHitBarrier = isAtBoundary(rawX, rawY);
    setHittingBarrier(wouldHitBarrier);
    
    // Apply boundary limits with resistance effect
    // As resistance increases, movement slows down
    const resistanceFactor = 1 - (newResistance * 0.8); // 0.8 is max slowdown factor
    
    // Apply resistance to raw coordinates before clamping
    const resistedX = wouldHitBarrier ? coords.x + ((rawX - coords.x) * resistanceFactor) : rawX;
    const resistedY = wouldHitBarrier ? coords.y + ((rawY - coords.y) * resistanceFactor) : rawY;
    
    // Then apply hard limits
    const x = Math.max(boundaryLimits.xMin, Math.min(boundaryLimits.xMax, resistedX));
    const y = Math.max(boundaryLimits.yMin, Math.min(boundaryLimits.yMax, resistedY));
    
    setCoords({ x, y });
    
    // Add a subtle bounce effect when hitting the barrier
    if (wouldHitBarrier && !hittingBarrier) {
      // Create a bounce effect by adding a ripple at the barrier point
      addRipple(e);
    }
  };
  
  // Add a function to check if we're at the boundary
  const isAtBoundary = (x: number, y: number): boolean => {
    return (
      x <= boundaryLimits.xMin || 
      x >= boundaryLimits.xMax || 
      y <= boundaryLimits.yMin || 
      y >= boundaryLimits.yMax
    );
  };

  const addRipple = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = {
      x,
      y,
      id: Date.now(),
    };
    setRipples((prevRipples) => [...prevRipples, newRipple]);
    setTimeout(() => {
      setRipples((prevRipples) => 
        prevRipples.filter((ripple) => ripple.id !== newRipple.id)
      );
    }, 1000);
  };

  return (
    <StyledWrapper 
      onMouseEnter={() => {
        setShowInfo(true);
        setIsActive(true);
      }} 
      onMouseLeave={() => {
        setShowInfo(false);
        setIsActive(false);
        setCoords({ x: 0, y: 0 });
        setHittingBarrier(false);
        setResistance(0);
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={(e) => {
        setIsActive(true);
        addRipple(e);
      }}
      onMouseUp={() => setIsActive(false)}
      className={`${isActive ? 'active' : ''} ${hittingBarrier ? 'hitting-barrier' : ''} ${resistance > 0 ? 'resistance' : ''}`}
      style={{
        transform: `perspective(1000px) rotateX(${-coords.y}deg) rotateY(${coords.x}deg) scale(${isActive ? '0.95' : '1'})`,
        // Add a subtle glow effect based on resistance level
        boxShadow: resistance > 0 ? `0 0 ${resistance * 10}px rgba(255, 165, 0, ${resistance * 0.5})` : 'none'
      }}
    >
      <div className="cube-loader">
        <div className="cube-top">
          <div className="pattern-overlay" />
        </div>
        <div className="cube-wrapper">
          <span style={{'--i': 0} as React.CSSProperties} className="cube-span">
            <div className="pattern-overlay" />
          </span>
          <span style={{'--i': 1} as React.CSSProperties} className="cube-span">
            <div className="pattern-overlay" />
          </span>
          <span style={{'--i': 2} as React.CSSProperties} className="cube-span">
            <div className="pattern-overlay" />
          </span>
          <span style={{'--i': 3} as React.CSSProperties} className="cube-span">
            <div className="pattern-overlay" />
          </span>
        </div>
        <div className="particles">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="particle" style={{ '--particle-index': i } as React.CSSProperties} />
          ))}
        </div>
      </div>
      
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}

      {showInfo && (
        <div className="info-tooltip">
          <div className="info-content">
            <div className="creator">
              <span className="creator-label">Created by</span>
              <span className="creator-name">Rahul.G</span>
            </div>
            
            <h3 className="info-title">Controls</h3>
            <ul className="info-list">
              <li>WASD - Move</li>
              <li>SPACE - Jump</li>
              <li>SHIFT - Sprint</li>
              <li>MOUSE - Look</li>
            </ul>
            
            <h3 className="info-title">Features</h3>
            <ul className="info-list">
              <li>Dynamic lighting</li>
              <li>Physics movement</li>
              <li>Wave animations</li>
              <li>Aurora borealis</li>
            </ul>
          </div>
        </div>
      )}
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;

  /* Add styles for barrier effect */
  &.hitting-barrier {
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
    animation: barrierPulse 0.3s ease-in-out;
  }
  
  /* Add styles for resistance effect */
  &.resistance {
    transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes barrierPulse {
    0% {
      box-shadow: 0 0 5px rgba(255, 0, 0, 0.3);
    }
    50% {
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.7);
    }
    100% {
      box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
    }
  }

  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
    transform: translate(-50%, -50%) scale(0);
    animation: rippleEffect 1s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  @keyframes rippleEffect {
    0% {
      width: 0;
      height: 0;
      opacity: 0.5;
      transform: translate(-50%, -50%) scale(0);
    }
    100% {
      width: 200px;
      height: 200px;
      opacity: 0;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  .particles {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    transform-style: preserve-3d;
    animation: particleFloat 3s ease-in-out infinite;
    animation-delay: calc(var(--particle-index) * 0.2s);
    opacity: 0;
  }

  @keyframes particleFloat {
    0% {
      transform: translate3d(
        calc(sin(var(--particle-index)) * 50px),
        calc(cos(var(--particle-index)) * 50px),
        0
      ) scale(0);
      opacity: 0;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      transform: translate3d(
        calc(sin(var(--particle-index)) * 100px),
        calc(cos(var(--particle-index)) * 100px),
        50px
      ) scale(1);
      opacity: 0;
    }
  }

  &:hover {
    .particle {
      animation-play-state: running;
    }
    .cube-loader::after {
      opacity: 1;
    }
  }

  .cube-loader {
    &::after {
      content: '';
      position: absolute;
      inset: -20px;
      background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }
  }

  &.active {
    .cube-loader::after {
      opacity: 0.5;
      background: radial-gradient(circle at center, rgba(255,255,255,0.2) 0%, transparent 70%);
    }
    .particle {
      animation-duration: 2s;
    }
  }

  @keyframes activePulse {
    0% {
      transform: rotateX(-25deg) scale(1);
    }
    100% {
      transform: rotateX(-35deg) scale(1.05);
    }
  }

  @keyframes activeRainbow {
    0% { 
      background-position: 0% 50%;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
    }
    50% { 
      background-position: 100% 50%;
      box-shadow: 0 0 30px rgba(255, 255, 255, 0.5);
    }
    100% { 
      background-position: 0% 50%;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
    }
  }

  .cube-loader {
    position: relative;
    width: 75px;
    height: 75px;
    transform-style: preserve-3d;
    transform: rotateX(-30deg);
    animation: animate 4s linear infinite;
    transition: transform 0.3s ease;
  }

  .cube-span, .cube-top {
    transition: all 0.3s ease;
    will-change: transform, filter, animation;
  }

  .pattern-overlay::before,
  .pattern-overlay::after {
    transition: animation-duration 0.3s ease;
  }

  .info-tooltip {
    position: absolute;
    bottom: calc(100% + 1rem);
    right: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    padding: 1rem;
    width: max-content;
    color: white;
    font-size: 0.875rem;
    transform-origin: bottom right;
    animation: tooltipFadeIn 0.2s ease-out;
  }

  .creator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .creator-label {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.875rem;
    font-weight: 300;
  }

  .creator-name {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1rem;
    font-weight: 500;
    background: linear-gradient(to right, #64b5f6, #2196f3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: nameGlow 2s ease-in-out infinite;
  }

  @keyframes nameGlow {
    0%, 100% {
      filter: drop-shadow(0 0 2px rgba(33, 150, 243, 0.3));
    }
    50% {
      filter: drop-shadow(0 0 6px rgba(33, 150, 243, 0.6));
    }
  }

  .info-content {
    min-width: 200px;
  }

  .info-title {
    font-size: 1rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 0.5rem;
    margin-top: 1rem;
    
    &:first-child {
      margin-top: 0;
    }
  }

  .info-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 300;
  }

  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .cube-loader .cube-wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
  }

  .cube-loader .cube-wrapper .cube-span {
    position: absolute;
    width: 100%;
    height: 100%;
    transform: rotateY(calc(90deg * var(--i))) translateZ(37.5px);
    background: linear-gradient(
      45deg,
      #ff0000,
      #ff7300,
      #fffb00,
      #48ff00,
      #00ffd5,
      #002bff,
      #7a00ff,
      #ff00c8,
      #ff0000
    );
    background-size: 400%;
    animation: rainbow 12s linear infinite;
    opacity: 0.8;
    overflow: hidden;
  }

  .cube-top {
    position: absolute;
    width: 75px;
    height: 75px;
    background: linear-gradient(
      45deg,
      #ff0000,
      #ff7300,
      #fffb00,
      #48ff00,
      #00ffd5,
      #002bff,
      #7a00ff,
      #ff00c8,
      #ff0000
    );
    background-size: 400%;
    animation: rainbow 12s linear infinite;
    transform: rotateX(90deg) translateZ(37.5px);
    transform-style: preserve-3d;
    opacity: 0.8;
  }

  .cube-top::before {
    content: '';
    position: absolute;
    width: 75px;
    height: 75px;
    background: rgba(255, 255, 255, 0.1);
    transform: translateZ(-90px);
    filter: blur(20px);
    box-shadow: 
      0 0 20px rgba(255, 255, 255, 0.2),
      0 0 40px rgba(255, 255, 255, 0.2),
      0 0 60px rgba(255, 255, 255, 0.2),
      0 0 80px rgba(255, 255, 255, 0.2);
  }

  .pattern-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    mix-blend-mode: overlay;
  }

  .pattern-overlay::before,
  .pattern-overlay::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    animation: patternFade 8s linear infinite;
  }

  .pattern-overlay::before {
    background-image: 
      linear-gradient(45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255, 255, 255, 0.1) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.1) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    animation: patternMove 20s linear infinite;
  }

  .pattern-overlay::after {
    background-image: 
      radial-gradient(circle at 50% 50%, transparent 5px, rgba(255, 255, 255, 0.1) 5px),
      radial-gradient(circle at 0% 50%, transparent 3px, rgba(255, 255, 255, 0.08) 3px),
      radial-gradient(circle at 100% 50%, transparent 3px, rgba(255, 255, 255, 0.08) 3px);
    background-size: 20px 20px, 15px 15px, 15px 15px;
    animation: patternMove2 15s linear infinite;
    opacity: 0;
  }

  @keyframes patternFade {
    0%, 45%, 55%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  @keyframes patternMove {
    0% {
      background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
    }
    100% {
      background-position: 40px 40px, 40px 50px, 50px 30px, 30px 40px;
    }
  }

  @keyframes patternMove2 {
    0% {
      background-position: 0 0, 0 0, 0 0;
    }
    100% {
      background-position: 40px 40px, 30px 30px, -30px -30px;
    }
  }

  @keyframes rainbow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

export default Loader; 