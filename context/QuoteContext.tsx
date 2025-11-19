import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Quote {
  q: string;  // quote text
  a: string;  // author
  h: string;  // HTML formatted quote
}

interface QuoteContextType {
  quote: Quote | null;
  loading: boolean;
  error: string | null;
}

const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

export const QuoteProvider = ({ children }: { children: ReactNode }) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('https://zenquotes.io/api/random');
        
        if (!response.ok) {
          throw new Error('Failed to fetch quote');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
          setQuote(data[0]);
        } else {
          throw new Error('No quote data received');
        }
      } catch (err) {
        console.error('Error fetching quote:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch quote');
        // Set a fallback quote
        setQuote({
          q: 'The journey of a thousand miles begins with one step.',
          a: 'Lao Tzu',
          h: 'The journey of a thousand miles begins with one step.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, []);

  return (
    <QuoteContext.Provider value={{ quote, loading, error }}>
      {children}
    </QuoteContext.Provider>
  );
};

export const useQuote = () => {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error('useQuote must be used within a QuoteProvider');
  }
  return context;
};
