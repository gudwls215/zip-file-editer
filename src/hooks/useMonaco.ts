import { useEffect, useRef, useState } from 'react';
import { MonacoService } from '../services/monacoService';

export const useMonaco = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const monacoServiceRef = useRef<MonacoService | null>(null);

  useEffect(() => {
    const initMonaco = async () => {
      try {
        if (!monacoServiceRef.current) {
          monacoServiceRef.current = MonacoService.getInstance();
        }
        
        await monacoServiceRef.current.initializeMonaco();
        setIsReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Monaco');
      }
    };

    initMonaco();
  }, []);

  return {
    isReady,
    error,
    monacoService: monacoServiceRef.current,
  };
};
