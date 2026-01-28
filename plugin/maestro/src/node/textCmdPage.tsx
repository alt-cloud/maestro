import React, { useState, useEffect } from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { Box } from '@mui/material';
import {
  Paper
} from '@mui/material';

import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useRef } from 'react';

// test than module loads
interface Cluster {
  id: number;
  name: string;
}

const INTERVAL_OPTIONS = [
  { label: '1 second', value: 1000 },
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
  { label: 'Off', value: null },
] as const;

function alignInterval(delay) {
  if (typeof delay === 'undefined' || Number.isNaN(Number(delay)) || Number(delay) <= 0 ) {
    delay = null;
  }
  let alignDelay = null;
  if (delay) {
    delay = Number(delay) * 1000;
    let lastValue = 0;
    for (let option of INTERVAL_OPTIONS) {
      if (option.value === null) break;
      if (delay <= option.value) {
        alignDelay = option.value;
        break;
      }
      lastValue = option.value;
    }
    if (alignDelay === null) alignDelay = lastValue;
//     alert('alignDelay=' + alignDelay);
  }
  return alignDelay;
}

const TalosTextCmdInfo: React.FC<{ }> = ({ delay }) => {
  const [timeout, setTimeout] = useState<IntervalValue>(alignInterval(delay));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [page, setPage] = useState(0);
  const [content, setContent] = useState<Cluster[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const cluster = queryParams.cluster;
  const controlplane = queryParams.controlplane;
  const node = queryParams.node;
  const nodeType = queryParams.type;

  useEffect(() => {
    // Если фича отключена — ничего не делаем

    // Создаём контроллер отмены
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const talosURL = "http://localhost:5000/talosctl?cluster="+cluster+"&n="+node+"&cmd=" + commandPath;
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

        const restReply: ApiResponse = await response.json();
//         alert(JSON.stringify(restReply['content']));
        setContent(restReply['content'])
      } catch (err: any) {
        // Игнорируем ошибку отмены
        if (err.name === 'AbortError') {
//           alert('Fetch aborted');
          console.debug('Fetch aborted');
          return;
        }
        setError(err.message || 'Failed to load data');
      } finally {
        // Убираем состояние загрузки, даже если запрос отменили или упал
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    if (timeout === null) {
      fetchData();
      return () => {
        controller.abort();
      };
    }
    fetchData();
    const id = setInterval(fetchData, timeout);
    intervalRef.current = id;
    // Cleanup: отменяем запрос при размонтировании или повторном запуске эффекта
    return () => {
      clearInterval(id);
      controller.abort();
    };
  }, [timeout]);

  if (loading) return <div>Loading cluster map...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!content) return <div>No data received</div>;
//   alert('CONTENT='+content);
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Обработчик изменения выбора
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'null' ? null : Number(e.target.value);
    setTimeout(value as IntervalValue);
  };

  return (
  <SectionBox>
  <Typography><Link to="/maestro">Clusters</Link
  >&nbsp;/&nbsp;<Link to={`/maestro?cluster=${cluster}`}>{cluster}</Link
  > &nbsp;/&nbsp;<Link to={`/maestro/?cluster=${cluster}&type=${nodeType}`}>{nodeType}</Link
  >&nbsp;/&nbsp;<Link to={`/maestro/node?cluster=${cluster}&type=${nodeType}&controlplane=${controlplane}&node=${node}`}>{node}</Link
  >&nbsp;/&nbsp;{fullCommand}</Typography>
    <Paper>
      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="interval-select">Update interval: </label>
        <select
          id="interval-select"
          value={timeout ?? 'null'}
          onChange={handleIntervalChange}
        >
          {INTERVAL_OPTIONS.map((option) => (
            <option key={option.value?.toString() || 'null'} value={option.value ?? 'null'}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Box sx={{ maxHeight: 'calc(100vh - 120px)', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
        {content}
      </Box>
    </Paper>
  </SectionBox>
  );
}

export default TalosTextCmdInfo;
