import React from 'react';
import './ScrollContainer.css';

const ScrollContainer = ({
  children,
  className = '',
  innerClassName = '',
  nowrap = false,
  minWidth,
  style,
}) => {
  const innerStyle = minWidth ? { minWidth } : undefined;

  return (
    <div className={`scroll-container ${className}`} style={style}>
      <div
        className={`scroll-container__inner ${nowrap ? 'scroll-container__inner--nowrap' : ''} ${innerClassName}`}
        style={innerStyle}
      >
        {children}
      </div>
    </div>
  );
};

export default ScrollContainer;