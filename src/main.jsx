import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import MaterialIcons from './components/MaterialIcons';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MaterialIcons />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
