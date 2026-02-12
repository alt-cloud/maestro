import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Box,
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


function createColumnGroups(resourceRows): { meta: string[]; spec: string[] } {
  let metadataFields = [];
  let specFields = [];
  for (const resourceRow of resourceRows) {
    const metadataKeys = Object.keys(resourceRow['metadata']);
    metadataFields = [...new Set([...metadataFields, ...metadataKeys])];
    const specKeys = Object.keys(resourceRow['spec']);
    specFields = [...new Set([...specFields, ...specKeys])];
  }
  const columnGroups = {
    meta: metadataFields,
    spec: specFields,
  };
  return columnGroups;
}

function createColumns(columnGroups) {
  const columns: Column[] = [];
  for (const field of columnGroups['spec']) {
    const column: Column = {id: 'spec_'+field, label: 'spec.'+field, sortable: true };
    columns.push(column);
  }
  for (const field of columnGroups['meta']) {
    const column: Column = {id: 'meta_'+field, label: 'meta.'+field, sortable: true };
    columns.push(column);
  }
  return columns;
}


function createRows(columnGroups, dataRows) {
  const rows = [];
  for (const dataRow of dataRows) {
    const row = {};
    for (const field of columnGroups['spec']) {
      if (field in dataRow['spec']) {
        const value = dataRow['spec'][field];
        let stringValue = '';
        if (Array.isArray(value)) {
          if (value.length > 0 && typeof value[0] === 'object')
            stringValue = JSON.stringify(value, null, 2);
          else
            stringValue = value.join("\n");
        } else if (typeof value === 'object')
          stringValue = JSON.stringify(value, null, 2);
        else
          stringValue = value;
        row['spec_'+field] = stringValue;
      } else {
        row['spec_'+field] = '';
      }
    }
    for (const field of columnGroups['meta']) {
      if (field in dataRow['metadata']) {
        const value = dataRow['metadata'][field];
        let stringValue = '';
        if (Array.isArray(value)) {
          if (value.length > 0 && typeof value[0] === 'object')
            stringValue = JSON.stringify(value, null, 2);
          else
            stringValue = value.join("\n");
        } else if (typeof value === 'object')
           stringValue = JSON.stringify(value, null, 2);
        else
          stringValue = value;
        row['meta_'+field] = stringValue;
      } else {
        row['meta_'+field] = '';
      }
    }
    rows.push(row);
  }
  return rows;
}

const GetResourcePage: React.FC<{ delay?: string | number | null }> = ({ delay }) => {
  const [timeout, setTimeout] = useState<IntervalValue>(alignInterval(delay));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Cluster>('id');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [rows, setRows] = useState<Cluster[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [columnGroups, setColumnGroups] = useState<{ meta?: string[]; spec?: string[] }>({});


  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

  const pathParts = location.pathname.split('/');
  const commandSet = pathParts[pathParts.length-2];
  const command = pathParts[pathParts.length-1];
  const cluster = queryParams.cluster;
  const controlPlane = queryParams.controlplane;
  const node = queryParams.node;
  const nodeType = queryParams.type;

  useEffect(() => {

    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const talosUrl = "http://localhost:5000/talosctl?cluster="+cluster+"&n="+node+"&cmd=get&commandSet="+commandSet+"&subCommand="+command;
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
        const nextColumnGroups = createColumnGroups(responseRows);
        setColumnGroups(nextColumnGroups);
        const nextColumns = createColumns(nextColumnGroups);
        setColumns(nextColumns);
        const nextRows = createRows(nextColumnGroups, responseRows);
        setRows(nextRows);
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
  >&nbsp;/&nbsp;<Link to={`/maestro/node/get?cluster=${cluster}&type=${nodeType}&controlplane=${controlPlane}&node=${node}`}>get</Link
  >&nbsp;/&nbsp;{commandSet}&nbsp;/&nbsp;{command}</Typography>
  <Box sx={{ maxHeight: 'calc(100vh - 120px)', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
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
              <TableCell fontWeight={ 'bold' } colSpan={columnGroups['spec']?.length ?? 0} key='spec'>SPEC</TableCell>
              <TableCell fontWeight={ 'bold' } colSpan={columnGroups['meta']?.length ?? 0} key='metadata'>METADATA</TableCell>
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
                      {column.label.substring(5)}
                    </TableSortLabel>
                  ) : (
                    column.label.substring(5)
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map(row => (
              <TableRow key={row.id}>
              {columns.map(column => (
                <TableCell key={column.id}>{row[column.id]}</TableCell>
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
  </Box>
</SectionBox>
  );
}

export default GetResourcePage;
