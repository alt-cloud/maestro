import { Breadcrumbs, Link as MuiLink, Stack, Typography } from '@mui/material';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

export interface PageBreadcrumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: PageBreadcrumb[];
}

function PageHeader({ title, subtitle, breadcrumbs = [] }: PageHeaderProps) {
  return (
    <Stack spacing={0.75} sx={{ mb: 2 }}>
      <Typography variant="h5">{title}</Typography>
      {breadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="breadcrumb" sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap' } }}>
          {breadcrumbs.map(item =>
            item.to ? (
              <MuiLink key={`${item.to}-${item.label}`} component={RouterLink} color="inherit" to={item.to} underline="hover">
                {item.label}
              </MuiLink>
            ) : (
              <Typography key={item.label} color="text.primary">
                {item.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      {subtitle && (
        <Typography color="text.secondary" variant="body2">
          {subtitle}
        </Typography>
      )}
    </Stack>
  );
}

export default PageHeader;
