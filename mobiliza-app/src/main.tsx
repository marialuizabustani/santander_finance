import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import { App } from './App';
import { ProvedorEstado } from './state/estado';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProvedorEstado>
      <App />
    </ProvedorEstado>
  </React.StrictMode>,
);
