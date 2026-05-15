import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import App from './App'
import './styles/globals.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <Toaster position="bottom-right" toastOptions={{ duration: 4000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: '13px', borderRadius: '8px' },
          success: { style: { background: '#f0fdf4', border: '1px solid rgba(22,163,74,0.3)', color: '#15803d' } },
          error: { style: { background: '#fef2f2', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626' } },
        }} />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
