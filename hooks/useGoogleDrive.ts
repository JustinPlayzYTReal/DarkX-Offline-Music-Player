declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

import { useState, useEffect, useCallback, useRef } from 'react';

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
type PickerCallback = (files: File[]) => void;

// NOTE: This hook is currently not fully functional as the API key/Client ID
// configuration has been removed from the new theme system.
// A new settings section for integrations would be needed to restore this.
export const useGoogleDrive = () => {
  // Hardcoded for now, would need a new settings store
  const apiKey = undefined;
  const clientId = undefined;

  const [isGapiReady, setIsGapiReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickerCallback = useRef<PickerCallback | null>(null);
  const tokenClient = useRef<any>(null);
  
  const isConfigured = !!(apiKey && clientId);

  const downloadFile = useCallback(async (fileId: string, fileName: string, mimeType: string, token: string): Promise<File> => {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`);
    const blob = await response.blob();
    return new File([blob], fileName, { type: mimeType });
  }, []);

  const createPicker = useCallback((token: string) => {
    if (!clientId || !apiKey) return;
    const view = new window.google.picker.View(window.google.picker.ViewId.AUDIO);
    const picker = new window.google.picker.PickerBuilder()
      .setAppId(clientId.split('-')[0])
      .setOAuthToken(token)
      .setDeveloperKey(apiKey)
      .addView(view)
      .setCallback(async (data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          try {
            setError(null);
            const filePromises = data.docs.map((doc: any) =>
              downloadFile(doc.id, doc.name, doc.mimeType, token)
            );
            const files = await Promise.all(filePromises);
            if (pickerCallback.current) {
              pickerCallback.current(files);
            }
          } catch (err: any) {
            console.error("Error downloading from Drive:", err);
            setError(`Failed to download files: ${err.message}`);
          }
        }
      })
      .build();
    picker.setVisible(true);
  }, [apiKey, clientId, downloadFile]);

  useEffect(() => {
    const checkGoogleScripts = () => {
      if (window.gapi && window.google) {
        // GAPI client is separate and also needs init for picker.
        window.gapi.load('picker', () => {
            setIsGapiReady(true);
        });
        return true;
      }
      return false;
    };

    if (checkGoogleScripts()) return;

    const intervalId = setInterval(() => {
      if (checkGoogleScripts()) {
        clearInterval(intervalId);
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, []);
  
  useEffect(() => {
    if (isGapiReady && isConfigured && clientId) {
      try {
        if (!tokenClient.current) {
            tokenClient.current = window.google.accounts.oauth2.initTokenClient({
              client_id: clientId,
              scope: SCOPES,
              callback: (tokenResponse: any) => {
                if (tokenResponse.error) {
                  setError(`Google Auth Error: ${tokenResponse.error_description || tokenResponse.error}`);
                  console.error('Auth error:', tokenResponse);
                  return;
                }
                if (tokenResponse.access_token) {
                    createPicker(tokenResponse.access_token);
                }
              },
            });
        }
      } catch (e: any) {
        console.error("Error initializing Google services:", e);
        setError(`Initialization failed: ${e.message}. Check your configuration.`);
      }
    }
  }, [isGapiReady, isConfigured, clientId, createPicker]);

  useEffect(() => {
      if (isGapiReady && !isConfigured) {
          setError("Google Drive is not configured in Settings.");
      }
  }, [isGapiReady, isConfigured])


  const openPicker = useCallback((callback: PickerCallback) => {
    setError(null);
    if (!isConfigured) {
      setError("Google Drive is not configured. Please add API Key and Client ID in Settings.");
      return;
    }
    if (!isGapiReady || !tokenClient.current) {
      setError("Google Drive integration is not ready. Please wait a moment and try again.");
      return;
    }
    
    pickerCallback.current = callback;
    tokenClient.current.requestAccessToken({ prompt: 'consent' });
  }, [isGapiReady, isConfigured]);

  return { isReady: isGapiReady && isConfigured, error, openPicker };
};