import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster 
      position="bottom-right"
      toastOptions={{
        success: {
          style: {
            background: '#F0FDF4',
            color: '#166534',
            border: '1px solid #BBF7D0'
          },
        },
        error: {
          style: {
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FECACA'
          },
        },
      }}
    />
  </StrictMode>,
)