import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Paper, Typography } from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { buildServerUrl } from '../../../config/server';
import PageHeader from '../../shared/ui/PageHeader';
import RefreshIntervalControl, { IntervalOption } from '../../shared/ui/RefreshIntervalControl';

const INTERVAL_OPTIONS: readonly IntervalOption[] = [
  { label: '1 second', value: 1000 },
  { label: '5 seconds', value: 5000 },
  { label: '10 seconds', value: 10000 },
  { label: '30 seconds', value: 30000 },
  { label: '1 minute', value: 60000 },
  { label: 'Off', value: null },
] as const;

type IntervalValue = typeof INTERVAL_OPTIONS[number]['value'];

function alignInterval(delay: string | number | null | undefined): IntervalValue {
  if (typeof delay === 'undefined' || Number.isNaN(Number(delay)) || Number(delay) <= 0) {
    return null;
  }

  const delayMs = Number(delay) * 1000;
  let lastValue = 0;

  for (const option of INTERVAL_OPTIONS) {
    if (option.value === null) {
      break;
    }
    if (delayMs <= option.value) {
      return option.value;
    }
    lastValue = option.value;
  }

  return lastValue || null;
}

const TextCommandPage: React.FC<{ delay?: string | number | null }> = ({ delay }) => {
  const [timeout, setTimeout] = useState<IntervalValue>(alignInterval(delay));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [content, setContent] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

  const pathParts = location.pathname.split('/');
  const nodePathIndex = pathParts.indexOf('node');
  const commandParts = pathParts.slice(nodePathIndex + 1);
  const commandPath = commandParts.join('/');
  const fullCommand = commandParts.join(' ');

  const cluster = queryParams.cluster;
  const controlPlane = queryParams.controlplane;
  const node = queryParams.node;
  const nodeType = queryParams.type;

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const talosUrl = `${buildServerUrl('/talosctl')}?cluster=${cluster}&n=${node}&cmd=${commandPath}`;
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

        const responsePayload = await response.json();
        setContent(String(responsePayload?.content || ''));
      } catch (err: any) {
        if (err.name === 'AbortError') {
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
    const intervalId = setInterval(fetchData, timeout);
    intervalRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
      controller.abort();
    };
  }, [cluster, commandPath, node, timeout]);

  return (
    <SectionBox title="" textAlign="left" paddingTop={2}>
      <PageHeader
        breadcrumbs={[
          { label: 'Clusters', to: '/maestro' },
          { label: cluster || 'Cluster', to: `/maestro?cluster=${cluster || ''}` },
          { label: nodeType || 'Node type', to: `/maestro/?cluster=${cluster || ''}&type=${nodeType || ''}` },
          { label: node || 'Node', to: `/maestro/node?cluster=${cluster || ''}&type=${nodeType || ''}&controlplane=${controlPlane || ''}&node=${node || ''}` },
          { label: fullCommand },
        ]}
        subtitle="Streaming text output from Talos commands."
        title="Text command"
      />

      <Paper sx={{ p: 2 }} variant="outlined">
        <Box sx={{ mb: 2 }}>
          <RefreshIntervalControl onChange={setTimeout} options={INTERVAL_OPTIONS} value={timeout} />
        </Box>

        {loading && <Alert severity="info">Loading command output...</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && !content && <Alert severity="warning">No data received.</Alert>}

        {!loading && !error && content && (
          <Box sx={{ maxHeight: 'calc(100vh - 320px)', overflow: 'auto' }}>
            <Typography
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: 13,
                lineHeight: 1.5,
                m: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {content}
            </Typography>
          </Box>
        )}
      </Paper>
    </SectionBox>
  );
};

export default TextCommandPage;
