import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import Alert, { AlertColor } from '@mui/material/Alert';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { buildServerUrl } from '../../config/server';
import PageHeader from '../shared/ui/PageHeader';
import { apiClient, MaestroApiError } from '../../shared/utils/apiClient';
import { useApiErrorHandler } from '../../shared/auth/useApiErrorHandler';

function isValidIpWithCidr(value: string) {
  if (!value.includes('/')) return false;
  const [ip, mask] = value.split('/');
  const maskNum = Number(mask);

  if (Number.isNaN(maskNum) || maskNum < 0 || maskNum > 32) return false;

  const ipParts = ip.split('.');
  if (ipParts.length !== 4) return false;

  return ipParts.every(part => {
    const num = Number(part);
    return !Number.isNaN(num) && num >= 0 && num <= 255 && String(num) === part;
  });
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

const ScanNetworksPage: React.FC<{}> = () => {
  const safeApiCall = useApiErrorHandler();
  const { t } = useTranslation();
  const failedToLoadDataText = t('common.failedToLoadData');
  const [inputValue, setInputValue] = useState('');
  const [scanNetworks, setScanNetworks] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const history = useHistory();

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const payload = await safeApiCall(() =>
          apiClient.get<{ scanNets?: string[] }>('/scanNets', {
            signal: controller.signal,
          })
        );
        setScanNetworks(payload.scanNets ?? []);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        if (err instanceof MaestroApiError) {
          setFetchError(err.toUserMessage());
        } else {
          setFetchError(err.message || failedToLoadDataText);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchData();

    return () => {
      controller.abort();
    };
  }, [failedToLoadDataText]);

  const handleAdd = () => {
    const value = inputValue.trim();
    if (!value) {
      setFormError(t('scanNetworks.emptyField'));
      return;
    }

    if (!isValidIpWithCidr(value)) {
      setFormError(t('scanNetworks.invalidFormat'));
      return;
    }

    if (scanNetworks.includes(value)) {
      setFormError(t('scanNetworks.duplicateAddress'));
      return;
    }

    setScanNetworks(prev => [...prev, value]);
    setInputValue('');
    setFormError('');
  };

  const handleRemove = (networkToRemove: string) => {
    setScanNetworks(prev => prev.filter(network => network !== networkToRemove));
  };

  const handleSubmit = async () => {
    if (scanNetworks.length === 0) {
      setSnackbar({ open: true, message: t('scanNetworks.addAtLeastOne'), severity: 'warning' });
      return;
    }

    try {
      await apiClient.postNoContent('/scanNets', { scanNets: scanNetworks });
      history.push('/maestro');
    } catch (err) {
      if (err instanceof MaestroApiError) {
        console.error(t('clustersPage.requestFailed'), err.toUserMessage());
        setSnackbar({ open: true, message: t('scanNetworks.requestFailed') + `: ${err.toUserMessage()}`, severity: 'error' });
      } else {
        console.error(t('clustersPage.requestFailed'), err);
        setSnackbar({ open: true, message: t('scanNetworks.requestFailed') + `: ${err}`, severity: 'error' });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <SectionBox title="" textAlign="left" paddingTop={2}>
      <PageHeader
        breadcrumbs={[{ label: t('common.clusters'), to: '/maestro' }, { label: t('scanNetworks.breadcrumb') }]}
        subtitle={t('scanNetworks.subtitle')}
        title={t('scanNetworks.title')}
      />

      {loading && <Alert severity="info">{t('scanNetworks.loadingSettings')}</Alert>}
      {fetchError && <Alert severity="error">{fetchError}</Alert>}

      {!loading && !fetchError && (
        <Paper sx={{ p: 2 }} variant="outlined">
          <Stack spacing={2}>
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1}>
              <TextField
                error={Boolean(formError)}
                fullWidth
                helperText={formError || t('scanNetworks.cidrHint')}
                label={t('scanNetworks.cidrLabel')}
                onChange={event => setInputValue(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAdd();
                  }
                }}
                value={inputValue}
              />
              <Button onClick={handleAdd} sx={{ minWidth: 140 }} variant="contained">
                {t('scanNetworks.addNetwork')}
              </Button>
            </Stack>

            <Box>
              <Typography sx={{ mb: 1 }} variant="subtitle1">
                {t('scanNetworks.networksToScan')}
              </Typography>
              {scanNetworks.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  {t('scanNetworks.noNetworks')}
                </Typography>
              ) : (
                <List dense sx={{ border: theme => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                  {scanNetworks.map(network => (
                    <ListItem key={network}>
                      <ListItemText primary={network} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemove(network)}>
                          {t('common.remove')}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Button disabled={scanNetworks.length === 0} onClick={handleSubmit} size="large" variant="contained">
              {t('scanNetworks.startScan')}
            </Button>
          </Stack>
        </Paper>
      )}

      <Snackbar autoHideDuration={3000} onClose={handleCloseSnackbar} open={snackbar.open}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SectionBox>
  );
};

export default ScanNetworksPage;
