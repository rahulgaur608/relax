import React, { useState } from 'react';
import styled from 'styled-components';

const Loader = () => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <StyledWrapper onMouseEnter={() => setShowInfo(true)} onMouseLeave={() => setShowInfo(false)}>
      <div className="cube-loader">
        <div className="cube-top" />
        <div className="cube-wrapper">
          <span style={{'--i': 0} as React.CSSProperties} className="cube-span" />
          <span style={{'--i': 1} as React.CSSProperties} className="cube-span" />
          <span style={{'--i': 2} as React.CSSProperties} className="cube-span" />
          <span style={{'--i': 3} as React.CSSProperties} className="cube-span" />
        </div>
      </div>
      
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

  .cube-loader {
    position: relative;
    width: 75px;
    height: 75px;
    transform-style: preserve-3d;
    transform: rotateX(-30deg);
    animation: animate 4s linear infinite;
  }

  @keyframes animate {
    0% {
      transform: rotateX(-30deg) rotateY(0);
    }

    100% {
      transform: rotateX(-30deg) rotateY(360deg);
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

  @keyframes rainbow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

export default Loader; 