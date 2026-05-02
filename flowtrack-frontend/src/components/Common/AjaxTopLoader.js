import React from 'react';
import { useAjax } from '../../context/AjaxContext';
import './AjaxTopLoader.css';

const AjaxTopLoader = () => {
  const { isLoading } = useAjax();
  return <div className={`ajax-top-loader ${isLoading ? 'show' : ''}`} />;
};

export default AjaxTopLoader;