import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Snackbar,
  TextField} from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { useEffect,useState } from 'react';
import { Link } from 'react-router-dom';
import { useHistory } from 'react-router-dom';

interface Cluster {
  id: number;
  name: string;
}

function isValidIpWithCidr(str) {
  if (!str.includes('/')) return false;
  const [ip, mask] = str.split('/');
  const maskNum = Number(mask);

  if (isNaN(maskNum) || maskNum < 0 || maskNum > 32) return false;

  const ipParts = ip.split('.');
  if (ipParts.length !== 4) return false;

  return ipParts.every(part => {
    const num = Number(part);
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part; // disallow leading zeros
  });
}

const scannedNetworls: React.FC<{ }> = ({  }) => {
  const [inputValue, setInputValue] = useState('');
  const [scanNets, setScanNets] = useState<Cluster[]>([]);
  const [error, setError] = useState('');
  const [errorGet, setErrorGet] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [loading, setLoading] = useState<boolean>(true);
  const history = useHistory();

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const talosURL = "http://127.0.0.1:5000/scanNets";
        const response = await fetch(talosURL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal, // bind abort signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const scanNets: ApiResponse = await response.json();
        setScanNets(scanNets['scanNets'])
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.debug('Fetch aborted');
          return;
        }
        setErrorGet(err.message || 'Failed to load data');
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

  if (loading) return <div>Loading cluster map...</div>;
  if (errorGet) return <div>Error: {errorGet}</div>;
  if (!scanNets) return <div>No data received</div>;

  const handleAdd = () => {
    const value = inputValue.trim();
    if (!value) {
      setError('The field cannot be empty');
      return;
    }

    if (!isValidIpWithCidr(value)) {
      setError('Invalid IP/mask format (example: 192.168.1.0/24)');
      return;
    }

    if (scanNets.includes(value)) {
      setError('This address has already been added');
      return;
    }
    setScanNets(prev => [...prev, value]);
    setInputValue('');
    setError('');
  };

  const handleRemove = (ipToRemove) => {
    setScanNets(prev => prev.filter(ip => ip !== ipToRemove));
  };

  const handleSubmit = async () => {
    if (scanNets.length === 0) {
      setSnackbar({ open: true, message: 'Empty network list', severity: 'warning' });
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/scanNets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ scanNets })
      });

      if (response.ok) {
        history.push('/maestro');
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      console.error(err);
      alert('ERR=' + err);
      setSnackbar({ open: true, message: 'Scan failed', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  return (
  <SectionBox>
  <Typography>
    <Link to="/maestro">Clusters</Link>
  </Typography>
    <Paper>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          fullWidth
          label="IP/mask (for example: 192.168.1.0/24)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          error={!!error}
          helperText={error}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <Button variant="contained" color="success" onClick={handleAdd}>
          Add
        </Button>
      </Box>
      {scanNets.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            List of scanned networks:
          </Typography>
          <List dense>
            {scanNets.map((ip) => (
              <ListItem
                key={ip}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleRemove(ip)}>
                    X
                  </IconButton>
                }
              >
                <ListItemText primary={ip} />
              </ListItem>
            ))}
          </List>
        </>
      )}

      <Button
        fullWidth
        variant="contained"
        color="success"
        onClick={handleSubmit}
        disabled={scanNets.length === 0}
        sx={{ mt: 2 }}
      >
        Scan
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Paper>
  </SectionBox>
  );
}

export default scannedNetworls;
