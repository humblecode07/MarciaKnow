import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

if (import.meta.hot) {
  import.meta.hot.accept();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={(queryClient)}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
