import React, { useState, useEffect } from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  TablePagination,
  TableSortLabel
} from '@mui/material';
import { Link } from 'react-router-dom';

import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useRef } from 'react';

// import datasRows from './Data.json';
// import columnsList from './Columns.json';
// import head from './Head.json';

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

function alignInterval(delay) {
  if (typeof delay === 'undefined' || Number.isNaN(Number(delay)) || Number(delay) <= 0 ) {
    delay = null;
  }
  let alignDelay = null;
  if (delay) {
    delay = Number(delay) * 1000;
    let lastValue = 0;
    for (let option of INTERVAL_OPTIONS) {
      if (option.value === null) break;
      if (delay <= option.value) {
        alignDelay = option.value;
        break;
      }
      lastValue = option.value;
    }
    if (alignDelay === null) alignDelay = lastValue;
//     alert('alignDelay=' + alignDelay);
  }
  return alignDelay;
}

// Create columns list from file Columns.json
// First spec fields
// After meta fields
// function createColumns(): Column[] {
//   const columns: Column[] = [];
//   for (const field of columnsList['spec']) {
//     const column: Column = {id: 'spec_'+field, label: 'spec.'+field, sortable: true };
//     columns.push(column);
//   }
//   for (const field of columnsList['meta']) {
//     const column: Column = {id: 'meta_'+field, label: 'meta.'+field, sortable: true };
//     columns.push(column);
//   }
//
//   return columns;
// }

function createColumnsList(clusterRows): Column[] {
  var meta = [];
  var spec = [];
  for (const clusterRow of clusterRows) {
    var metaKeys = Object.keys(clusterRow['metadata']);
    meta = [...new Set([...meta, ...metaKeys])];
    var specKeys = Object.keys(clusterRow['spec']);
    spec = [...new Set([...spec, ...specKeys])];
  }
  var columnsList = {}
  columnsList['meta'] = meta;
  columnsList['spec'] = spec;
//   alert('columnsList=' + JSON.stringify(columnsList, null, 2))
  return columnsList;
}

function createColumns(columnsList) {
//   alert('columnsList=' + JSON.stringify(columnsList, null, 2))
  const columns: Column[] = [];
  for (const field of columnsList['spec']) {
    const column: Column = {id: 'spec_'+field, label: 'spec.'+field, sortable: true };
    columns.push(column);
  }
  for (const field of columnsList['meta']) {
    const column: Column = {id: 'meta_'+field, label: 'meta.'+field, sortable: true };
    columns.push(column);
  }
//   alert('columns=' + JSON.stringify(columns, null, 2))
  return columns;
}

// const columns = createColumns();
// alert(JSON.stringify(columns));

function createRows(columnsList, dataRows) {
//   alert(JSON.stringify(dataRows));
  const rows = [];
  for (const dataRow of dataRows) {
//   alert(JSON.stringify(dataRow));
    const row = {};
    for (const field of columnsList['spec']) {
      if (field in dataRow['spec']) {
        const value = dataRow['spec'][field];
        var strValue = '';
        if (Array.isArray(value)) {
          if (value.length > 0 && typeof value[0] === 'object')
            strValue = JSON.stringify(value, null, 2);
          else
            strValue = value.join("\n");
        } else if (typeof value === 'object')
          strValue = JSON.stringify(value, null, 2);
        else
          strValue = value;
        row['spec_'+field] = strValue;
      } else {
        row['spec_'+field] = '';
      }
    }
    for (const field of columnsList['meta']) {
      if (field in dataRow['metadata']) {
        const value = dataRow['metadata'][field];
        var strValue = '';
        if (Array.isArray(value)) {
          if (value.length > 0 && typeof value[0] === 'object')
            strValue = JSON.stringify(value, null, 2);
          else
            strValue = value.join("\n");
        } else if (typeof value === 'object')
           strValue = JSON.stringify(value, null, 2);
        else
          strValue = value;
        row['meta_'+field] = strValue;
      } else {
        row['meta_'+field] = '';
      }
    }
    rows.push(row);
  }
//   alert(JSON.stringify(rows));
  return rows;
}

const TalosGetInfo: React.FC<{ }> = ({ delay }) => {
  const [timeout, setTimeout] = useState<IntervalValue>(alignInterval(delay));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Cluster>('id');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [rows, setRows] = useState<Cluster[]>([]);
  const [columns, setColumns] = useState<Cluster[]>([]);
  const [columnsList, setColumnsList] = useState<Cluster[]>([]);


  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  // Парсим query параметры
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

  const path = location.pathname.split('/');
  const commandSet = path[path.length-2];
  const command = path[path.length-1];
  const commands = path.slice(-2)
  const commandPath = commands.join('/')
  const fullCommand = commands.join(' ')
//   alert('PATH='+path+' commandSet='+commandSet+' command='+command);
  const cluster = queryParams.cluster;
  const controlplane = queryParams.controlplane;
  const node = queryParams.node;
  const nodeType = queryParams.type;

  useEffect(() => {
    // Если фича отключена — ничего не делаем

    // Создаём контроллер отмены
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const talosURL = "http://localhost:5000/talosctl?cluster="+cluster+"&n="+node+"&cmd=get&commandSet="+commandSet+"&subCommand="+command;
//         alert(talosURL);
        const response = await fetch(talosURL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal, // ← привязываем сигнал отмены
        });

        // Если запрос был отменён, response.json() не вызовется
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const clusterRows: ApiResponse = await response.json();
//         alert(JSON.stringify(clusterRows, null, 2));
        const columnsList = createColumnsList(clusterRows);
//         alert('columnsList=' + JSON.stringify(columnsList, null, 2));
        setColumnsList(columnsList);
        const Columns = createColumns(columnsList);
        setColumns(Columns);
//         alert('Columns=' + JSON.stringify(Columns, null, 2));
        const Rows = createRows(columnsList, clusterRows);
//         alert('TYPE='+typeof(clusterRows)+' Rows='+JSON.stringify(Rows, null, 2));
        setRows(Rows);
      } catch (err: any) {
        // Игнорируем ошибку отмены
        if (err.name === 'AbortError') {
//           alert('Fetch aborted');
          console.debug('Fetch aborted');
          return;
        }
        setError(err.message || 'Failed to load data');
      } finally {
        // Убираем состояние загрузки, даже если запрос отменили или упал
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    // Если интервал отключён — только один раз загрузить данные (опционально)
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
//   alert(JSON.stringify(rows, null, 2));

  // Обработчик изменения выбора
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
  <Typography><Link to="/maestro">Clusters</Link
  >&nbsp;/&nbsp;<Link to={`/maestro?cluster=${cluster}`}>{cluster}</Link
  > &nbsp;/&nbsp;<Link to={`/maestro/?cluster=${cluster}&type=${nodeType}`}>{nodeType}</Link
  >&nbsp;/&nbsp;<Link to={`/maestro/node?cluster=${cluster}&type=${nodeType}&controlplane=${controlplane}&node=${node}`}>{node}</Link
  >&nbsp;/&nbsp;<Link to={`/maestro/node/get?cluster=${cluster}&type=${nodeType}&controlplane=${controlplane}&node=${node}`}>get</Link
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
              <TableCell fontWeight={ 'bold' } colSpan={columnsList['spec'].length} key='spec'>SPEC</TableCell>
              <TableCell fontWeight={ 'bold' } colSpan={columnsList['meta'].length} key='metadata'>METADATA</TableCell>
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

export default TalosGetInfo;
