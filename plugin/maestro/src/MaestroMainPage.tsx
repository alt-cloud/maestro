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
  TablePagination,
  TableSortLabel
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useRef } from 'react';

interface Cluster {
  id: number;
  name: string;
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

type IntervalValue = typeof INTERVAL_OPTIONS[number]['value'];

interface Column {
  id: keyof Cluster;
  label: string;
  sortable?: boolean;
}

const columns: Column[] = [
    {
      'id': 'ClusterName',
      'label':'ClusterName',
      'sortable': true
    },
    {
      'id': 'nodeType',
      'label':'NodeType',
      'sortable': true
    },
    {
      'id': 'ip',
      'label':'IP',
      'sortable': true
    },
    {
      'id': 'stage',
      'label':'Stage',
      'sortable': true
    },
    {
      'id': 'nodeReady',
      'label':'Ready',
      'sortable': true
    },
    {
      'id': 'status',
      'label':'Status',
      'sortable': true
    },
    {
      'id': 'memberID',
      'label':'Member',
      'sortable': true
    },
    {
      'id': 'manifestsApplied',
      'label':'Manifests',
      'sortable': true
    },
    {
      'id': 'unmetConditions',
      'label':'NoCond',
      'sortable': true
    }
  ];

function NodeCols(pars) {
//   alert('PARS=' + JSON.stringify(pars, null, 2));
  const nodeType = pars.nodeType;
  const cols = pars.cols;
  const node = cols['ip'];
  return (
    <>
    <TableCell>
      <Link key={node} to={`/maestro/node?cluster=${pars.clusterName}&node=${node}&type=${pars.type}`} >
        {node}
      </Link>
    </TableCell>
    <TableCell>{cols['stage']}</TableCell>
    <TableCell>{cols['nodeReady'] ? 'V' : 'X'}</TableCell>
    <TableCell>{cols['status']['ready'] ? 'V' : 'X'}</TableCell>
    <TableCell>{cols['memberID'] == '-' ? 'X' : 'V'}</TableCell>
    <TableCell>{cols['manifestsApplied'].length}</TableCell>
    <TableCell>{cols['status']['unmetConditions'].join("<br/>")}</TableCell>
    </>
  );
}

function NodeRows(pars) {
    const nodeType = pars.nodeType;
    var values = pars.values;
//   alert('nodeType=' + JSON.stringify(nodeType) + ' VALUES=' + JSON.stringify(values));
  if (values.length == 0) {
    return (<TableCell>-</TableCell>);
  }
  const value0 = values.shift();
  return (
    <>
    <NodeCols type={nodeType} clusterName={pars.clusterName} nodeType={nodeType} cols={value0}/>
    {values.map(value => (
    <TableRow>
      <NodeCols type={nodeType} clusterName={pars.clusterName} nodeType={nodeType} cols={value}/>
    </TableRow>
    ))}
    </>
  );
}

const MaestroMainPage: React.FC<{  }> = ({ delay }) => {
  const [timeout, setTimeout] = useState<IntervalValue>(alignInterval(delay));
  // Используем ref для хранения текущего interval ID (чтобы избежать утечек)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [rows, setRows] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);
//   alert(JSON.stringify(queryParams));

//   var breadcrumbs = '';
  const cluster = queryParams.cluster;
//   breadcrumbs += (typeof cluster == 'undefined') ? 'Clusters' : "<a href='/maestro'>Clusters</a>";
  const nodeType = queryParams.type;


  useEffect(() => {

    // Создаём контроллер отмены
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/nodesTree', {
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
//         alert('TYPE='+typeof(clusterRows)+' JSONDATA='+JSON.stringify(clusterRows, null, 2));
        setRows(clusterRows);
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
  // Иначе — загружаем сразу + ставим интервал
  fetchData();
  const id = setInterval(fetchData, timeout);
  intervalRef.current = id;
  return () => {
    clearInterval(id);
    controller.abort();
    };
  }, [timeout]);

  // Обработчик изменения выбора
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'null' ? null : Number(e.target.value);
    setTimeout(value as IntervalValue);
  };

  if (loading) return <div>Loading cluster map...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!rows) return <div>No data received</div>;

//   alert(JSON.stringify(rows, null, 2));
  var Rows;
  if ( typeof cluster != 'undefined' ) {
    Rows = {};
    Rows[cluster] = rows[cluster];
  } else {
    Rows = rows;
  }

//   alert('Rows=' + JSON.stringify(rows, null, 2));


  var clusterNameRowSpans = {}
  const rowsDict = new Map(Object.entries(Rows));
  for (var clusterName of Object.keys(Rows)) {
    var rowSpans = {};
    var nodeTypes = rowsDict.get(clusterName);
    var controlplanes = nodeTypes['controlplanes'];
    var workers = nodeTypes['workers'];
    rowSpans['controlplanes'] = Math.max(controlplanes.length, 1);
    rowSpans['workers'] = Math.max(workers.length, 1);
    rowSpans['all'] =  rowSpans['controlplanes'] + Math.max(workers.length, 1);
    clusterNameRowSpans[clusterName] = rowSpans;
  }
//   alert('clusterNameRowSpans=' + JSON.stringify(clusterNameRowSpans));

  return (
  <SectionBox title="CLUSTERS" textAlign="left" paddingTop={2}>
    <Typography>
    <Link to="/maestro">Clusters</Link>
    </Typography>
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
                {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
          {Object.entries(Rows).map(([clusterName, nodeTypes]) => (
            <>
             <TableRow>
                <TableCell rowSpan={clusterNameRowSpans[clusterName]['all']}>{clusterName}</TableCell>
                <TableCell rowSpan={clusterNameRowSpans[clusterName]['controlplanes']}>controlplane</TableCell>
                <NodeRows clusterName={clusterName} nodeType='controlplane' values={nodeTypes['controlplanes']}/>
             </TableRow>
             <TableRow>
                <TableCell rowSpan={clusterNameRowSpans[clusterName]['workers']}>worker</TableCell>
                <NodeRows clusterName={clusterName} nodeType='worker' values={nodeTypes['workers']}/>
             </TableRow>
            </>
          ))}
          </TableBody>

        </Table>
      </TableContainer>
    </Paper>
    <Link to="/maestro/cluster/scanNets">Scan networks</Link>
  </SectionBox>
  );
}

export default MaestroMainPage;
