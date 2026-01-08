import React, { useEffect, useRef, useState } from 'react';
import { Button, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { writeTokens, setAuthStorage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface GoogleSignInProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  organizationId?: string;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
  block?: boolean;
}

declare global {
  interface Window {
    google: any;
    googleSignInCallback: (response: any) => void;
  }
}

const GoogleSignIn: React.FC<GoogleSignInProps> = ({
  onSuccess,
  onError,
  organizationId,
  disabled = false,
  size = 'large',
  block = false
}) => {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();
  const btnRef = useRef<HTMLDivElement | null>(null);
  const [gsiRendered, setGsiRendered] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = async () => {
      const base = (window as any)?.ENV?.REACT_APP_API_URL || process.env.REACT_APP_API_URL || '/api';
      try {
        const envCid = (window as any)?.ENV?.REACT_APP_GOOGLE_CLIENT_ID || process.env.REACT_APP_GOOGLE_CLIENT_ID;
        let cid = envCid as string | undefined;
        if (!cid) {
          const r = await fetch(`${base}/auth/google/config`);
          const j = await r.json().catch(() => ({}));
          if (j?.success && j?.data?.clientId) cid = j.data.clientId;
        }
        if (!cid) {
          // Google Sign-In not configured - component will render empty
          return;
        }
        setClientId(cid);
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: cid,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          if (btnRef.current) {
            window.google.accounts.id.renderButton(btnRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: 'continue_with',
              logo_alignment: 'left',
              width: 250,
            });
            setGsiRendered(true);
          }
        }
      } catch (e) {
        console.log('Google Sign-In not available:', e);
        // Silently fail - Google Sign-In is optional
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      const { credential } = response;
      
      if (!credential) {
        throw new Error('No credential received from Google');
      }

      // Send ID token to backend
      const base = (window as any)?.ENV?.REACT_APP_API_URL || process.env.REACT_APP_API_URL || '/api';
      const apiResponse = await fetch(`${base}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idToken: credential,
          organizationId: organizationId
        }),
      });

      const data = await apiResponse.json();

      if (data.success) {
        const accessToken = data?.data?.accessToken;
        const refreshToken = data?.data?.refreshToken;
        setAuthStorage('local');
        writeTokens(accessToken, refreshToken);
        // Update AuthContext user immediately
        await refreshMe();

        message.success('Successfully signed in with Google!');
        
        // Immediately fetch current user profile to decide redirect (parity with AuthContext.login)
        try {
          const meRes = await fetch(`${base}/users/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          if (meRes.ok) {
            const me = await meRes.json();
            const role = String(me?.role || '').toLowerCase();
            if (role === 'admin' || role === 'super_admin') navigate('/admin/appointments', { replace: true });
            else if (role === 'doctor') navigate('/queue/doctor', { replace: true });
            else if (role === 'nurse') navigate('/queue/triage', { replace: true });
            else if (role === 'receptionist') navigate('/queue/reception', { replace: true });
            else if (role === 'pharmacist') navigate('/pharmacy', { replace: true });
            else if (role === 'lab_technician') navigate('/laboratory/dashboard', { replace: true });
            else if (role === 'accountant') navigate('/billing/management', { replace: true });
            else if (role === 'patient') navigate('/portal', { replace: true });
            else navigate('/', { replace: true });
          } else {
            // Fallback to home if profile fetch fails
            navigate('/', { replace: true });
          }
        } catch {
          navigate('/', { replace: true });
        }

        if (onSuccess) {
          onSuccess(data.data.user);
        }
      } else {
        throw new Error(data.message || 'Google authentication failed');
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      message.error(error.message || 'Google Sign-In failed');
      
      if (onError) {
        onError(error.message);
      }
    }
  };

  const handleGoogleSignIn = () => {
    if (window.google) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification?.isNotDisplayed()) {
          console.warn('Google prompt not displayed:', notification.getNotDisplayedReason?.());
          message.error('Google Sign-In could not open. Check popup blockers or try again.');
        }
      });
    } else {
      message.error('Google Sign-In not loaded. Please refresh the page.');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div ref={btnRef} style={{ display: 'block', width: block ? '100%' : 'auto' }} />
      {!gsiRendered && (
        <Button
          type="default"
          size={size}
          block={block}
          disabled={disabled}
          icon={<GoogleOutlined />}
          onClick={handleGoogleSignIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderColor: '#4285f4',
            color: '#4285f4',
            marginTop: 0,
          }}
        >
          Continue with Google
        </Button>
      )}
    </div>
  );
};

export default GoogleSignIn;
