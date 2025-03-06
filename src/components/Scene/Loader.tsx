import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled from 'styled-components';

// Add gesture support
interface GestureState {
  startX: number;
  startY: number;
  velocityX: number;
  velocityY: number;
  lastTime: number;
}

// Custom debounce implementation
const useDebounce = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Add momentum physics constants
const MOMENTUM_CONFIG = {
  friction: 0.92,
  springStrength: 0.1,
  velocityThreshold: 0.01,
  bounceThreshold: 0.5,
  maxVelocity: 20
};

// Enhanced inertia hook with spring physics
const useInertia = (initialValue: number, dampingFactor: number = 0.95) => {
  const velocity = useRef(0);
  const [value, setValue] = useState(initialValue);
  const animating = useRef(false);
  const lastTime = useRef(Date.now());

  const updateWithInertia = useCallback((targetValue: number, instant = false, velocityBoost = 0) => {
    if (instant) {
      velocity.current = 0;
      setValue(targetValue);
      return;
    }

    const now = Date.now();
    const deltaTime = Math.min((now - lastTime.current) / 16, 2); // Cap at 2x normal speed
    lastTime.current = now;

    const animate = () => {
      // Add spring force
      const displacement = targetValue - value;
      const springForce = displacement * MOMENTUM_CONFIG.springStrength;
      
      // Add initial velocity boost from touch
      if (velocityBoost && Math.abs(velocity.current) < MOMENTUM_CONFIG.maxVelocity) {
        velocity.current += velocityBoost;
      }

      // Apply spring force and friction
      velocity.current += springForce;
      velocity.current *= MOMENTUM_CONFIG.friction;

      // Apply velocity with delta time scaling
      setValue(prev => {
        const newValue = prev + (velocity.current * deltaTime);
        
        // Add bounce effect near boundaries
        if (Math.abs(targetValue - newValue) < MOMENTUM_CONFIG.bounceThreshold) {
          velocity.current *= -0.5; // Bounce with reduced velocity
        }

        return newValue;
      });

      // Continue animation if there's significant movement
      if (Math.abs(velocity.current) > MOMENTUM_CONFIG.velocityThreshold) {
        requestAnimationFrame(animate);
      } else {
        animating.current = false;
        // Settle exactly on target when nearly stopped
        setValue(targetValue);
      }
    };

    if (!animating.current) {
      animating.current = true;
      requestAnimationFrame(animate);
    }
  }, [value]);

  return [value, updateWithInertia] as const;
};

const Loader = () => {
  const [showInfo, setShowInfo] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  // Performance optimization: Use refs for frequently changing values
  const lastFrameTime = useRef(0);
  const animationFrameId = useRef<number>();
  const isAnimating = useRef(false);
  const lastCoords = useRef({ x: 0, y: 0 });
  const frameCount = useRef(0);

  // Memoize boundary limits
  const boundaryLimits = useMemo(() => ({
    xMin: isMobile ? -5 : -10,
    xMax: isMobile ? 5 : 10,
    yMin: isMobile ? -5 : -10,
    yMax: isMobile ? 5 : 10
  }), [isMobile]);
  
  const [hittingBarrier, setHittingBarrier] = useState(false);
  const [resistance, setResistance] = useState(0);

  const gestureState = useRef<GestureState>({
    startX: 0,
    startY: 0,
    velocityX: 0,
    velocityY: 0,
    lastTime: 0
  });

  // Add inertia to movement
  const [inertiaX, updateInertiaX] = useInertia(0);
  const [inertiaY, updateInertiaY] = useInertia(0);

  // Use custom debounced mobile check
  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth <= 768);
  }, []);

  const debouncedMobileCheck = useDebounce(checkMobile, 150);

  useEffect(() => {
    checkMobile();
    window.addEventListener('resize', debouncedMobileCheck);
    
    // Enable smooth animations on high refresh rate displays
    const rafCallback = () => {
      frameCount.current = 0;
    };
    const interval = setInterval(rafCallback, 1000);

    return () => {
      window.removeEventListener('resize', debouncedMobileCheck);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      clearInterval(interval);
    };
  }, [checkMobile, debouncedMobileCheck]);

  // Performance optimization: Use intersection observer for animation pausing
  useEffect(() => {
    const element = document.querySelector('.cube-loader');
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting && animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            isAnimating.current = false;
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Memoize the boundary check function
  const isAtBoundary = useCallback((x: number, y: number): boolean => {
    return (
      x <= boundaryLimits.xMin || 
      x >= boundaryLimits.xMax || 
      y <= boundaryLimits.yMin || 
      y >= boundaryLimits.yMax
    );
  }, [boundaryLimits]);

  // Optimize ripple management with batch updates
  const addRipple = useCallback((e: React.MouseEvent | { clientX: number; clientY: number }) => {
    const rect = (e as React.MouseEvent).currentTarget?.getBoundingClientRect() || { left: 0, top: 0 };
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);
    const newRipple = { x, y, id: Date.now() };
    
    setRipples(prev => {
      // Limit maximum number of ripples
      const filtered = prev.slice(-4);
      return [...filtered, newRipple];
    });

    // Cleanup ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 1000);
  }, []);

  // Add touch velocity tracking
  const touchVelocity = useRef({ x: 0, y: 0 });
  const lastTouch = useRef({ x: 0, y: 0, time: 0 });
  const rafId = useRef<number>();
  const batteryOptimization = useRef({
    lowPowerMode: false,
    lastCheck: 0
  });

  // Check device capabilities and battery status
  useEffect(() => {
    const checkDeviceCapabilities = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          batteryOptimization.current.lowPowerMode = battery.level <= 0.2 || !battery.charging;
          
          battery.addEventListener('levelchange', () => {
            batteryOptimization.current.lowPowerMode = battery.level <= 0.2 || !battery.charging;
          });
        }
      } catch (e) {
        console.warn('Battery status not available');
      }
    };

    checkDeviceCapabilities();
  }, []);

  // Base interaction handlers (declare these first)
  const handleInteractionEnd = useCallback(() => {
    setIsActive(false);
  }, []);

  const handleInteractionStart = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    setIsActive(true);
    addRipple({ clientX, clientY });
  }, [addRipple]);

  // Coordinate and movement handling
  const updateCoords = useCallback((
    targetX: number,
    targetY: number,
    instant = false,
    velocity = { x: 0, y: 0 }
  ) => {
    if (!isAnimating.current) {
      isAnimating.current = true;
      lastCoords.current = { x: targetX, y: targetY };

      const velocityBoostX = velocity.x * 0.001;
      const velocityBoostY = velocity.y * 0.001;

      const velocityScale = batteryOptimization.current.lowPowerMode ? 0.5 : 1.0;
      updateInertiaX(targetX, instant, velocityBoostX * velocityScale);
      updateInertiaY(targetY, instant, velocityBoostY * velocityScale);

      const targetFPS = batteryOptimization.current.lowPowerMode ? 30 : 60;
      const frameInterval = 1000 / targetFPS;
      let lastFrameTime = 0;

      const animate = (timestamp: number) => {
        if (timestamp - lastFrameTime < frameInterval) {
          rafId.current = requestAnimationFrame(animate);
          return;
        }

        lastFrameTime = timestamp;
        frameCount.current++;

        setCoords(prev => {
          if (Math.abs(targetX - prev.x) < 0.001 && Math.abs(targetY - prev.y) < 0.001) {
            isAnimating.current = false;
            return prev;
          }

          return { x: inertiaX, y: inertiaY };
        });

        if (isAnimating.current) {
          rafId.current = requestAnimationFrame(animate);
        }
      };

      rafId.current = requestAnimationFrame(animate);
    }
  }, [inertiaX, inertiaY, updateInertiaX, updateInertiaY]);

  const handleInteractionMove = useCallback((
    clientX: number,
    clientY: number,
    rect: DOMRect,
    velocityX = 0,
    velocityY = 0
  ) => {
    const rawX = ((clientX - rect.left) / rect.width - 0.5) * (isMobile ? 10 : 20);
    const rawY = ((clientY - rect.top) / rect.height - 0.5) * (isMobile ? 10 : 20);
    
    const distanceFromXMin = Math.abs(rawX - boundaryLimits.xMin);
    const distanceFromXMax = Math.abs(rawX - boundaryLimits.xMax);
    const distanceFromYMin = Math.abs(rawY - boundaryLimits.yMin);
    const distanceFromYMax = Math.abs(rawY - boundaryLimits.yMax);
    
    const minDistance = Math.min(distanceFromXMin, distanceFromXMax, distanceFromYMin, distanceFromYMax);
    const resistanceZone = isMobile ? 1.5 : 3;
    const newResistance = minDistance < resistanceZone ? 1 - (minDistance / resistanceZone) : 0;
    
    const wouldHitBarrier = isAtBoundary(rawX, rawY);
    const resistanceFactor = 1 - (newResistance * 0.8);
    
    const resistedX = wouldHitBarrier ? coords.x + ((rawX - coords.x) * resistanceFactor) : rawX;
    const resistedY = wouldHitBarrier ? coords.y + ((rawY - coords.y) * resistanceFactor) : rawY;
    
    const finalX = Math.max(boundaryLimits.xMin, Math.min(boundaryLimits.xMax, resistedX));
    const finalY = Math.max(boundaryLimits.yMin, Math.min(boundaryLimits.yMax, resistedY));
    
    updateCoords(finalX, finalY, false, { x: velocityX, y: velocityY });
    setResistance(newResistance);
    setHittingBarrier(wouldHitBarrier);
    
    if (wouldHitBarrier && !hittingBarrier) {
      addRipple({ clientX, clientY });
    }
  }, [isMobile, boundaryLimits, coords, hittingBarrier, isAtBoundary, addRipple, updateCoords]);

  // Mouse event handlers
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    handleInteractionMove(e.clientX, e.clientY, rect);
  }, [handleInteractionMove]);

  // Touch event handlers with proper typing
  const updateTouchVelocity = useCallback((touch: React.Touch) => {
    const now = Date.now();
    const deltaTime = now - lastTouch.current.time;
    
    if (deltaTime > 0) {
      const dx = touch.clientX - lastTouch.current.x;
      const dy = touch.clientY - lastTouch.current.y;
      
      touchVelocity.current = {
        x: (dx / deltaTime) * 1000,
        y: (dy / deltaTime) * 1000
      };
    }

    lastTouch.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    
    gestureState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      velocityX: 0,
      velocityY: 0,
      lastTime: Date.now()
    };

    handleInteractionStart(touch.clientX, touch.clientY, rect);
  }, [handleInteractionStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();

    updateTouchVelocity(touch);

    const velocityFactor = batteryOptimization.current.lowPowerMode ? 0.5 : 1.0;
    handleInteractionMove(
      touch.clientX,
      touch.clientY,
      rect,
      touchVelocity.current.x * velocityFactor,
      touchVelocity.current.y * velocityFactor
    );
  }, [handleInteractionMove, updateTouchVelocity]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const velocityFactor = batteryOptimization.current.lowPowerMode ? 30 : 50;
    const finalX = coords.x + (touchVelocity.current.x * velocityFactor * 0.001);
    const finalY = coords.y + (touchVelocity.current.y * velocityFactor * 0.001);
    
    updateCoords(
      Math.max(boundaryLimits.xMin, Math.min(boundaryLimits.xMax, finalX)),
      Math.max(boundaryLimits.yMin, Math.min(boundaryLimits.yMax, finalY)),
      false,
      touchVelocity.current
    );

    touchVelocity.current = { x: 0, y: 0 };
    handleInteractionEnd();
  }, [coords, boundaryLimits, updateCoords, handleInteractionEnd]);

  // Memoize style object
  const wrapperStyle = useMemo(() => ({
    transform: `perspective(1000px) rotateX(${-coords.y}deg) rotateY(${coords.x}deg) scale(${isActive ? '0.95' : '1'})`,
    boxShadow: resistance > 0 ? `0 0 ${resistance * (isMobile ? 5 : 10)}px rgba(255, 165, 0, ${resistance * 0.5})` : 'none'
  }), [coords.x, coords.y, isActive, resistance, isMobile]);

  // Memoize class string
  const wrapperClass = useMemo(() => (
    `${isActive ? 'active' : ''} ${hittingBarrier ? 'hitting-barrier' : ''} ${resistance > 0 ? 'resistance' : ''} ${isMobile ? 'mobile' : ''}`
  ), [isActive, hittingBarrier, resistance, isMobile]);

  return (
    <StyledWrapper 
      onMouseEnter={useCallback(() => {
        setShowInfo(true);
        setIsActive(true);
      }, [])}
      onMouseLeave={useCallback(() => {
        setShowInfo(false);
        setIsActive(false);
        setCoords({ x: 0, y: 0 });
        setHittingBarrier(false);
        setResistance(0);
      }, [])}
      onMouseMove={handleMouseMove}
      onMouseDown={useCallback((e: React.MouseEvent) => {
        setIsActive(true);
        addRipple(e);
      }, [addRipple])}
      onMouseUp={handleInteractionEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={wrapperClass}
      style={{
        ...wrapperStyle,
        transform: `
          perspective(1000px)
          rotateX(${-coords.y}deg)
          rotateY(${coords.x}deg)
          scale(${isActive ? '0.95' : '1'})
          translateZ(0)
        `,
        transition: batteryOptimization.current.lowPowerMode ? 
          'transform 0.2s linear' : 
          'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        perspective: '1000px',
        WebkitPerspective: '1000px',
        WebkitFontSmoothing: 'antialiased',
        WebkitTransform: `translate3d(0,0,0)`,
      }}
    >
      <div className="cube-loader">
        <div className="cube-wrapper">
          <div className="black-hole-effect" />
          <div className="accretion-disk" />
          <div className="magical-glow" />
          <div className="tiny-sprites">
            {[...Array(15)].map((_, i) => (
              <div key={`sprite-${i}`} className="tiny-sprite" />
            ))}
          </div>
          <span className="cube-span">
            <div className="pattern-overlay" />
          </span>
          <div className="mystical-symbols">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="symbol" />
            ))}
        </div>
          <div className="geometric-patterns">
            <div className="geometric-pattern" />
            <div className="geometric-pattern" />
            <div className="geometric-pattern" />
          </div>
          <div className="energy-waves">
            <div className="energy-wave" />
            <div className="energy-wave" />
            <div className="energy-wave" />
            <div className="energy-wave" />
          </div>
          <div className="sparkles">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="sparkle" />
            ))}
          </div>
          <div className="magical-runes">
          {[...Array(12)].map((_, i) => (
              <div key={i} className="rune" />
            ))}
          </div>
          <div className="magical-core" />
        </div>
        <div className="particles">
          {useMemo(() => (
            [...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{ '--particle-index': i } as React.CSSProperties} />
            ))
          ), [])}
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
};

const StyledWrapper = styled.div`
  position: relative;
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  will-change: transform, box-shadow;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  
  /* Enhanced GPU acceleration */
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  perspective: 1000px;
  -webkit-perspective: 1000px;
  -webkit-font-smoothing: antialiased;
  -webkit-transform: translate3d(0,0,0);

  /* Add touch momentum scrolling for iOS */
  -webkit-overflow-scrolling: touch;
  
  /* Prevent text selection during drag */
  user-select: none;
  -webkit-user-select: none;

  /* Mobile optimizations */
  &.mobile {
    width: 60px;
    height: 60px;
    transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);

    .cube-loader {
      width: 60px;
      height: 60px;
    }
  }

  /* Optimize animations */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
    
    * {
      transition: none !important;
      animation: none !important;
    }
  }

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
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.8),
      rgba(255, 255, 255, 0.4) 60%,
      transparent 100%
    );
    transform: translate(-50%, -50%) scale(0);
    animation: spiritRipple 1s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
  }

  @keyframes spiritRipple {
    0% {
      width: 0;
      height: 0;
      opacity: 0.8;
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
    width: 200%;
    height: 200%;
    left: -50%;
    top: -50%;
    pointer-events: none;
    animation: rotateParticleContainer 20s linear infinite;
    transform-style: preserve-3d;
  }

  @keyframes rotateParticleContainer {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 1),
      rgba(255, 215, 0, 0.9) 40%,
      rgba(218, 165, 32, 0.6) 70%,
      transparent 100%
    );
    box-shadow: 
      0 0 8px rgba(255, 255, 255, 0.9),
      0 0 15px rgba(255, 215, 0, 0.8);
    filter: blur(0.5px);
    border-radius: 50%;
    transform-style: preserve-3d;
    animation: 
      orbitParticle 8s linear infinite,
      gravitationalPull 6s ease-in-out infinite,
      particleGlow 4s ease-in-out infinite;

    @for $i from 1 through 30 {
      &:nth-child(#{$i}) {
        --orbit-radius: #{25 + random(40)}px;
        --orbit-angle: #{$i * (360 / 30)}deg;
        --orbit-speed: #{6 + random(6)}s;
        animation: 
          orbitParticle var(--orbit-speed) linear infinite,
          gravitationalPull 6s ease-in-out infinite,
          particleGlow 4s ease-in-out infinite;
        animation-delay: #{random(8000)}ms;
      }
    }
  }

  @keyframes orbitParticle {
    0% {
      transform: rotate(var(--orbit-angle)) translateX(var(--orbit-radius)) scale(0.8);
      opacity: 0;
    }
    30%, 70% {
      opacity: 0.8;
      transform: rotate(calc(var(--orbit-angle) + 180deg)) translateX(var(--orbit-radius)) scale(1.2);
    }
    100% {
      transform: rotate(calc(var(--orbit-angle) + 360deg)) translateX(var(--orbit-radius)) scale(0.8);
      opacity: 0;
    }
  }

  @keyframes gravitationalPull {
    0%, 100% {
      transform: rotate(var(--orbit-angle)) translateX(var(--orbit-radius)) scale(0.8);
    }
    50% {
      transform: rotate(var(--orbit-angle)) translateX(calc(var(--orbit-radius) * 0.7)) scale(1.2);
    }
  }

  .mystical-symbols {
    position: absolute;
    inset: -20%;
    border-radius: 50%;
    transform-style: preserve-3d;
    animation: rotateSymbolContainer 15s linear infinite reverse;
  }

  @keyframes rotateSymbolContainer {
    from { transform: rotate(0deg) scale(1); }
    to { transform: rotate(360deg) scale(1); }
  }

  .symbol {
    position: absolute;
    width: 15%;
    height: 15%;
    opacity: 0;
    left: 50%;
    top: 50%;
    transform-origin: center;
    animation: orbitSymbol 10s linear infinite;
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.2);
      clip-path: path('M10,0 L20,10 L10,20 L0,10 Z');
    }

    @for $i from 1 through 8 {
      &:nth-child(#{$i}) {
        --symbol-angle: #{$i * (360 / 8)}deg;
        --orbit-delay: #{$i * 0.5}s;
        --orbit-distance: #{40 + random(20)}px;
        animation: orbitSymbol 10s linear infinite;
        animation-delay: var(--orbit-delay);
      }
    }
  }

  @keyframes orbitSymbol {
    0% {
      transform: rotate(var(--symbol-angle)) translateX(var(--orbit-distance)) rotate(0deg);
      opacity: 0;
    }
    30%, 70% {
      opacity: 0.5;
      transform: rotate(calc(var(--symbol-angle) + 180deg)) translateX(var(--orbit-distance)) rotate(180deg);
    }
    100% {
      transform: rotate(calc(var(--symbol-angle) + 360deg)) translateX(var(--orbit-distance)) rotate(360deg);
      opacity: 0;
    }
  }

  .sparkles {
    position: absolute;
    inset: -40%;
      pointer-events: none;
    transform-style: preserve-3d;
    animation: rotateSparkleContainer 12s linear infinite;
  }

  @keyframes rotateSparkleContainer {
    from { transform: rotate(0deg) scale(1); }
    to { transform: rotate(-360deg) scale(1); }
  }

  .sparkle {
    position: absolute;
    width: 2px;
    height: 2px;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 1),
      rgba(255, 215, 0, 0.9) 40%,
      rgba(218, 165, 32, 0.7) 70%,
      transparent 100%
    );
    box-shadow: 
      0 0 8px rgba(255, 255, 255, 0.9),
      0 0 15px rgba(255, 215, 0, 0.8);
    border-radius: 50%;
    left: 50%;
    top: 50%;
    transform-origin: center;
    animation: 
      orbitSparkle 6s linear infinite,
      sparkleDistortion 4s ease-in-out infinite,
      rainbowSparkle 4s linear infinite,
      sparklePulse 2s ease-in-out infinite;

    @for $i from 1 through 25 {
      &:nth-child(#{$i}) {
        --sparkle-angle: #{$i * (360 / 25)}deg;
        --sparkle-distance: #{20 + random(40)}px;
        --sparkle-delay: #{random(6000)}ms;
        --sparkle-color: #{random(360)}deg;
        animation: 
          orbitSparkle 6s linear infinite,
          sparkleDistortion 4s ease-in-out infinite,
          rainbowSparkle 4s linear infinite,
          sparklePulse 2s ease-in-out infinite;
        animation-delay: var(--sparkle-delay);
        filter: hue-rotate(var(--sparkle-color));
      }
    }
  }

  @keyframes orbitSparkle {
    0% {
      transform: rotate(var(--sparkle-angle)) translateX(var(--sparkle-distance)) scale(0);
      opacity: 0;
    }
    30%, 70% {
      opacity: 0.8;
      transform: rotate(calc(var(--sparkle-angle) + 180deg)) translateX(var(--sparkle-distance)) scale(1.5);
    }
    100% {
      transform: rotate(calc(var(--sparkle-angle) + 360deg)) translateX(var(--sparkle-distance)) scale(0);
      opacity: 0;
    }
  }

  @keyframes sparkleDistortion {
    0%, 100% {
      filter: blur(1px) brightness(1);
    }
    50% { 
      filter: blur(2px) brightness(1.5);
    }
  }

  @keyframes rainbowRotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .accretion-disk {
    position: absolute;
    inset: -20%;
    border-radius: 50%;
    transform-style: preserve-3d;
    animation: accretionRotate 15s linear infinite;
    z-index: 2;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      inset: 25%;
      border-radius: 50%;
      background: 
        repeating-conic-gradient(
          from 0deg,
          rgba(255, 215, 0, 0.8) 0deg,
          rgba(218, 165, 32, 0.7) 60deg,
          rgba(184, 134, 11, 0.6) 120deg,
          rgba(205, 133, 63, 0.7) 180deg,
          rgba(255, 215, 0, 0.8) 240deg,
          rgba(218, 165, 32, 0.7) 300deg,
          rgba(255, 215, 0, 0.8) 360deg
        );
      filter: blur(1px);
      transform: rotate(0deg);
      animation: diskRotation 8s linear infinite, rainbowPulse 6s ease-in-out infinite;
      opacity: 0.95;
      box-shadow: 0 0 30px rgba(255, 215, 0, 0.6);
    }

    &::after {
      content: '';
      position: absolute;
      inset: 20%;
      border-radius: 50%;
      background: 
        repeating-conic-gradient(
          from 45deg,
          rgba(255, 215, 0, 0.7) 0deg,
          rgba(218, 165, 32, 0.6) 60deg,
          rgba(184, 134, 11, 0.5) 120deg,
          rgba(205, 133, 63, 0.6) 180deg,
          rgba(255, 215, 0, 0.7) 240deg,
          rgba(218, 165, 32, 0.6) 300deg,
          rgba(255, 215, 0, 0.7) 360deg
        );
      filter: blur(2px);
      transform: rotate(0deg);
      animation: diskRotation 12s linear infinite reverse, rainbowPulse 8s ease-in-out infinite reverse;
      opacity: 0.9;
      box-shadow: 0 0 40px rgba(255, 215, 0, 0.7);
    }
  }

  .magical-glow {
    position: absolute;
    inset: -30%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.95),
      rgba(255, 215, 0, 0.8) 30%,
      rgba(255, 223, 0, 0.6) 45%,
      rgba(218, 165, 32, 0.4) 60%,
      rgba(184, 134, 11, 0.2) 75%,
      transparent 90%
    );
    filter: blur(8px);
    animation: goldenGlow 4s ease-in-out infinite, mainPulse 2s ease-in-out infinite;
    mix-blend-mode: screen;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes goldenGlow {
    0%, 100% { 
      opacity: 0.5; 
      transform: scale(1);
      filter: blur(8px) brightness(1);
    }
    50% { 
      opacity: 0.8; 
      transform: scale(1.2);
      filter: blur(12px) brightness(1.3);
    }
  }

  @keyframes mainPulse {
    0%, 100% {
      transform: scale(1);
      filter: blur(8px) brightness(1);
    }
    50% {
      transform: scale(1.15);
      filter: blur(12px) brightness(1.4);
    }
  }

  /* Enhanced active state */
  &.active {
    .magical-glow {
      animation-duration: 2s;
      opacity: 1;
      filter: blur(8px);
    }

    .accretion-disk {
      &::before, &::after {
        animation-duration: 4s;
        opacity: 1;
      }
    }

    .geometric-patterns .pattern {
      border-width: 3px;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
    }

    .magical-runes .rune {
      animation-duration: 3s;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
    }
    
    .energy-waves .wave {
      animation-duration: 3s;
      border-width: 4px;
      box-shadow: 0 0 25px rgba(255, 255, 255, 0.4);
    }
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

  /* Add new keyframes for spirit rotations */
  @keyframes spiritRotate {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.1); }
    100% { transform: rotate(360deg) scale(1); }
  }

  .black-hole-effect {
    position: absolute;
    inset: -10%;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 1) 0%,
      rgba(255, 255, 255, 0.95) 30%,
      rgba(255, 215, 0, 0.9) 50%,
      rgba(255, 215, 0, 0.7) 70%,
      rgba(255, 215, 0, 0.5) 90%
    );
    filter: blur(2px);
    transform-style: preserve-3d;
    animation: whitePulse 4s ease-in-out infinite, energyPulse 3s ease-in-out infinite;
    z-index: 2;
    box-shadow: 
      0 0 50px rgba(255, 255, 255, 0.9),
      0 0 100px rgba(255, 215, 0, 0.8);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: radial-gradient(
        circle at center,
        rgba(255, 255, 255, 1) 20%,
        rgba(255, 255, 255, 0.95) 40%,
        rgba(255, 215, 0, 0.9) 60%,
        rgba(255, 215, 0, 0.7) 80%
      );
      filter: blur(4px);
      mix-blend-mode: screen;
      animation: coreLightPulse 3s ease-in-out infinite;
    }

    &::after {
      content: '';
    position: absolute;
      inset: -5%;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        transparent,
        rgba(255, 255, 255, 0.8),
        transparent 50%,
        rgba(255, 255, 255, 0.8),
        transparent
      );
      animation: lightRotation 8s linear infinite;
      filter: blur(2px);
      opacity: 0.7;
    }
  }

  @keyframes whitePulse {
    0%, 100% {
      transform: scale(1);
      filter: blur(2px) brightness(1);
    }
    50% {
      transform: scale(1.1);
      filter: blur(3px) brightness(1.3);
    }
  }

  @keyframes coreLightPulse {
    0%, 100% {
      opacity: 0.8;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
  }

  @keyframes lightRotation {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes accretionRotate {
    from { transform: rotate(0deg) scale(1); }
    to { transform: rotate(360deg) scale(1); }
  }

  @keyframes diskRotation {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes energyPulse {
    0%, 100% {
      box-shadow: 
        0 0 50px rgba(255, 255, 255, 0.9),
        0 0 100px rgba(255, 215, 0, 0.8);
      opacity: 0.8;
    }
    50% {
      box-shadow: 
        0 0 80px rgba(255, 255, 255, 1),
        0 0 150px rgba(255, 215, 0, 0.9);
      opacity: 1;
    }
  }

  .cube-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    
    /* Add magical runes layer */
    .magical-runes {
      position: absolute;
      inset: -30%;
      transform-style: preserve-3d;
      animation: runeRotate 20s linear infinite;
      
      .rune {
        position: absolute;
        width: 25px;
        height: 25px;
        opacity: 0;
    background: linear-gradient(
      45deg,
          rgba(255, 255, 255, 0.6),
          rgba(70, 130, 180, 0.6)
        );
        transform-origin: center;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
        
        @for $i from 1 through 12 {
          &:nth-child(#{$i}) {
            left: #{random(100)}%;
            top: #{random(100)}%;
            animation: 
              runeFade 4s ease-in-out infinite,
              runeGlow #{4 + random(4)}s ease-in-out infinite;
            animation-delay: #{$i * 0.5}s;
            clip-path: polygon(
              #{random(20)}% #{random(20)}%,
              #{80 + random(20)}% #{random(20)}%,
              #{80 + random(20)}% #{80 + random(20)}%,
              #{random(20)}% #{80 + random(20)}%
            );
          }
        }
      }
    }

    /* Enhanced energy waves */
    .energy-waves {
    position: absolute;
      inset: -20%;
      transform-style: preserve-3d;
      z-index: 5;
      
      .wave {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        opacity: 0;
        border: 3px solid rgba(255, 255, 255, 0.4);
    background: linear-gradient(
      45deg,
          rgba(255, 255, 255, 0.3),
          rgba(70, 130, 180, 0.4),
          rgba(255, 255, 255, 0.3)
        );
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        
        @for $i from 1 through 6 {
          &:nth-child(#{$i}) {
            animation: 
              waveExpand 4s ease-out infinite,
              waveRotate #{6 + $i * 2}s linear infinite;
            animation-delay: #{$i * 0.5}s;
          }
        }
      }
    }

    /* Complex geometric patterns */
    .geometric-patterns {
      position: absolute;
      inset: -25%;
    transform-style: preserve-3d;
      animation: patternRotate 15s linear infinite;
      z-index: 3;
      
      .pattern {
        position: absolute;
        inset: 15%;
        opacity: 0;
        border: 3px solid rgba(255, 215, 0, 0.7);
        box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
        
        @for $i from 1 through 6 {
          &:nth-child(#{$i}) {
            transform: rotate(#{$i * 60}deg);
            animation: 
              patternFade #{6 + $i}s ease-in-out infinite,
              patternGlow #{4 + $i * 2}s ease-in-out infinite,
              patternSpin #{10 + $i * 2}s linear infinite;
            animation-delay: #{$i * 0.5}s;
            
            @if $i == 1 {
              clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
              background: linear-gradient(
                45deg,
                rgba(255, 215, 0, 0.4),
                rgba(218, 165, 32, 0.3)
              );
            } @else if $i == 2 {
              clip-path: polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%);
              background: linear-gradient(
                135deg,
                rgba(70, 130, 180, 0.4),
                rgba(255, 255, 255, 0.3)
              );
            } @else if $i == 3 {
              clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
              background: linear-gradient(
                90deg,
                rgba(255, 255, 255, 0.3),
                rgba(70, 130, 180, 0.4)
              );
            } @else if $i == 4 {
              clip-path: polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%);
              background: linear-gradient(
                180deg,
                rgba(70, 130, 180, 0.4),
                rgba(255, 255, 255, 0.3)
              );
            } @else if $i == 5 {
              clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
              background: linear-gradient(
                225deg,
                rgba(255, 255, 255, 0.3),
                rgba(70, 130, 180, 0.4)
              );
            } @else {
              clip-path: polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%);
              background: linear-gradient(
                270deg,
                rgba(70, 130, 180, 0.4),
                rgba(255, 255, 255, 0.3)
              );
            }
          }
        }

        &::before {
    content: '';
    position: absolute;
          inset: 5px;
          background: inherit;
          filter: blur(2px);
          opacity: 0.7;
        }

        &::after {
          content: '';
    position: absolute;
          inset: -2px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          filter: blur(1px);
        }
      }
    }

    /* Enhanced magical core */
    .magical-core {
    position: absolute;
      inset: 10%;
      border-radius: 50%;
      background: radial-gradient(
        circle at center,
        rgba(255, 255, 255, 1),
        rgba(255, 215, 0, 0.9) 30%,
        rgba(218, 165, 32, 0.7) 60%,
        rgba(184, 134, 11, 0.4) 80%,
        transparent 100%
      );
      filter: blur(5px);
      animation: corePulse 4s ease-in-out infinite;
      mix-blend-mode: screen;
      box-shadow: 
        0 0 30px rgba(255, 255, 255, 0.9),
        0 0 60px rgba(255, 215, 0, 0.8);
    }
  }

  /* New keyframes for enhanced effects */
  @keyframes runeRotate {
    from { transform: rotate(0deg) scale(1); }
    to { transform: rotate(360deg) scale(1); }
  }

  @keyframes runeFade {
    0%, 100% { opacity: 0; transform: scale(0.8) rotate(0deg); }
    50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
  }

  @keyframes runeGlow {
    0%, 100% { filter: blur(2px) brightness(1); }
    50% { filter: blur(4px) brightness(1.5); }
  }

  @keyframes waveExpand {
    0% { 
      opacity: 1;
      transform: scale(0.1);
      border-color: rgba(255, 255, 255, 0.6);
    }
    100% {
      opacity: 0;
      transform: scale(2);
      border-color: transparent;
    }
  }

  @keyframes waveRotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes patternRotate {
    from { transform: rotate(0deg) scale(0.95); }
    to { transform: rotate(360deg) scale(0.95); }
  }

  @keyframes patternFade {
    0%, 100% { 
      opacity: 0;
      transform: scale(0.8) rotate(0deg);
    }
    50% { 
      opacity: 0.9;
      transform: scale(1.1) rotate(180deg);
    }
  }

  @keyframes patternGlow {
    0%, 100% { 
      filter: blur(2px) brightness(1);
      border-color: rgba(255, 215, 0, 0.5);
    }
    50% { 
      filter: blur(4px) brightness(1.5);
      border-color: rgba(255, 215, 0, 0.8);
    }
  }

  @keyframes patternSpin {
    0% {
      transform: rotate(0deg) translateY(-5px);
    }
    50% {
      transform: rotate(180deg) translateY(5px);
    }
    100% {
      transform: rotate(360deg) translateY(-5px);
    }
  }

  @keyframes corePulse {
    0%, 100% { 
      opacity: 0.8;
      transform: scale(1);
      filter: blur(5px) brightness(1);
      box-shadow: 
        0 0 30px rgba(255, 255, 255, 0.9),
        0 0 60px rgba(255, 215, 0, 0.8);
    }
    50% { 
      opacity: 1;
      transform: scale(1.1);
      filter: blur(7px) brightness(1.3);
      box-shadow: 
        0 0 50px rgba(255, 255, 255, 1),
        0 0 100px rgba(255, 215, 0, 0.9);
    }
  }

  @keyframes particleGlow {
    0%, 100% {
      opacity: 0.6;
      filter: blur(0.5px) brightness(1);
    }
    50% {
      opacity: 1;
      filter: blur(1px) brightness(1.5);
    }
  }

  .tiny-sprites {
    position: absolute;
    inset: -50%;
    pointer-events: none;
    transform-style: preserve-3d;
    animation: rotateSprites 25s linear infinite;
    z-index: 4;
  }

  .tiny-sprite {
    position: absolute;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 1),
      rgba(255, 215, 0, 0.9) 30%,
      rgba(218, 165, 32, 0.7) 60%,
      transparent 100%
    );
    box-shadow: 
      0 0 10px rgba(255, 255, 255, 0.9),
      0 0 20px rgba(255, 215, 0, 0.8);
    transform-origin: center;
    animation: 
      spriteOrbit 12s linear infinite,
      spriteGlow 3s ease-in-out infinite,
      spritePulse 4s ease-in-out infinite;

    @for $i from 1 through 15 {
      &:nth-child(#{$i}) {
        --sprite-angle: #{$i * (360 / 15)}deg;
        --sprite-distance: #{35 + random(50)}px;
        --sprite-speed: #{8 + random(8)}s;
        --sprite-delay: #{random(5000)}ms;
        --sprite-size: #{4 + random(4)}px;
        width: var(--sprite-size);
        height: var(--sprite-size);
        animation: 
          spriteOrbit var(--sprite-speed) linear infinite,
          spriteGlow 3s ease-in-out infinite,
          spritePulse 4s ease-in-out infinite;
        animation-delay: var(--sprite-delay);

        &::before {
          content: '';
          position: absolute;
          inset: -50%;
          background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.4),
            rgba(255, 215, 0, 0.2) 50%,
            transparent 100%
          );
          filter: blur(2px);
          border-radius: 50%;
          animation: spriteTrailGlow 4s ease-in-out infinite;
          animation-delay: var(--sprite-delay);
        }

        &::after {
          content: '';
          position: absolute;
          inset: -100%;
          background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.2),
            rgba(255, 215, 0, 0.1) 50%,
            transparent 100%
          );
          filter: blur(4px);
          border-radius: 50%;
          animation: spriteAura 5s ease-in-out infinite;
          animation-delay: var(--sprite-delay);
        }
      }
    }
  }

  @keyframes rotateSprites {
    from { transform: rotate(0deg) scale(1); }
    to { transform: rotate(360deg) scale(1); }
  }

  @keyframes spriteOrbit {
    0% {
      transform: 
        rotate(var(--sprite-angle)) 
        translateX(var(--sprite-distance)) 
        rotate(calc(-1 * var(--sprite-angle)))
        scale(0.8);
    }
    50% {
      transform: 
        rotate(calc(var(--sprite-angle) + 180deg)) 
        translateX(calc(var(--sprite-distance) * 1.2)) 
        rotate(calc(-1 * var(--sprite-angle) - 180deg))
        scale(1.2);
    }
    100% {
      transform: 
        rotate(calc(var(--sprite-angle) + 360deg)) 
        translateX(var(--sprite-distance)) 
        rotate(calc(-1 * var(--sprite-angle) - 360deg))
        scale(0.8);
    }
  }

  @keyframes spriteGlow {
    0%, 100% {
      box-shadow: 
        0 0 10px rgba(255, 255, 255, 0.9),
        0 0 20px rgba(255, 215, 0, 0.8);
      filter: brightness(1);
    }
    50% {
      box-shadow: 
        0 0 15px rgba(255, 255, 255, 1),
        0 0 30px rgba(255, 215, 0, 0.9);
      filter: brightness(1.3);
    }
  }

  @keyframes spritePulse {
    0%, 100% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.3);
      opacity: 1;
    }
  }

  @keyframes spriteTrail {
    0%, 100% {
      filter: blur(1px) brightness(1);
    }
    50% {
      filter: blur(2px) brightness(1.5);
    }
  }

  @keyframes spriteTrailGlow {
    0%, 100% {
      opacity: 0.4;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.2);
    }
  }

  @keyframes spriteAura {
    0%, 100% {
      opacity: 0.2;
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(1.3);
    }
  }

  /* Enhanced active state */
  &.active {
    .tiny-sprite {
      animation-duration: 8s, 2s, 3s, 4s;
      
      &::before {
        animation-duration: 3s;
      }
      
      &::after {
        animation-duration: 4s;
      }
    }
    .magical-glow {
      animation-duration: 2s;
      opacity: 1;
      filter: blur(8px);
    }

    .accretion-disk {
      &::before, &::after {
        animation-duration: 4s;
        opacity: 1;
      }
    }

    .geometric-patterns .pattern {
      border-width: 3px;
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
    }

    .magical-runes .rune {
      animation-duration: 3s;
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
    }
    
    .energy-waves .wave {
      animation-duration: 3s;
      border-width: 4px;
      box-shadow: 0 0 25px rgba(255, 255, 255, 0.4);
    }
  }
`;

export default React.memo(Loader); 