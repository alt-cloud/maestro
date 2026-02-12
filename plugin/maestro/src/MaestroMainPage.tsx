import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Button,
  Divider,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField} from '@mui/material';
import Typography from '@mui/material/Typography';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

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

const clusterStatusOptions: StatusOption[] = [
  { value: 'running', label: 'Running', color: '#e8f5e9', icon: '🟢' },
  { value: 'restart', label: 'Restart', color: '#fff8e1', icon: '🟡' },
  { value: 'reboot', label: 'Reboot', color: '#fff8e1', icon: '🟡' },
  { value: 'shutdown', label: 'Shutdown', color: '#fff8e1', icon: '🟡' },
  { value: 'reset', label: 'Reset', color: '#ffebee', icon: '🔴' },
];
const orphanStatusOptions: StatusOption[] = [
  { value: 'maintenance', label: 'Maintenance', color: '#e8f5e9', icon: '🟡' },
  { value: 'controlplane', label: 'Controlplane', color: '#e8f5e9', icon: '🟢' },
  { value: 'worker', label: 'Worker', color: '#e8f5e9', icon: '🟢' },
];

const orphansClusterName = '_Orphans';
const unknownClusterName = '_Unknown';
let isClusterPage = false;
let hasOrphans;
let selectedNodeStages = {};

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

type IntervalValue = typeof INTERVAL_OPTIONS[number]['value'];

interface Column {
  id: keyof Cluster;
  label: string;
  sortable?: boolean;
}

const clusterColumns: Column[] = [
  { id: 'ClusterName', label: 'ClusterName', sortable: false },
  { id: 'nodeType', label: 'NodeType', sortable: false },
  { id: 'ip', label: 'IP', sortable: false },
  { id: 'stage', label: 'Stage', sortable: false },
  { id: 'nodeReady', label: 'Ready', sortable: false },
  { id: 'status', label: 'Status', sortable: false },
  { id: 'memberID', label: 'Member', sortable: false },
  { id: 'manifestsApplied', label: 'Manifests', sortable: false },
  { id: 'unmetConditions', label: 'NoCond', sortable: false },
];

interface StatusOption {
  value: string;
  label: string;
  color: string;
  icon?: React.ReactNode;
}

interface PageProps {
  delay?: string | number | null;
}

function NodeStageSelect(props) {
  const statusOptions = props.statusOptions;
  const node = props.node;
  const stage = props.stage;
  const clusterName = props.clusterName;
  const [status, setStatus] = useState<string>(stage);

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const value = event.target.value as string;
    selectedNodeStages[clusterName][node] = value;
    setStatus(value);
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

function NodeStage(props) {
  const node = props.node;
  const stage = props.stage;
  if (stage === 'running' && isClusterPage) {
    return (
    <TableCell>
      <NodeStageSelect
        statusOptions={clusterStatusOptions}
        clusterName={props.clusterName}
        node={node}
        stage={stage}
        setIsSubmitDisabled={props.setIsSubmitDisabled}
        />
    </TableCell>
    );
  }
  if (stage === 'maintenance') {
    return (
    <TableCell>
      <NodeStageSelect
        statusOptions={orphanStatusOptions}
        clusterName={props.clusterName}
        node={node}
        stage={stage}
        setIsSubmitDisabled={props.setIsSubmitDisabled}
        />
    </TableCell>
    );
  }
  return (
    <TableCell>{stage === undefined ? '?' : stage}</TableCell>
  );
}


function NodeColumns(props) {
  const cols = props.cols;
  if (cols === undefined) {
    return (<TableCell>-</TableCell>);
  }
  const nodeType = props.nodeType;
  const node = cols['ip'];
  const clusterName = props.clusterName;
  const isUnknownClusterName = clusterName === unknownClusterName;
  const href = clusterName[0] === '_' ? '/maestro/node/get' : '/maestro/node';
  let unmet = '-';
  if (cols['status'] !== undefined) {
    unmet = [];
    for (const nameReason of cols['status']['unmetConditions']) {
      unmet.push(nameReason.name + ': ' + nameReason.reason);
    }
    unmet = unmet.join(",\n")
  }
  return (
    <>
    <TableCell>
      {isUnknownClusterName ?
        <span>{node}</span>
      :
      <Link key={node} to={`${href}?cluster=${props.clusterName}&node=${node}&controlplane=${node}&type=${nodeType}`} >
        {node}
      </Link>
      }
    </TableCell>
    <NodeStage
      nodeType={nodeType}
      clusterName={props.clusterName}
      stage={cols['stage']}
      node={node}
      setIsSubmitDisabled={props.setIsSubmitDisabled}
      />
    <TableCell>{cols['nodeReady'] ? 'V' : 'X'}</TableCell>
    <TableCell>{cols['status'] === undefined ? '-' : cols['status']['ready'] ? 'V' : 'X'}</TableCell>
    <TableCell>{cols['memberID'] === '-' ? 'X' : 'V'}</TableCell>
    <TableCell>{cols['manifestsApplied'] === undefined ? '-' : cols['manifestsApplied'].length}</TableCell>
    <TableCell>{unmet}</TableCell>
    </>
  );
}

function ClusterDivider() {
  return (
    <TableRow>
      <Divider
        style={{
          backgroundColor: 'green',
          height: 5
        }} />
    </TableRow>
  );
}

function ClusterRows(props) {
  const clusterName = props.clusterName;
  const nodeTypes = props.nodeTypes;
  const clusterNameRowSpans = props.clusterNameRowSpans;
  const isOrphan = clusterName === orphansClusterName;
  const controlPlaneRows = nodeTypes['controlplanes'];
  const firstControlPlaneRow = controlPlaneRows.shift();
  const workerRows = nodeTypes['workers'];
  const firstWorkerRow = workerRows.shift();
  return (
    <>
    <ClusterDivider />
    <TableRow>
      <TableCell rowSpan={clusterNameRowSpans[clusterName]['all']}>
      {isClusterPage || clusterName[0] === '_' ?
        <span>{clusterName}</span>
        :
        <Link to={`/maestro/cluster?cluster=${clusterName}`}>{clusterName}</Link>
      }
      </TableCell>
      <TableCell
        rowSpan={clusterNameRowSpans[clusterName]['controlplanes']}>
        {isOrphan ? <span>-</span> : <span>controlplane</span>}
      </TableCell>
      <NodeColumns
        clusterName={props.clusterName}
        nodeType='controlplane'
        cols={firstControlPlaneRow}
        setIsSubmitDisabled={props.setIsSubmitDisabled}
        />
    </TableRow>
    {controlPlaneRows.map(value => (
      <TableRow>
        <NodeColumns
          clusterName={props.clusterName}
          nodeType='controlplane'
          cols={value}
          setIsSubmitDisabled={props.setIsSubmitDisabled}
          />
      </TableRow>
    ))}
    {isOrphan ?
    <TableRow>
      <Divider
        style={{
          backgroundColor: 'yellow',
          height: 5
        }} />
    </TableRow>
    :
    <>
    <TableRow>
      <TableCell rowSpan={clusterNameRowSpans[clusterName]['workers']}>worker</TableCell>
      <NodeColumns
        clusterName={props.clusterName}
        nodeType='worker'
        cols={firstWorkerRow}
        setIsSubmitDisabled={props.setIsSubmitDisabled}
        />
    </TableRow>
    {workerRows.map(value => (
      <TableRow>
        <NodeColumns
          clusterName={props.clusterName}
          nodeType='worker'
          cols={value}
          setIsSubmitDisabled={props.setIsSubmitDisabled}
          />
      </TableRow>
    ))}
    </>
    }
  </>
  );
}

const MaestroMainPage: React.FC<PageProps> = ({ delay }) => {
  const [, setIsSubmitDisabled] = useState(true);

  const [timeout, setTimeout] = useState<IntervalValue>(alignInterval(delay));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [rows, setRows] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

  const selectedCluster = queryParams.cluster;


  useEffect(() => {

    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/nodesTree', {
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
        setRows(responseRows);
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

  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value === 'null' ? null : Number(e.target.value);
    setTimeout(value as IntervalValue);
  };

  if (loading) return <div>Loading cluster list...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!rows) return <div>No data received</div>;

  let filteredRows;
  hasOrphans = rows[orphansClusterName] !== undefined;
  if (typeof selectedCluster !== 'undefined') {
    filteredRows = {};
    filteredRows[selectedCluster] = rows[selectedCluster];
    if (hasOrphans) filteredRows[orphansClusterName] = rows[orphansClusterName];
    isClusterPage = true;
  } else {
    filteredRows = rows;
    isClusterPage = false;
  }

  const clusterNameRowSpans = {}
  selectedNodeStages = {};
  const rowsByClusterName = new Map(Object.entries(filteredRows));
  for (const clusterName of Object.keys(filteredRows)) {
    selectedNodeStages[clusterName] = {};
    const isOrphan = clusterName === orphansClusterName;
    const rowSpans = {};
    const nodeTypes = rowsByClusterName.get(clusterName);
    const controlPlanes = nodeTypes['controlplanes'];
    for (const node of controlPlanes) {
      const stage = isOrphan ? 'maintenance' : 'running'
      selectedNodeStages[clusterName][node['ip']] = stage;
    }

    const workers = nodeTypes['workers'];
    for (const node of workers) {
      const stage = isOrphan ? 'maintenance' : 'running'
      selectedNodeStages[clusterName][node['ip']] = stage;
    }


    rowSpans['controlplanes'] = isOrphan ? controlPlanes.length : Math.max(controlPlanes.length, 1);
    rowSpans['workers'] = Math.max(workers.length, 1);
    rowSpans['all'] = isOrphan ? Math.max(controlPlanes.length, 1) : rowSpans['controlplanes'] + Math.max(workers.length, 1);
    clusterNameRowSpans[clusterName] = rowSpans;
  }
  const handleSubmit = async selectedNodeStages => {
    const newClusterName = inputRef.current?.value;
    let targetClusterName;
    if (newClusterName !== undefined) {
      targetClusterName = inputRef.current?.value;
      if (targetClusterName.length === 0) {
        alert('To add a node to a new cluster, enter its name.');
        return;
      }
    } else {
      for (const clusterName in selectedNodeStages) {
        if (clusterName[0] !== '_') {
          targetClusterName = clusterName;
          break;
        }
      }
    }
    const actions = {};
    let orphanControlPlaneCount = 0;
    let orphanWorkerCount = 0;
    for (const clusterName in selectedNodeStages) {
      const isOrphan = clusterName === orphansClusterName;
      for (const ip in selectedNodeStages[clusterName]) {
        const state = selectedNodeStages[clusterName][ip];
        if ((isOrphan && state !== 'maintenance') || (!isOrphan && state !== 'running')) {
          if (actions[targetClusterName] === undefined) actions[targetClusterName] = {};
          if (actions[targetClusterName][state] === undefined)  actions[targetClusterName][state] = []
          actions[targetClusterName][state].push(ip);
          if (state === 'controlplane') orphanControlPlaneCount += 1;
          if (state === 'worker') orphanWorkerCount += 1;
        }
      }
    }
    if (Object.keys(actions).length === 0) {
      alert('No changes');
      return;
    }
    if (newClusterName !== undefined && orphanWorkerCount > 0 && orphanControlPlaneCount === 0) {
      alert('When creating a new cluster, at least one node of type controlplane is required.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actions),
      });

      if (response.ok) {
        setTimeout(alignInterval('5') as IntervalValue);
      } else {
        console.error('Sending error');
      }
    } catch (err) {
      console.error('Net error:', err);
    }

  };

  return (
  <SectionBox title="" textAlign="left" paddingTop={2}>
    <Typography variant="h6">
    <Link to="/maestro">Clusters</Link>
    {isClusterPage ? <span>&nbsp;/&nbsp;{selectedCluster}</span> :<span/>}
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
      <FormControl fullWidth margin="normal" required>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {clusterColumns.map(column => (
                <TableCell key={column.id}>
                {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
          {Object.entries(filteredRows).map(([clusterName, nodeTypes]) => (
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

      {isClusterPage || !hasOrphans ?
        <div/>
        :
      <TextField
        inputRef={inputRef}
        defaultValue=""
        label="Cluster name"
        variant="outlined"
      />
      }
      {!hasOrphans ?
        <div/>
        :
      <Button
        onClick={() => handleSubmit(selectedNodeStages)}
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
        backgroundColor: 'white',
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
