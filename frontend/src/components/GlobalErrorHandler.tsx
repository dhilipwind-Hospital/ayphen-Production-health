import React, { useEffect, useState } from 'react';
import { Alert, Button, Modal } from 'antd';
import { CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';

interface ErrorState {
  visible: boolean;
  message: string;
  details?: string;
}

const GlobalErrorHandler: React.FC = () => {
  const [error, setError] = useState<ErrorState>({
    visible: false,
    message: '',
  });

  useEffect(() => {
    // Create a global error event listener
    const handleGlobalError = (event: Event) => {
      if (event instanceof CustomEvent && event.detail) {
        const { message, details } = event.detail;
        setError({
          visible: true,
          message: message || 'An unexpected error occurred',
          details,
        });
      }
    };

    // Listen for custom error events
    window.addEventListener('app:error', handleGlobalError);

    // Override the default fetch error handling
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Handle HTTP errors (4xx, 5xx)
        if (!response.ok && response.status >= 500) {
          const errorEvent = new CustomEvent('app:error', {
            detail: {
              message: `Server error (${response.status})`,
              details: `The server encountered an error while processing your request. Please try again later.`,
            },
          });
          window.dispatchEvent(errorEvent);
        }
        
        return response;
      } catch (error) {
        // Handle network errors
        const errorEvent = new CustomEvent('app:error', {
          detail: {
            message: 'Network error',
            details: 'Unable to connect to the server. Please check your internet connection and try again.',
          },
        });
        window.dispatchEvent(errorEvent);
        throw error;
      }
    };

    return () => {
      window.removeEventListener('app:error', handleGlobalError);
      window.fetch = originalFetch;
    };
  }, []);

  const closeError = () => {
    setError({ ...error, visible: false });
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CloseCircleOutlined style={{ color: '#f5222d' }} />
          <span>Error</span>
        </div>
      }
      open={error.visible}
      onCancel={closeError}
      footer={[
        <Button key="close" onClick={closeError}>
          Close
        </Button>,
        <Button
          key="reload"
          type="primary"
          icon={<ReloadOutlined />}
          onClick={() => window.location.reload()}
        >
          Reload Page
        </Button>,
      ]}
    >
      <Alert
        message={error.message}
        description={error.details}
        type="error"
        showIcon
      />
    </Modal>
  );
};

// Helper function to trigger global errors
export const showGlobalError = (message: string, details?: string) => {
  const errorEvent = new CustomEvent('app:error', {
    detail: { message, details },
  });
  window.dispatchEvent(errorEvent);
};

export default GlobalErrorHandler;
