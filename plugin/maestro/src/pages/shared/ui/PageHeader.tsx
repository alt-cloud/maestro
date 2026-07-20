import {
  Box,
  Breadcrumbs,
  Link as MuiLink,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { ApiKeySettingsButton } from '../../../shared/auth/ApiKeySettingsButton';

export interface PageBreadcrumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: PageBreadcrumb[];
  /**
   * Whether to show the API key settings button on the right side.
   * Defaults to true. Set to false to hide the button (e.g., on login pages).
   */
  showApiKeySettings?: boolean;
}

function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  showApiKeySettings = true,
}: PageHeaderProps) {

  return (
    <Stack spacing={1}>
      {/* Top row: Title on the left, API key settings button on the right */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {showApiKeySettings && <ApiKeySettingsButton />}
      </Box>

      {/* Breadcrumbs row */}
      {breadcrumbs.length > 0 && (
        <Breadcrumbs>
          {breadcrumbs.map(item =>
            item.to ? (
              <MuiLink component={RouterLink} to={item.to} key={item.label}>
                {item.label}
              </MuiLink>
            ) : (
              <Typography key={item.label}>{item.label}</Typography>
            )
          )}
        </Breadcrumbs>
      )}

      {/* Subtitle row */}
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Stack>
  );
}

export default PageHeader;
