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
import PageHeader from '../shared/ui/PageHeader';

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
        const talosUrl = 'http://127.0.0.1:5000/scanNets';
        const response = await fetch(talosUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const payload: any = await response.json();
        setScanNetworks(payload.scanNets ?? []);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        setFetchError(err.message || 'Failed to load data');
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
  }, []);

  const handleAdd = () => {
    const value = inputValue.trim();
    if (!value) {
      setFormError('The field cannot be empty');
      return;
    }

    if (!isValidIpWithCidr(value)) {
      setFormError('Invalid IP/mask format. Example: 192.168.1.0/24');
      return;
    }

    if (scanNetworks.includes(value)) {
      setFormError('This address has already been added');
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
      setSnackbar({ open: true, message: 'Add at least one network before scanning', severity: 'warning' });
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/scanNets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scanNets: scanNetworks }),
      });

      if (response.ok) {
        history.push('/maestro');
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Network scan request failed', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <SectionBox title="" textAlign="left" paddingTop={2}>
      <PageHeader
        breadcrumbs={[{ label: 'Clusters', to: '/maestro' }, { label: 'Scan networks' }]}
        subtitle="Define CIDR ranges that the backend should scan for cluster discovery."
        title="Network scanner"
      />

      {loading && <Alert severity="info">Loading network settings...</Alert>}
      {fetchError && <Alert severity="error">{fetchError}</Alert>}

      {!loading && !fetchError && (
        <Paper sx={{ p: 2 }} variant="outlined">
          <Stack spacing={2}>
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={1}>
              <TextField
                error={Boolean(formError)}
                fullWidth
                helperText={formError || 'Use CIDR notation, e.g. 10.0.0.0/24'}
                label="Network CIDR"
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
                Add network
              </Button>
            </Stack>

            <Box>
              <Typography sx={{ mb: 1 }} variant="subtitle1">
                Networks to scan
              </Typography>
              {scanNetworks.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  No networks added yet.
                </Typography>
              ) : (
                <List dense sx={{ border: theme => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                  {scanNetworks.map(network => (
                    <ListItem key={network}>
                      <ListItemText primary={network} />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleRemove(network)}>
                          Remove
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            <Button disabled={scanNetworks.length === 0} onClick={handleSubmit} size="large" variant="contained">
              Start scan
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
