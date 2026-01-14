import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { UserProvider } from './providers/UserProvider';
import { NutrientProvider } from './providers/NutrientProvider';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <UserProvider>
          <NutrientProvider>
            <App />
          </NutrientProvider>
        </UserProvider>
      </QueryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
