import React, { useState, useEffect } from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';

import {
  Box,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import { useHistory } from 'react-router-dom';


// import { Delete } from '@mui/icons-material';
// import DeleteIcon from '@mui/icons-material/Delete';


import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

// test than module loads
interface Cluster {
  id: number;
  name: string;
}

const handleRemove = (ipToRemove) => {
  alert(ipToRemove);
  setScanNets(prev => prev.filter(ip => ip !== ipToRemove));
};

// Функция валидации IP-адреса с маской (CIDR)
function isValidIpWithCidr(str) {
  if (!str.includes('/')) return false;
  const [ip, mask] = str.split('/');
  const maskNum = Number(mask);

  if (isNaN(maskNum) || maskNum < 0 || maskNum > 32) return false;

  const ipParts = ip.split('.');
  if (ipParts.length !== 4) return false;

  return ipParts.every(part => {
    const num = Number(part);
    return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part; // запрещаем ведущие нули
  });
}

const scannedNetworls: React.FC<{ }> = ({  }) => {
  const [inputValue, setInputValue] = useState('');
  const [scanNets, setScanNets] = useState<Cluster[]>([]);
  const [error, setError] = useState('');
  const [errorGet, setErrorGet] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  const location = useLocation();
  // Парсим query параметры
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

  const path = location.pathname.split('/');
  const indexNode = path.indexOf('node')
  const commands = path.slice(indexNode+1)
  const commandPath = commands.join('/')
  const fullCommand = commands.join(' ')
  // alert('PATH='+path+' fullCommand='+fullCommand);

  useEffect(() => {
    // Создаём контроллер отмены
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const talosURL = "http://127.0.0.1:5000/scanNets";
//         alert(talosURL);
        const response = await fetch(talosURL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal, // ← привязываем сигнал отмены
        });

        // Если запрос был отменён, response.json() не вызовется
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const scanNets: ApiResponse = await response.json();
//         alert(JSON.stringify(scanNets));
        setScanNets(scanNets['scanNets'])
      } catch (err: any) {
        // Игнорируем ошибку отмены
        if (err.name === 'AbortError') {
//           alert('Fetch aborted');
          console.debug('Fetch aborted');
          return;
        }
        setErrorGet(err.message || 'Failed to load data');
      } finally {
        // Убираем состояние загрузки, даже если запрос отменили или упал
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup: отменяем запрос при размонтировании или повторном запуске эффекта
    return () => {
      controller.abort();
    };
  }, []);

  if (loading) return <div>Loading cluster map...</div>;
  if (errorGet) return <div>Error: {errorGet}</div>;
  if (!scanNets) return <div>No data received</div>;
//   alert('IpList='+scanNets + ' LEN=' + scanNets.length);

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

//       alert(JSON.stringify(response));
      if (response.ok) {
        history.push('/maestro');
//         setSnackbar({ open: true, message: 'Successful scan!', severity: 'success' });
        // Опционально: очистить список после отправки
        // setScanNets([]);
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
//   alert('inputValue=' + inputValue);
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
