import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { apiClient, MaestroApiError } from '../utils/apiClient';
import { maskApiKey } from './ApiKeyStorage';
import { useApiKey } from './ApiKeyContext';

const MIN_KEY_LENGTH = 16;

/**
 * Modal dialog for entering or updating the Maestro API key.
 *
 * Features:
 * - Show/hide password toggle
 * - Optional label for multiple keys
 * - Connection test before saving
 * - Displays masked existing key if present
 * - Accessible (focus trap, ESC to close)
 */
export const ApiKeyModal: React.FC = () => {
  const { t } = useTranslation();
  const { isModalOpen, modalReason, storedKey, setApiKey, clearKey, closeModal } =
    useApiKey();

  const [keyInput, setKeyInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isModalOpen) {
      setKeyInput('');
      setLabelInput(storedKey?.label ?? '');
      setShowKey(false);
      setTestError(null);
      setValidationError(null);
      setSuccessMessage(null);
    }
  }, [isModalOpen, storedKey]);

  const validateKey = (key: string): string | null => {
    if (!key) return t('apiKey.errors.required', 'API key is required');
    if (key.length < MIN_KEY_LENGTH) {
      return t(
        'apiKey.errors.tooShort',
        `API key must be at least ${MIN_KEY_LENGTH} characters`
      );
    }
    if (/\s/.test(key)) {
      return t('apiKey.errors.whitespace', 'API key must not contain spaces');
    }
    return null;
  };

  const handleTestConnection = async () => {
    const validationErr = validateKey(keyInput);
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }

    setIsTesting(true);
    setTestError(null);
    setSuccessMessage(null);

    try {
      await testConnectionWithKey(keyInput);
      setApiKey(keyInput.trim(), labelInput.trim() || undefined);
      setSuccessMessage(
        t('apiKey.modal.success', 'API key saved successfully!')
      );
      // Close modal after a short delay to show success message
      setTimeout(() => {
        closeModal();
      }, 1000);
    } catch (error) {
      if (error instanceof MaestroApiError) {
        if (error.isAuthError()) {
          setTestError(
            t('apiKey.errors.invalid', 'Invalid API key. Please check and try again.')
          );
        } else if (error.isRateLimited()) {
          setTestError(
            t('apiKey.errors.rateLimited', 'Too many attempts. Please wait a moment.')
          );
        } else {
          setTestError(
            t('apiKey.errors.connection', `Connection failed: ${error.toUserMessage()}`)
          );
        }
      } else {
        setTestError(
          t(
            'apiKey.errors.network',
            'Unable to reach Maestro API. Check that the server is running.'
          )
        );
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveWithoutTest = () => {
    const validationErr = validateKey(keyInput);
    if (validationErr) {
      setValidationError(validationErr);
      return;
    }
    setApiKey(keyInput.trim(), labelInput.trim() || undefined);
  };

  const handleClearKey = () => {
    clearKey();
    closeModal();
  };

  // Allow closing only if a key already exists (otherwise plugin won't work)
  const canClose = Boolean(storedKey);

  const handleClose = () => {
    if (canClose) {
      closeModal();
    }
  };

  return (
    <Dialog
      open={isModalOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={!canClose}
      aria-labelledby="api-key-modal-title"
    >
      <DialogTitle id="api-key-modal-title">
        {storedKey
          ? t('apiKey.modal.titleManage', 'Manage Maestro API Key')
          : t('apiKey.modal.title', 'Maestro API Key')}
      </DialogTitle>

      <DialogContent dividers>
        {modalReason && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {modalReason}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" paragraph>
          {t(
            'apiKey.modal.description',
            'Enter your Maestro API key to authenticate requests. The key is stored locally in your browser and sent only to the Maestro backend via the X-API-Key header.'
          )}
        </Typography>

        {storedKey && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {t('apiKey.modal.currentKey', 'Current key')}:{' '}
              <code>{maskApiKey(storedKey.key)}</code>
              {storedKey.label && (
                <Typography component="span" color="text.secondary">
                  {' '}
                  ({storedKey.label})
                </Typography>
              )}
            </Typography>
          </Alert>
        )}

        <FormControl fullWidth error={Boolean(validationError)} sx={{ mb: 2 }}>
          <TextField
            autoFocus
            label={t('apiKey.modal.keyLabel', 'API Key')}
            type={showKey ? 'text' : 'password'}
            value={keyInput}
            onChange={e => {
              setKeyInput(e.target.value);
              setValidationError(null);
              setTestError(null);
              setSuccessMessage(null);
            }}
            placeholder="Enter your API key"
            autoComplete="off"
            spellCheck={false}
            fullWidth
            required
            error={Boolean(validationError)}
            helperText={
              validationError ||
              t(
                'apiKey.modal.keyHelper',
                'Leave empty to keep the current key'
              )
            }
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowKey(s => !s)}
                    edge="end"
                    aria-label={showKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showKey ? '🙈' : '👁'}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </FormControl>

        <TextField
          label={t('apiKey.modal.labelLabel', 'Label (optional)')}
          value={labelInput}
          onChange={e => setLabelInput(e.target.value)}
          placeholder="e.g., Production key"
          fullWidth
          sx={{ mb: 2 }}
          inputProps={{ maxLength: 50 }}
        />

        {testError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {testError}
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary">
          {t(
            'apiKey.modal.hint',
            '💡 The key is stored only in your browser\'s local storage and is never ' +
            'included in the JavaScript bundle or URL. Generate a key on the backend with '
          )}
          <code>openssl rand -hex 32</code>
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
        <div>
          {storedKey && (
            <Button
              onClick={handleClearKey}
              color="error"
              variant="outlined"
              size="small"
              startIcon={<span>🗑️</span>}
            >
              {t('apiKey.modal.clear', 'Clear Key')}
            </Button>
          )}
        </div>

        <div>
          {canClose && (
            <Button onClick={handleClose} sx={{ mr: 1 }}>
              {t('common.cancel', 'Cancel')}
            </Button>
          )}
          <Button
            onClick={handleSaveWithoutTest}
            disabled={!keyInput || isTesting}
            sx={{ mr: 1 }}
          >
            {t('apiKey.modal.save', 'Save')}
          </Button>
          <Button
            onClick={handleTestConnection}
            variant="contained"
            disabled={!keyInput || isTesting}
          >
            {isTesting
              ? t('apiKey.modal.testing', 'Testing...')
              : t('apiKey.modal.testAndSave', 'Test & Save')}
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Test connection to Maestro API using a specific key.
 * This bypasses the normal apiClient to avoid triggering the 401 handler.
 */
async function testConnectionWithKey(key: string): Promise<void> {
  // Use a lightweight endpoint. '/nodesTree' is typically fast.
  const { buildServerUrl } = await import('../../config/server');
  const url = buildServerUrl('/nodesTree');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-Key': key,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }
    throw new MaestroApiError(
      `Test connection failed: ${response.statusText}`,
      response.status,
      response.statusText,
      '/nodesTree',
      details
    );
  }
}
