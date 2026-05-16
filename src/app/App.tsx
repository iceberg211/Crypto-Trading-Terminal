import { useEffect } from 'react';
import { Provider } from 'jotai';
import { TradingLayout } from '@/components/layout/TradingLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { exchangeInfo } from '@/core/config';
import { logger } from '@/utils/logger';

function App() {
  // 应用启动时初始化 ExchangeInfo
  useEffect(() => {
    exchangeInfo.initialize().then(() => {
      logger.debug('[App] ExchangeInfo initialized:', exchangeInfo.getStatus());
    });
  }, []);

  return (
    <Provider>
      <ErrorBoundary>
        <div className="min-h-screen bg-bg text-text-primary font-body">
          <TradingLayout />
        </div>
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
