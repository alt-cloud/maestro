import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Link,
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
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { buildServerUrl } from '../../../config/server';
import PageHeader from '../../shared/ui/PageHeader';
import RefreshIntervalControl from '../../shared/ui/RefreshIntervalControl';
import { alignRefreshInterval, getRefreshIntervalOptions, IntervalValue } from '../../shared/ui/refreshIntervals';
import { Column, createFlatRows, sortTableRows, TableRowData } from '../../shared/utils/tableUtils';

interface ServiceCellProps {
  cluster?: string;
  columnId: string;
  controlPlane?: string;
  node?: string;
  nodeType?: string;
  value: string;
}

function ServiceCell({ cluster, columnId, controlPlane, node, nodeType, value }: ServiceCellProps) {
  if (columnId.toLowerCase() === 'service') {
    const queryParams = new URLSearchParams();
    if (cluster) {
      queryParams.set('cluster', cluster);
    }
    if (nodeType) {
      queryParams.set('type', nodeType);
    }
    if (controlPlane) {
      queryParams.set('controlplane', controlPlane);
    }
    if (node) {
      queryParams.set('node', node);
    }
    queryParams.set('service', value);
    const query = queryParams.toString();
    const encodedService = encodeURIComponent(value);

    return (
      <TableCell key={columnId}>
        <Link
          component={RouterLink}
          to={`/maestro/node/logs/${encodedService}${query ? `?${query}` : ''}`}
          underline="hover"
        >
          {value}
        </Link>
      </TableCell>
    );
  }

  return <TableCell key={columnId}>{value}</TableCell>;
}

const ServiceCommandPage: React.FC<{ delay?: string | number | null }> = ({ delay }) => {
  const { t } = useTranslation();
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
        const requestParams = new URLSearchParams();
        if (cluster) {
          requestParams.set('cluster', cluster);
        }
        if (node) {
          requestParams.set('n', node);
        }
        requestParams.set('cmd', commandPath);

        const talosUrl = `${buildServerUrl('/talosctl')}?${requestParams.toString()}`;
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

        const responseRows = await response.json();
        const [nextColumns, nextRows] = createFlatRows(responseRows);

        setRows(nextRows);
        setColumns(nextColumns);
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
        subtitle={t('serviceCommandPage.subtitle')}
        title={t('serviceCommandPage.title')}
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
                        <ServiceCell
                          cluster={cluster}
                          columnId={column.id}
                          controlPlane={controlPlane}
                          key={`${rowIndex}-${column.id}`}
                          node={node}
                          nodeType={nodeType}
                          value={row[column.id]}
                        />
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

export default ServiceCommandPage;
