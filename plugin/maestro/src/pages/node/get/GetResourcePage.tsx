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

interface ColumnGroups {
  meta: string[];
  spec: string[];
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
  const [timeout, setTimeout] = useState<IntervalValue>(alignInterval(delay));
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

    const fetchData = async () => {
      try {
        const talosUrl = `http://localhost:5000/talosctl?cluster=${cluster}&n=${node}&cmd=get&commandSet=${commandSet}&subCommand=${command}`;
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
        const nextColumnGroups = createColumnGroups(responseRows);
        const nextColumns = createColumns(nextColumnGroups);
        const nextRows = createRows(nextColumnGroups, responseRows);

        setColumnGroups(nextColumnGroups);
        setColumns(nextColumns);
        setRows(nextRows);

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
  }, [cluster, command, commandSet, node, orderBy, timeout]);

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
          { label: 'get', to: `/maestro/node/get?cluster=${cluster || ''}&type=${nodeType || ''}&controlplane=${controlPlane || ''}&node=${node || ''}` },
          { label: commandSet },
          { label: command },
        ]}
        subtitle="Structured output grouped by spec and metadata fields."
        title="Get resource"
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
                    <TableCell colSpan={columnGroups.spec.length} sx={{ fontWeight: 700 }}>
                      SPEC
                    </TableCell>
                    <TableCell colSpan={columnGroups.meta.length} sx={{ fontWeight: 700 }}>
                      METADATA
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
