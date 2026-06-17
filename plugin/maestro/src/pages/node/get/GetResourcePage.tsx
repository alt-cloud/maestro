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
import { Column, sortTableRows, TableRowData } from '../../shared/utils/tableUtils';
import { apiClient, MaestroApiError } from '../../../shared/utils/apiClient';
import { useApiErrorHandler } from '../../../shared/auth/useApiErrorHandler';

interface ColumnGroups {
  meta: string[];
  spec: string[];
}

function createColumnGroups(resourceRows: any[]): ColumnGroups {
  const metadataFields = new Set<string>();
  const specFields = new Set<string>();

  resourceRows.forEach(resourceRow => {
    Object.keys(resourceRow?.metadata || {}).forEach(field => metadataFields.add(field));
    Object.keys(resourceRow?.spec || {}).forEach(field => specFields.add(field));
  });

  return {
    meta: Array.from(metadataFields),
    spec: Array.from(specFields),
  };
}

function normalizeValue(value: unknown): string {
  if (value === null || typeof value === 'undefined') {
    return '';
  }

  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return value.join('\n');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function createColumns(columnGroups: ColumnGroups): Column[] {
  const columns: Column[] = [];

  columnGroups.spec.forEach(field => {
    columns.push({ id: `spec_${field}`, label: `spec.${field}`, sortable: true });
  });

  columnGroups.meta.forEach(field => {
    columns.push({ id: `meta_${field}`, label: `meta.${field}`, sortable: true });
  });

  return columns;
}

function createRows(columnGroups: ColumnGroups, dataRows: any[]): TableRowData[] {
  return dataRows.map(dataRow => {
    const row: TableRowData = {};

    columnGroups.spec.forEach(field => {
      row[`spec_${field}`] = normalizeValue(dataRow?.spec?.[field]);
    });

    columnGroups.meta.forEach(field => {
      row[`meta_${field}`] = normalizeValue(dataRow?.metadata?.[field]);
    });

    return row;
  });
}

const GetResourcePage: React.FC<{ delay?: string | number | null }> = ({ delay }) => {
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
  const [columnGroups, setColumnGroups] = useState<ColumnGroups>({ meta: [], spec: [] });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

  const pathParts = location.pathname.split('/');
  const commandSet = pathParts[pathParts.length - 2];
  const command = pathParts[pathParts.length - 1];
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
//         const requestParams = new URLSearchParams();
//         if (cluster) {
//           requestParams.set('cluster', cluster);
//         }
//         if (node) {
//           requestParams.set('n', node);
//         }
//         requestParams.set('cmd', 'get');
//         requestParams.set('commandSet', commandSet);
//         requestParams.set('subCommand', command);
//
//         const talosUrl = `${buildServerUrl('/talosctl')}?${requestParams.toString()}`;
//         const response = await fetch(talosUrl, {
//           method: 'GET',
//           headers: {
//             Accept: 'application/json',
//           },
//           signal: controller.signal,
//         });
//
//         if (!response.ok) {
//           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//         }
//         const responseRows = await response.json();
        const queryParams: Record<string, string> = {
          cmd: 'get',
          commandSet,
          subCommand: command,
        };
        if (cluster) queryParams.cluster = cluster;
        if (node) queryParams.n = node;

        const responseRows = await safeApiCall(() =>
          apiClient.get<any[]>('/talosctl', {
            queryParams,
            signal: controller.signal,
          })
        );

        const nextColumnGroups = createColumnGroups(responseRows);
        const nextColumns = createColumns(nextColumnGroups);
        const nextRows = createRows(nextColumnGroups, responseRows);

        setColumnGroups(nextColumnGroups);
        setColumns(nextColumns);
        setRows(nextRows);
        setError(null);

        if (nextColumns.length > 0 && !orderBy) {
          setOrderBy(nextColumns[0].id);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        setError(err.message || failedToLoadDataText);
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
  }, [cluster, command, commandSet, node, failedToLoadDataText, timeout]);

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
          { label: t('common.get'), to: `/maestro/node/get?cluster=${cluster || ''}&type=${nodeType || ''}&controlplane=${controlPlane || ''}&node=${node || ''}` },
          { label: commandSet },
          { label: command },
        ]}
        subtitle={t('getResourcePage.subtitle')}
        title={t('getResourcePage.title')}
      />

      <Paper sx={{ p: 2 }} variant="outlined">
        <Box sx={{ mb: 2 }}>
          <RefreshIntervalControl onChange={setTimeout} options={intervalOptions} value={timeout} />
        </Box>

        {loading && <Alert severity="info">{t('common.loadingCommandOutput')}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && rows.length === 0 && <Alert severity="warning">{t('common.noDataReceived')}</Alert>}

        {!loading && !error && rows.length > 0 && (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell colSpan={columnGroups.spec.length} sx={{ fontWeight: 700 }}>
                      {t('getResourcePage.specHeader')}
                    </TableCell>
                    <TableCell colSpan={columnGroups.meta.length} sx={{ fontWeight: 700 }}>
                      {t('getResourcePage.metadataHeader')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    {columns.map(column => (
                      <TableCell key={column.id}>
                        {column.sortable ? (
                          <TableSortLabel
                            active={orderBy === column.id}
                            direction={orderBy === column.id ? order : 'asc'}
                            onClick={() => handleSort(column.id)}
                          >
                            {column.label.startsWith('spec.') || column.label.startsWith('meta.')
                              ? column.label.slice(5)
                              : column.label}
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
                    <TableRow key={`${command}-${rowIndex}`} hover>
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
      </Paper>
    </SectionBox>
  );
};

export default GetResourcePage;
