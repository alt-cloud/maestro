import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Alert, Box, Paper, Typography } from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApiErrorHandler } from '../../../shared/auth/useApiErrorHandler';
import { apiClient, MaestroApiError } from '../../../shared/utils/apiClient';
import PageHeader from '../../shared/ui/PageHeader';
import RefreshIntervalControl from '../../shared/ui/RefreshIntervalControl';
import { alignRefreshInterval, getRefreshIntervalOptions, IntervalValue } from '../../shared/ui/refreshIntervals';

const TextCommandPage: React.FC<{ delay?: string | number | null }> = ({ delay }) => {
  const { t } = useTranslation();
  const safeApiCall = useApiErrorHandler();
  const failedToLoadDataText = t('common.failedToLoadData');
  const intervalOptions = useMemo(() => getRefreshIntervalOptions(t), [t]);
  const [timeout, setTimeout] = useState<IntervalValue>(alignRefreshInterval(delay));
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
    let isFetching = false;

    const fetchData = async () => {
      if (isFetching || controller.signal.aborted) {
        return;
      }
      isFetching = true;
      try {
        const queryParams: Record<string, string> = {
          cmd: commandPath,
        };
        if (cluster) queryParams.cluster = cluster;
        if (node) queryParams.n = node;

        const responsePayload = await safeApiCall(() =>
          apiClient.get<{ content?: string }>('/talosctl', {
            queryParams,
            signal: controller.signal,
          })
        );

        setContent(String(responsePayload?.content || ''));
        setError(null);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        if (err instanceof MaestroApiError) {
          setError(err.toUserMessage());
        } else {
          setError(err.message || failedToLoadDataText);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
        isFetching = false;
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
  }, [cluster, commandPath, node, failedToLoadDataText, timeout]);

  return (
    <SectionBox title="" textAlign="left" paddingTop={2}>
      <PageHeader
        breadcrumbs={[
          { label: t('common.clusters'), to: '/maestro' },
          { label: cluster || t('common.cluster'), to: `/maestro?cluster=${cluster || ''}` },
          { label: nodeType || t('common.nodeType'), to: `/maestro/?cluster=${cluster || ''}&type=${nodeType || ''}` },
          { label: node || t('common.node'), to: `/maestro/node?cluster=${cluster || ''}&type=${nodeType || ''}&controlplane=${controlPlane || ''}&node=${node || ''}` },
          { label: fullCommand },
        ]}
        subtitle={t('textCommandPage.subtitle')}
        title={t('textCommandPage.title')}
      />

      <Paper sx={{ p: 2 }} variant="outlined">
        <Box sx={{ mb: 2 }}>
          <RefreshIntervalControl onChange={setTimeout} options={intervalOptions} value={timeout} />
        </Box>

        {loading && <Alert severity="info">{t('common.loadingCommandOutput')}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && !content && <Alert severity="warning">{t('common.noDataReceived')}</Alert>}

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
