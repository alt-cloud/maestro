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
type TableRowData = Record<string, string>;

interface Column {
  id: string;
  label: string;
  sortable?: boolean;
}

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

function normalizeRowValue(value: unknown): string {
  if (value === null || typeof value === 'undefined') {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(item => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function createRows(dataRows: any[]): [Column[], TableRowData[]] {
  if (dataRows.length === 0) {
    return [[], []];
  }

  const columnNames = Object.keys(dataRows[0]);
  const columns: Column[] = columnNames.map(columnName => ({
    id: columnName,
    label: columnName,
    sortable: true,
  }));

  const rows = dataRows.map(row => {
    const normalizedRow: TableRowData = {};
    columnNames.forEach(columnName => {
      normalizedRow[columnName] = normalizeRowValue(row[columnName]);
    });
    return normalizedRow;
  });

  return [columns, rows];
}

interface ServiceCellProps {
  cluster: string;
  columnId: string;
  controlPlane: string;
  node: string;
  nodeType: string;
  value: string;
}

function ServiceCell({ cluster, columnId, controlPlane, node, nodeType, value }: ServiceCellProps) {
  if (columnId.toLowerCase() === 'service') {
    return (
      <TableCell key={columnId}>
        <Link
          component={RouterLink}
          to={`/maestro/node/logs/${value}?cluster=${cluster}&type=${nodeType}&controlplane=${controlPlane}&node=${node}&service=${value}`}
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
  const [timeout, setTimeout] = useState<IntervalValue>(alignInterval(delay));
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

        const responseRows = await response.json();
        const [nextColumns, nextRows] = createRows(responseRows);

        setRows(nextRows);
        setColumns(nextColumns);

        if (nextColumns.length > 0 && !orderBy) {
          setOrderBy(nextColumns[0].id);
        }
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
  }, [cluster, commandPath, node, orderBy, timeout]);

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

  const sortedRows = [...rows].sort((a, b) => {
    const left = String(a[orderBy] ?? '');
    const right = String(b[orderBy] ?? '');

    if (left < right) return order === 'asc' ? -1 : 1;
    if (left > right) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
        subtitle="Service table output. Click service names to open logs."
        title="Service command"
      />

      <Paper sx={{ p: 2 }} variant="outlined">
        <Box sx={{ mb: 2 }}>
          <RefreshIntervalControl onChange={setTimeout} options={INTERVAL_OPTIONS} value={timeout} />
        </Box>

        {loading && <Alert severity="info">Loading command output...</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        {!loading && !error && rows.length === 0 && <Alert severity="warning">No data received.</Alert>}

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
