import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Badge,
  IconButton,
  Tooltip,
  Typography,
  Box,
} from '@mui/material';
import React from 'react';
import { maskApiKey } from './ApiKeyStorage';
import { useApiKey } from './ApiKeyContext';

/**
 * Settings button for managing the Maestro API key.
 *
 * Features:
 * - Visual indicator of key status (green = valid, red = missing)
 * - Tooltip with masked key info
 * - Opens ApiKeyModal on click
 * - Accessible (keyboard navigation, ARIA labels)
 */
export const ApiKeySettingsButton: React.FC = () => {
  const { t } = useTranslation();
  const { storedKey, hasKey, requestKey } = useApiKey();

  const handleClick = () => {
    // Open modal. If key exists, pass a neutral reason.
    // If key is missing, pass a warning reason.
    requestKey(
      hasKey
        ? undefined
        : t('apiKey.settings.noKeyWarning', 'API key is not configured')
    );
  };

  // Build tooltip content
  const tooltipContent = hasKey ? (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>
        {t('apiKey.settings.keyConfigured', 'API key configured')}
      </Typography>
      <Typography variant="caption" display="block" component="code" sx={{ fontSize: '0.7rem' }}>
        {maskApiKey(storedKey!.key)}
      </Typography>
      {storedKey!.label && (
        <Typography variant="caption" display="block" color="text.secondary">
          {storedKey!.label}
        </Typography>
      )}
      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
        {t('apiKey.settings.clickToManage', 'Click to manage')}
      </Typography>
    </Box>
  ) : (
    <Box sx={{ p: 0.5 }}>
      <Typography variant="caption" display="block" color="error" sx={{ fontWeight: 600 }}>
        {t('apiKey.settings.noKey', 'No API key configured')}
      </Typography>
      <Typography variant="caption" display="block">
        {t('apiKey.settings.clickToConfigure', 'Click to configure')}
      </Typography>
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} arrow placement="bottom" enterDelay={300}>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-label={t('apiKey.settings.ariaLabel', 'API key settings')}
        sx={{
          ml: 1,
          color: hasKey ? 'success.main' : 'error.main',
          '&:hover': {
            backgroundColor: hasKey ? 'success.light' : 'error.light',
            color: hasKey ? 'success.contrastText' : 'error.contrastText',
          },
        }}
      >
        <Badge
          variant="dot"
          color={hasKey ? 'success' : 'error'}
          invisible={false}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {/* Key icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
          </svg>
        </Badge>
      </IconButton>
    </Tooltip>
  );
};
