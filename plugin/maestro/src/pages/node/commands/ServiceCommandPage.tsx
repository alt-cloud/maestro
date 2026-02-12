import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel
} from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';


interface Cluster {
  id: number;
  name: string;
}

interface Column {
  id: keyof Cluster;
  label: string;
  sortable?: boolean;
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

function createRows(dataRows) {
  const columns: Column[] = [];
  let columnNames;
  if (dataRows.length === 0)
    return [ [], [] ]
  if (Object.keys(columns).length === 0) {
    columnNames = Object.keys(dataRows[0])
    for (const columnName of columnNames) {
      const column: Column = {id: columnName, label: columnName, sortable: true };
      columns.push(column);
    }
  }
  return [ columns, dataRows ]
}

interface ServiceCellProps {
  columnId: string;
  value: string;
  cluster: string;
  controlPlane: string;
  node: string;
  nodeType: string;
}

function ServiceCell({ columnId, value, cluster, controlPlane, node, nodeType}: ServiceCellProps) {
  const renderServiceCell = () => {
    if (columnId.toLowerCase() === 'service') {
      return (
      <TableCell key={columnId}>
        <Link to={`/maestro/node/logs/${value}?cluster=${cluster}&type=${nodeType}&controlplane=${controlPlane}&node=${node}&service=${value}`}>{value}</Link>
      </TableCell>
      );
    } else {
      return (
      <TableCell key={columnId}>{value}</TableCell>
      );
    }
  }
  return (renderServiceCell());
}

const ServiceCommandPage: React.FC<{ delay?: string | number | null }> = ({ delay }) => {
  const [timeout, setTimeout] = useState<IntervalValue>(alignInterval(delay));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Cluster>('id');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [rows, setRows] = useState<Cluster[]>([]);
  const [columns, setColumns] = useState<Cluster[]>([]);

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

        const responseRows: ApiResponse = await response.json();
        const [nextColumns, nextRows] = createRows(responseRows);
        setRows(nextRows);
        setColumns(nextColumns);
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
  if (!rows) return <div>No data received</div>;

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'null' ? null : Number(e.target.value);
    setTimeout(value as IntervalValue);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleSort = (property: keyof Cluster) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1;
    if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


  return (
  <SectionBox>
  <Typography variant="h6"><Link to="/maestro">Clusters</Link
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
      <TableContainer>
        <Table>
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
            {paginatedRows.map(row => (
              <TableRow key={row.id}>
              {columns.map(column => (
                <ServiceCell
                    columnId={column.id}
                    value={row[column.id]}
                    cluster={cluster}
                    controlPlane={controlPlane}
                    node={node}
                    nodeType={nodeType}
                    />
              ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  </SectionBox>
  );
}

export default ServiceCommandPage;
