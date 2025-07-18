// Simple Material Icons loader for MVP (loads from Google Fonts CDN)
import React, { useEffect } from 'react';
export default function MaterialIcons() {
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);
  return null;
}
