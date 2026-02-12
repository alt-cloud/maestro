import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';
import {
  Paper
} from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

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

type IntervalValue = typeof INTERVAL_OPTIONS[number]['value'];

function alignInterval(delay) {
  let normalizedDelay = delay;
  if (typeof normalizedDelay === 'undefined' || Number.isNaN(Number(normalizedDelay)) || Number(normalizedDelay) <= 0 ) {
    normalizedDelay = null;
  }
  let alignDelay = null;
  if (normalizedDelay) {
    normalizedDelay = Number(normalizedDelay) * 1000;
    let lastValue = 0;
    for (const option of INTERVAL_OPTIONS) {
      if (option.value === null) break;
      if (normalizedDelay <= option.value) {
        alignDelay = option.value;
        break;
      }
      lastValue = option.value;
    }
    if (alignDelay === null) alignDelay = lastValue;
  }
  return alignDelay;
}

const TextCommandPage: React.FC<{ delay?: string | number | null }> = ({ delay }) => {
  const [timeout, setTimeout] = useState<IntervalValue>(alignInterval(delay));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [content, setContent] = useState<Cluster[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

  const pathParts = location.pathname.split('/');
  const nodePathIndex = pathParts.indexOf('node')
  const commandParts = pathParts.slice(nodePathIndex + 1)
  const commandPath = commandParts.join('/')
  const fullCommand = commandParts.join(' ')

  const cluster = queryParams.cluster;
  const controlPlane = queryParams.controlplane;
  const node = queryParams.node;
  const nodeType = queryParams.type;

  useEffect(() => {

    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const talosUrl = "http://localhost:5000/talosctl?cluster="+cluster+"&n="+node+"&cmd=" + commandPath;
        const response = await fetch(talosUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal, // bind abort signal
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const responsePayload: ApiResponse = await response.json();
        setContent(responsePayload['content'])
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.debug('Fetch aborted');
          return;
        }
        setError(err.message || 'Failed to load data');
      } finally {
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
    return () => {
      clearInterval(id);
      controller.abort();
    };
  }, [timeout]);

  if (loading) return <div>Loading cluster map...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!content) return <div>No data received</div>;

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'null' ? null : Number(e.target.value);
    setTimeout(value as IntervalValue);
  };

  return (
  <SectionBox>
  <Typography><Link to="/maestro">Clusters</Link
  >&nbsp;/&nbsp;<Link to={`/maestro?cluster=${cluster}`}>{cluster}</Link
  > &nbsp;/&nbsp;<Link to={`/maestro/?cluster=${cluster}&type=${nodeType}`}>{nodeType}</Link
  >&nbsp;/&nbsp;<Link to={`/maestro/node?cluster=${cluster}&type=${nodeType}&controlplane=${controlPlane}&node=${node}`}>{node}</Link
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

export default TextCommandPage;
