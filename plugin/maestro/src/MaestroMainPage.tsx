import React, { useState, useEffect } from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel,
  Box,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Divider
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

const statusClusterOptions: StatusOption[] = [
  { value: 'running', label: 'Running', color: '#e8f5e9', icon: '🟢' },
  { value: 'restart', label: 'Restart', color: '#fff8e1', icon: '🟡' },
  { value: 'reboot', label: 'Reboot', color: '#fff8e1', icon: '🟡' },
  { value: 'shutdown', label: 'Shutdown', color: '#fff8e1', icon: '🟡' },
  { value: 'reset', label: 'Reset', color: '#ffebee', icon: '🔴' },
];
const statusOrphanOptions: StatusOption[] = [
  { value: 'maintenance', label: 'Maintenance', color: '#e8f5e9', icon: '🟡' },
  { value: 'controlplane', label: 'Controlplane', color: '#e8f5e9', icon: '🟢' },
  { value: 'worker', label: 'Worker', color: '#e8f5e9', icon: '🟢' },
];

const orphansClusterName = '_Orphans';
let isClusterPage = false;
let haveOrphans;
let selectedNodeStage = {};

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
    {'id': 'ClusterName','label':'ClusterName','sortable': false},
{'id': 'nodeType','label':'NodeType','sortable': false},
{'id': 'ip','label':'IP','sortable': false},
{'id': 'stage','label':'Stage','sortable': false},
{'id': 'nodeReady','label':'Ready','sortable': false},
{'id': 'status','label':'Status','sortable': false},
{'id': 'memberID','label':'Member','sortable': false},
{'id': 'manifestsApplied','label':'Manifests','sortable': false},
{'id': 'unmetConditions','label':'NoCond','sortable': false}
];

  interface StatusOption {
  value: string;
  label: string;
  color: string;
  icon?: React.ReactNode;
}

function NodeStageSelect(pars) {
//         alert(pars.setIsSubmitDisabled);
    const statusOptions = pars.statusOptions;
    const node = pars.node;
    const stage = pars.stage;
    const clusterName = pars.clusterName;
//     alert('stage=' + stage);
    const [status, setStatus] = useState<string>(stage);
//     selectedNodeStage[clusterName][node] = pars.stage;

    const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
//       alert('handleChange:: pars=' + JSON.stringify(pars));
//       alert('handleChange:: value=' + event.target.value + ' clusterName=' + clusterName);
      const value = event.target.value as string;
      selectedNodeStage[clusterName][node] = value;
      setStatus(value);
//       alert('handleChange:: selectedNodeStage=' + JSON.stringify(selectedNodeStage))
      // pars.setIsSubmitDisabled(false);
//       setIsSubmitDisabled(false);
    };

    return (
    <FormControl sx={{ minWidth: 90 }}>
      <Select
        onChange={handleChange}
        value={status}
        label="Status"
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          },
        }}
      >
      {statusOptions.map((option) => (
        <MenuItem
          key={option.value}
          value={option.value}
          sx={{
            backgroundColor: option.color,
            '&:hover': {
              backgroundColor: `${option.color}`,
            },
            '&.Mui-selected': {
              backgroundColor: option.color,
              fontWeight: 'bold',
            },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <span>{option.icon}</span>
          <span>{option.label}</span>
        </MenuItem>
      ))}
      </Select>
    </FormControl>
    );
}

function NodeStage(pars) {
  const node=pars.node;
  const nodeType = pars.nodeType;
  const stage = pars.stage;
  if (stage == 'running' && isClusterPage) {
    return (
    <TableCell>
      <NodeStageSelect
        statusOptions={statusClusterOptions}
        clusterName={pars.clusterName}
        node={node}
        stage={stage}
        setIsSubmitDisabled={pars.setIsSubmitDisabled}
        />
    </TableCell>
    );
  }
  if (stage == 'maintenance') {
    return (
    <TableCell>
      <NodeStageSelect
        statusOptions={statusOrphanOptions}
        clusterName={pars.clusterName}
        node={node}
        stage={stage}
        setIsSubmitDisabled={pars.setIsSubmitDisabled}
        />
    </TableCell>
    );
  }
  return (
    <TableCell>{stage}</TableCell>
  );
}


function NodeCols(pars) {
//   alert('PARS=' + JSON.stringify(pars, null, 2));
  const nodeType = pars.nodeType;
  const cols = pars.cols;
  const node = cols['ip'];
  const clusterName = pars.clusterName;
  const href = clusterName[0] == '_' ? '/maestro/node/get' : '/maestro/node';
  return (
    <>
    <TableCell>
      <Link key={node} to={`${href}?cluster=${pars.clusterName}&node=${node}&type=${pars.type}`} >
        {node}
      </Link>
    </TableCell>
    <NodeStage
      nodeType={nodeType}
      clusterName={pars.clusterName}
      stage={cols['stage']}
      node={node}
      setIsSubmitDisabled={pars.setIsSubmitDisabled}
      />
    <TableCell>{cols['nodeReady'] ? 'V' : 'X'}</TableCell>
    <TableCell>{cols['status']['ready'] ? 'V' : 'X'}</TableCell>
    <TableCell>{cols['memberID'] == '-' ? 'X' : 'V'}</TableCell>
    <TableCell>{cols['manifestsApplied'].length}</TableCell>
    <TableCell>{cols['status']['unmetConditions'].join("<br/>")}</TableCell>
    </>
  );
}

function ClusterRows(pars) {
  const clusterName = pars.clusterName;
  const nodeTypes = pars.nodeTypes;
  const clusterNameRowSpans = pars.clusterNameRowSpans;
  const isOrphan = clusterName[0] ==  '_';
  let controlplanesValues = nodeTypes['controlplanes'];
  if (controlplanesValues.length == 0) controlplanesValues = ['-'];
  let controlplanesValue0 = controlplanesValues.shift();
  let workersValues = nodeTypes['workers'];
  if (workersValues.length == 0) workersValues = ['-'];
  let workersValue0 = workersValues.shift();

//   alert('ROWSPAN:: controlplanes=' + clusterNameRowSpans[clusterName]['controlplanes'] +
//     ' workers=' + clusterNameRowSpans[clusterName]['workers']);
  return (
  <>
    <TableRow>
      <TableCell rowSpan={clusterNameRowSpans[clusterName]['all']}>
      {isClusterPage ?
        <span>{clusterName}</span>
        :
        <Link to={`/maestro/cluster?cluster=${clusterName}`}>{clusterName}</Link>
      }
      </TableCell>
      {isOrphan ?
        <Divider
          style={{
            backgroundColor: 'green',
            height: 5
          }} />
      :
      <>
      <TableCell rowSpan={clusterNameRowSpans[clusterName]['controlplanes']}>controlplane</TableCell>
      <NodeCols
        clusterName={pars.clusterName}
        nodeType='controlplane'
        cols={controlplanesValue0}
        setIsSubmitDisabled={pars.setIsSubmitDisabled}
        />
      </>
      }
    </TableRow>
    {controlplanesValues.map(value => (
      <TableRow>
        <NodeCols
          clusterName={pars.clusterName}
          nodeType='controlplane'
          cols={value}
          setIsSubmitDisabled={pars.setIsSubmitDisabled}
          />
      </TableRow>
    ))}
    <TableRow>
      <TableCell rowSpan={clusterNameRowSpans[clusterName]['workers']}>worker</TableCell>
      <NodeCols
        clusterName={pars.clusterName}
        nodeType='worker'
        cols={workersValue0}
        setIsSubmitDisabled={pars.setIsSubmitDisabled}
        />
    </TableRow>
    {workersValues.map(value => (
      <TableRow>
        <NodeCols
          clusterName={pars.clusterName}
          nodeType='worker'
          cols={value}
          setIsSubmitDisabled={pars.setIsSubmitDisabled}
          />
      </TableRow>
    ))}
  </>
  );
}

const MaestroMainPage: React.FC<{  }> = ({ delay }) => {
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);
  const [isEnterClusterNameDisabled, setIsEnterClusterNameDisabled] = useState(true);

  const [timeout, setTimeout] = useState<IntervalValue>(alignInterval(delay));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [nameOfCluster, setNameOfCluster] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  if (loading) return <div>Loading cluster list...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!rows) return <div>No data received</div>;

//   alert(JSON.stringify(rows, null, 2));
  var Rows;
  haveOrphans = rows[orphansClusterName] != undefined;
//   alert('haveOrphans=' + haveOrphans);
  if ( typeof cluster != 'undefined' ) {
    Rows = {};
    Rows[cluster] = rows[cluster];
    if (haveOrphans) Rows[orphansClusterName] = rows[orphansClusterName];
    isClusterPage = true;
  } else {
    Rows = rows;
    isClusterPage = false;
  }

//   alert('Rows=' + JSON.stringify(Rows, null, 2));
  var clusterNameRowSpans = {}
  selectedNodeStage = {};
  const rowsDict = new Map(Object.entries(Rows));
//   alert('rowsDict=' + JSON.stringify(rowsDict, null, 2));
  for (var clusterName of Object.keys(Rows)) {
    selectedNodeStage[clusterName] = {};
    const isOrphan = clusterName[0] ==  '_';
    var rowSpans = {};
    var nodeTypes = rowsDict.get(clusterName);
//     alert('clusterName=' + clusterName , null, 2);
    var controlplanes = nodeTypes['controlplanes'];
//     alert('controlplanes=' + JSON.stringify(controlplanes, null, 2));
    for (let node of controlplanes) {
      let stage = isOrphan ? 'maintenance' : 'running'
      selectedNodeStage[clusterName][node['ip']] = stage;
    }
//   alert('MaestroMainPage_CP:: selectedNodeStage=' + JSON.stringify(selectedNodeStage, null, 2));

    var workers = nodeTypes['workers'];
//     alert('workers=' + JSON.stringify(workers, null, 2));
    for (let node of workers) {
      let stage = isOrphan ? 'maintenance' : 'running'
      selectedNodeStage[clusterName][node['ip']] = stage;
    }
//   alert('MaestroMainPage_W:: selectedNodeStage=' + JSON.stringify(selectedNodeStage, null, 2));

    rowSpans['controlplanes'] = Math.max(controlplanes.length, 1);
    rowSpans['workers'] = Math.max(workers.length, 1);
    rowSpans['all'] = isOrphan? Math.max(workers.length, 1) : rowSpans['controlplanes'] + Math.max(workers.length, 1);
    clusterNameRowSpans[clusterName] = rowSpans;
  }
//   alert('clusterNameRowSpans=' + JSON.stringify(clusterNameRowSpans, null, 2));
//   alert('MaestroMainPage:: selectedNodeStage=' + JSON.stringify(selectedNodeStage, null, 2));

  const handleSubmit = async (selectedNodeStage)=> {
      alert('selectedNodeStage=' + JSON.stringify(selectedNodeStage, null, 2));
    let actions = {};
    let toClusterName;
    for (let clusterName in selectedNodeStage) {
      let isOrphan = clusterName[0] == '_';
      if (!isOrphan) toClusterName = clusterName;
      for (let ip in selectedNodeStage[clusterName]) {
        let state = selectedNodeStage[clusterName][ip];
        if (isOrphan && state != 'maintenance' || !isOrphan && state != 'running') {
          if (actions[toClusterName] === undefined) actions[toClusterName] = {};
          if (actions[toClusterName][state] === undefined)  actions[toClusterName][state] = []
          actions[toClusterName][state].push(ip);
        }
      }
    }
    alert('Actions=' + JSON.stringify(actions, null, 2));
    try {
      const response = await fetch('http://localhost:5000/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actions),
      });

      if (response.ok) {
        // Set refresh timeout
        setTimeout(alignInterval('5') as IntervalValue);
      } else {
        console.error('Sending error');
      }
    } catch (err) {
      console.error('Net error:', err);
    }

  };

  return (
  <SectionBox title="CLUSTERS" textAlign="left" paddingTop={2}>
    <Typography>
    <Link to="/maestro">Clusters</Link>
    {isClusterPage ? <span>&nbsp;/&nbsp;{cluster}</span> :<span/>}
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
      <form >
      <FormControl fullWidth margin="normal" required /*error={!!errors.nodeType}*/>
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
          <Divider
            style={{
              backgroundColor: 'green',
              height: 5
            }} />
          {Object.entries(Rows).map(([clusterName, nodeTypes]) => (
            <ClusterRows
              clusterName={clusterName}
              clusterNameRowSpans={clusterNameRowSpans}
              nodeTypes={nodeTypes}
              setIsSubmitDisabled={setIsSubmitDisabled}
              />
          ))}
          <Divider
            style={{
              backgroundColor: 'green',
              height: 5
            }} />
          </TableBody>
        </Table>
      </TableContainer>
      </FormControl>

      {isClusterPage || !haveOrphans ?
        <div/>
        :
      <TextField
        fullWidth
        margin="normal"
        required
        label="Cluster name"
        id="cluster-name"
        value={nameOfCluster}
        onChange={(e) => {
          setNameOfCluster(e.target.value);
          if (errors.nameOfCluster && e.target.value.trim()) {
            setErrors(prev => ({ ...prev, nameOfCluster: '' }));
          }
        }}
        error={!!errors.nameOfCluster}
        helperText={errors.nameOfCluster}
        placeholder="mew-cluster-name"
        inputProps={{ 'aria-label': 'Cluster name' }}
      />
      }
      {!haveOrphans ?
        <div/>
        :
      <Button
        onClick={() => handleSubmit(selectedNodeStage)}
        variant="contained"
        color="success"
        fullWidth
        sx={{ mt: 3, py: 1.5 }}
        aria-label="Create cluster"
      >Apply Changes</Button>
      }
    </form>
    </Paper>
    <Divider
      style={{
        backgroundColor: '#ffffff',
        height: 5
      }}
    />
    <Button
      component={Link}
      to="/maestro/cluster/scanNets"
      color="success"
      variant="contained"
    >
      Scan networks
    </Button>
  </SectionBox>
  );
}

export default MaestroMainPage;
