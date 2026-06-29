import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { buildServerUrl } from '../../../config/server';
import PageHeader from '../../shared/ui/PageHeader';
import RefreshIntervalControl from '../../shared/ui/RefreshIntervalControl';
import { alignRefreshInterval, getRefreshIntervalOptions, IntervalValue } from '../../shared/ui/refreshIntervals';
import { Column, createFlatRows, sortTableRows, TableRowData } from '../../shared/utils/tableUtils';
import { apiClient, MaestroApiError } from '../../../shared/utils/apiClient';
import { useApiErrorHandler } from '../../../shared/auth/useApiErrorHandler';

function normalizeErrorMessage(value: unknown): string {
  const text = String(value ?? '');
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t');
}

const TableCommandPage: React.FC<{ delay?: string | number | null }> = ({ delay }) => {
  const { t } = useTranslation();
  const safeApiCall = useApiErrorHandler();
  const failedToLoadDataText = t('common.failedToLoadData');
  const intervalOptions = useMemo(() => getRefreshIntervalOptions(t), [t]);
  const [timeout, setTimeout] = useState<IntervalValue>(alignRefreshInterval(delay));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [rows, setRows] = useState<TableRowData[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);

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

        let responseRows = await safeApiCall(() =>
          apiClient.get<any[]>('/talosctl', {
            queryParams,
            signal: controller.signal,
          })
        );

        if (responseRows.length === 2 && responseRows[0].length > 0 && responseRows[0][0] === '[') {
          setError(normalizeErrorMessage(responseRows[1]));
          responseRows = JSON.parse(responseRows[0]);
        } else {
          setError(null);
        }

        const [nextColumns, nextRows] = createFlatRows(responseRows);

        setRows(nextRows);
        setColumns(nextColumns);

        if (nextColumns.length > 0 && !orderBy) {
          setOrderBy(nextColumns[0].id);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        if (err instanceof MaestroApiError) {
          setError(normalizeErrorMessage(err.toUserMessage()));
        } else {
          setError(normalizeErrorMessage(err.message || failedToLoadDataText));
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

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(Number(event.target.value));
    setPage(0);
  };

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedRows = sortTableRows(rows, orderBy, order);

  const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
        subtitle={t('tableCommandPage.subtitle')}
        title={t('tableCommandPage.title')}
      />

      <Paper sx={{ p: 2 }} variant="outlined">
        <Box sx={{ mb: 2 }}>
          <RefreshIntervalControl onChange={setTimeout} options={intervalOptions} value={timeout} />
        </Box>

        {!loading && rows.length > 0 && (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {columns.map(column => (
                      <TableCell key={column.id}>
                        {column.sortable ? (
                          <TableSortLabel
                            active={orderBy === column.id}
                            direction={orderBy === column.id ? order : 'asc'}
                            onClick={() => handleSort(column.id)}
                          >
                            {column.label}
                          </TableSortLabel>
                        ) : (
                          column.label
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRows.map((row, rowIndex) => (
                    <TableRow hover key={`${fullCommand}-${rowIndex}`}>
                      {columns.map(column => (
                        <TableCell key={`${rowIndex}-${column.id}`}>{row[column.id]}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={rows.length}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
        {loading && <Alert severity="info">{t('common.loadingCommandOutput')}</Alert>}
        {error && (
          <Alert severity="error" sx={{ '& .MuiAlert-message': { whiteSpace: 'pre-wrap' } }}>
            {error}
          </Alert>
        )}
        {!loading && !error && rows.length === 0 && <Alert severity="warning">{t('common.noDataReceived')}</Alert>}
      </Paper>
    </SectionBox>
  );
};

export default TableCommandPage;
