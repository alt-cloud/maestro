import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  Box,
  Button,
  Divider,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { buildServerUrl } from '../../config/server';
import PageHeader from '../shared/ui/PageHeader';
import RefreshIntervalControl from '../shared/ui/RefreshIntervalControl';
import { alignRefreshInterval, getRefreshIntervalOptions, IntervalValue } from '../shared/ui/refreshIntervals';

const clusterStatusOptions: StatusOption[] = [
  {
    value: 'running',
    labelKey: 'clustersPage.stages.running',
    itemColor: '#e8f5e9',
    markerColor: '#2e7d32',
  },
  {
    value: 'restart',
    labelKey: 'clustersPage.stages.restart',
    itemColor: '#fff8e1',
    markerColor: '#ed6c02',
  },
  {
    value: 'reboot',
    labelKey: 'clustersPage.stages.reboot',
    itemColor: '#fff8e1',
    markerColor: '#ed6c02',
  },
  {
    value: 'shutdown',
    labelKey: 'clustersPage.stages.shutdown',
    itemColor: '#fff8e1',
    markerColor: '#ed6c02',
  },
  {
    value: 'reset',
    labelKey: 'clustersPage.stages.reset',
    itemColor: '#ffebee',
    markerColor: '#d32f2f',
  },
];
const orphanStatusOptions: StatusOption[] = [
  {
    value: 'maintenance',
    labelKey: 'clustersPage.stages.maintenance',
    itemColor: '#e8f5e9',
    markerColor: '#ed6c02',
  },
  {
    value: 'controlplane',
    labelKey: 'clustersPage.stages.controlplane',
    itemColor: '#e8f5e9',
    markerColor: '#2e7d32',
  },
  {
    value: 'worker',
    labelKey: 'clustersPage.stages.worker',
    itemColor: '#e8f5e9',
    markerColor: '#2e7d32',
  },
];

const orphansClusterName = '_Orphans';
const unknownClusterName = '_Unknown';
type SelectedNodeStages = Record<string, Record<string, string>>;

interface Column {
  id: string;
  label: string;
  sortable?: boolean;
}

interface StatusOption {
  value: string;
  labelKey: string;
  itemColor: string;
  markerColor: string;
}

interface PageProps {
  delay?: string | number | null;
}

function validateClusterName(
  value: string,
  existingNames: Set<string>,
  t: (key: string) => string
): string | null {
  const normalizedValue = value.trim();
  if (normalizedValue.length === 0) {
    return t('clustersPage.alertNameRequired');
  }

  if (existingNames.has(normalizedValue.toLowerCase())) {
    return t('clustersPage.alertNameDuplicate');
  }

  return null;
}

function buildPathWithQuery(pathname: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function NodeStageSelect(props) {
  const statusOptions = props.statusOptions;
  const stage = props.stage;
  const t = props.t;

  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value as string;
    props.onChangeStage(value);
  };

  return (
    <FormControl sx={{ minWidth: 90 }}>
      <Select
        onChange={handleChange}
        value={stage}
        label={t('clustersPage.columns.status')}
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
            backgroundColor: option.itemColor,
            '&:hover': {
              backgroundColor: `${option.itemColor}`,
            },
            '&.Mui-selected': {
              backgroundColor: option.itemColor,
              fontWeight: 'bold',
            },
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            component="span"
            sx={{
              backgroundColor: option.markerColor,
              borderRadius: '50%',
              display: 'inline-block',
              flexShrink: 0,
              height: 10,
              width: 10,
            }}
          />
          <span>{t(option.labelKey)}</span>
        </MenuItem>
      ))}
      </Select>
    </FormControl>
  );
}

function getTranslatedStage(stage: string | undefined, t: (key: string) => string) {
  if (typeof stage === 'undefined') {
    return t('common.unknown');
  }

  const key = `clustersPage.stages.${stage}`;
  const translated = t(key);
  return translated === key ? stage : translated;
}

function NodeStage(props) {
  const stage = props.stage;
  const isClusterPage = props.isClusterPage;
  const t = props.t;
  if (stage === 'running' && isClusterPage) {
    return (
    <TableCell>
      <NodeStageSelect
        onChangeStage={props.onChangeStage}
        statusOptions={clusterStatusOptions}
        stage={stage}
        t={t}
        />
    </TableCell>
    );
  }
  if (stage === 'maintenance') {
    return (
    <TableCell>
      <NodeStageSelect
        onChangeStage={props.onChangeStage}
        statusOptions={orphanStatusOptions}
        stage={stage}
        t={t}
        />
    </TableCell>
    );
  }
  return (
    <TableCell>{getTranslatedStage(stage, t)}</TableCell>
  );
}


function NodeColumns(props) {
  const cols = props.cols;
  const t = props.t;
  if (cols === undefined) {
    return (<TableCell>-</TableCell>);
  }
  const nodeType = props.nodeType;
  const node = cols['ip'];
  const clusterName = props.clusterName;
  const isUnknownClusterName = clusterName === unknownClusterName;
  const href = clusterName[0] === '_' ? '/maestro/node/get' : '/maestro/node';
  const nodeLinkParams = new URLSearchParams();
  nodeLinkParams.set('cluster', props.clusterName);
  nodeLinkParams.set('node', node);
  nodeLinkParams.set('type', nodeType);
  const nodeLink = `${href}?${nodeLinkParams.toString()}`;
  let unmet = '-';
  const stage = props.currentStage ?? cols['stage'];
  if (cols['status'] !== undefined) {
    const unmetConditions: string[] = [];
    for (const nameReason of cols['status']['unmetConditions']) {
      unmetConditions.push(nameReason.name + ': ' + nameReason.reason);
    }
    unmet = unmetConditions.join(",\n")
  }
  return (
    <>
    <TableCell>
      {isUnknownClusterName ?
        <span>{node}</span>
      :
      <Link key={node} to={nodeLink} >
        {node}
      </Link>
      }
    </TableCell>
    <NodeStage
      isClusterPage={props.isClusterPage}
      onChangeStage={props.onChangeStage}
      stage={stage}
      t={t}
      />
    <TableCell>{cols['nodeReady'] ? t('common.yes') : t('common.no')}</TableCell>
    <TableCell>{cols['status'] === undefined ? '-' : cols['status']['ready'] ? t('common.yes') : t('common.no')}</TableCell>
    <TableCell>{cols['memberID'] === '-' ? t('common.no') : t('common.yes')}</TableCell>
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
  const clusterNodeStages = props.selectedNodeStages?.[clusterName] || {};
  const t = props.t;
  const nodeTypes = props.nodeTypes;
  const clusterNameRowSpans = props.clusterNameRowSpans;
  const isClusterPage = props.isClusterPage;
  const isOrphan = clusterName === orphansClusterName;
  const clusterLink = buildPathWithQuery('/maestro/cluster', { cluster: clusterName });
  const [firstControlPlaneRow, ...controlPlaneRows] = nodeTypes['controlplanes'] ?? [];
  const [firstWorkerRow, ...workerRows] = nodeTypes['workers'] ?? [];
  return (
    <>
    <ClusterDivider />
    <TableRow>
      <TableCell rowSpan={clusterNameRowSpans[clusterName]['all']}>
      {isClusterPage || clusterName[0] === '_' ?
        <span>{clusterName}</span>
        :
        <Link to={clusterLink}>{clusterName}</Link>
      }
      </TableCell>
      <TableCell
        rowSpan={clusterNameRowSpans[clusterName]['controlplanes']}>
        {isOrphan ? <span>-</span> : <span>{t('common.controlplane')}</span>}
      </TableCell>
      <NodeColumns
        clusterName={props.clusterName}
        currentStage={clusterNodeStages[firstControlPlaneRow?.ip]}
        nodeType='controlplane'
        cols={firstControlPlaneRow}
        isClusterPage={isClusterPage}
        onChangeStage={(nextStage: string) => {
          if (firstControlPlaneRow?.ip) {
            props.onStageChange(clusterName, firstControlPlaneRow.ip, nextStage);
          }
        }}
        t={t}
        />
    </TableRow>
    {controlPlaneRows.map((value, index) => (
      <TableRow key={`${clusterName}-controlplane-${value?.ip || index}`}>
        <NodeColumns
          clusterName={props.clusterName}
          currentStage={clusterNodeStages[value?.ip]}
          nodeType='controlplane'
          cols={value}
          isClusterPage={isClusterPage}
          onChangeStage={(nextStage: string) => {
            if (value?.ip) {
              props.onStageChange(clusterName, value.ip, nextStage);
            }
          }}
          t={t}
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
      <TableCell rowSpan={clusterNameRowSpans[clusterName]['workers']}>{t('common.worker')}</TableCell>
      <NodeColumns
        clusterName={props.clusterName}
        currentStage={clusterNodeStages[firstWorkerRow?.ip]}
        nodeType='worker'
        cols={firstWorkerRow}
        isClusterPage={isClusterPage}
        onChangeStage={(nextStage: string) => {
          if (firstWorkerRow?.ip) {
            props.onStageChange(clusterName, firstWorkerRow.ip, nextStage);
          }
        }}
        t={t}
        />
    </TableRow>
    {workerRows.map((value, index) => (
      <TableRow key={`${clusterName}-worker-${value?.ip || index}`}>
        <NodeColumns
          clusterName={props.clusterName}
          currentStage={clusterNodeStages[value?.ip]}
          nodeType='worker'
          cols={value}
          isClusterPage={isClusterPage}
          onChangeStage={(nextStage: string) => {
            if (value?.ip) {
              props.onStageChange(clusterName, value.ip, nextStage);
            }
          }}
          t={t}
          />
      </TableRow>
    ))}
    </>
    }
  </>
  );
}

const MaestroMainPage: React.FC<PageProps> = ({ delay }) => {
  const { t } = useTranslation();
  const intervalOptions = useMemo(() => getRefreshIntervalOptions(t), [t]);
  const clusterColumns: Column[] = useMemo(
    () => [
      { id: 'ClusterName', label: t('clustersPage.columns.clusterName'), sortable: false },
      { id: 'nodeType', label: t('clustersPage.columns.nodeType'), sortable: false },
      { id: 'ip', label: t('clustersPage.columns.ip'), sortable: false },
      { id: 'stage', label: t('clustersPage.columns.stage'), sortable: false },
      { id: 'nodeReady', label: t('clustersPage.columns.nodeReady'), sortable: false },
      { id: 'status', label: t('clustersPage.columns.status'), sortable: false },
      { id: 'memberID', label: t('clustersPage.columns.member'), sortable: false },
      { id: 'manifestsApplied', label: t('clustersPage.columns.manifests'), sortable: false },
      { id: 'unmetConditions', label: t('clustersPage.columns.noConditions'), sortable: false },
    ],
    [t]
  );
  const [timeout, setTimeout] = useState<IntervalValue>(alignRefreshInterval(delay));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [newClusterName, setNewClusterName] = useState('');
  const [clusterNameError, setClusterNameError] = useState<string | null>(null);
  const [selectedNodeStages, setSelectedNodeStages] = useState<SelectedNodeStages>({});

  const [rows, setRows] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

  const selectedCluster = queryParams.cluster;
  const isClusterPage = typeof selectedCluster !== 'undefined';
  const hasOrphans = rows[orphansClusterName] !== undefined;

  const filteredRows = useMemo(() => {
    if (!isClusterPage) {
      return rows;
    }

    const nextRows: Record<string, any> = {};
    if (selectedCluster && rows[selectedCluster]) {
      nextRows[selectedCluster] = rows[selectedCluster];
    }
    if (hasOrphans && rows[orphansClusterName]) {
      nextRows[orphansClusterName] = rows[orphansClusterName];
    }
    return nextRows;
  }, [hasOrphans, isClusterPage, rows, selectedCluster]);

  const clusterNameRowSpans = useMemo(() => {
    const rowSpansByCluster: Record<string, { all: number; controlplanes: number; workers: number }> = {};
    for (const clusterName of Object.keys(filteredRows)) {
      const isOrphan = clusterName === orphansClusterName;
      const nodeTypes = filteredRows[clusterName] || {};
      const controlPlanes = nodeTypes['controlplanes'] || [];
      const workers = nodeTypes['workers'] || [];
      const controlPlanesRowSpan = isOrphan ? controlPlanes.length : Math.max(controlPlanes.length, 1);
      const workersRowSpan = Math.max(workers.length, 1);
      rowSpansByCluster[clusterName] = {
        all: isOrphan ? Math.max(controlPlanes.length, 1) : controlPlanesRowSpan + workersRowSpan,
        controlplanes: controlPlanesRowSpan,
        workers: workersRowSpan,
      };
    }
    return rowSpansByCluster;
  }, [filteredRows]);

  const initialSelectedNodeStages = useMemo(() => {
    const nextSelections: SelectedNodeStages = {};
    for (const clusterName of Object.keys(filteredRows)) {
      const isOrphan = clusterName === orphansClusterName;
      const nodeTypes = filteredRows[clusterName] || {};
      const controlPlanes = nodeTypes['controlplanes'] || [];
      const workers = nodeTypes['workers'] || [];
      nextSelections[clusterName] = {};

      for (const node of controlPlanes) {
        if (node?.ip) {
          nextSelections[clusterName][node.ip] = isOrphan ? 'maintenance' : 'running';
        }
      }

      for (const node of workers) {
        if (node?.ip) {
          nextSelections[clusterName][node.ip] = isOrphan ? 'maintenance' : 'running';
        }
      }
    }
    return nextSelections;
  }, [filteredRows]);

  useEffect(() => {
    setSelectedNodeStages(previousSelections => {
      const mergedSelections: SelectedNodeStages = {};

      for (const [clusterName, nodeStages] of Object.entries(initialSelectedNodeStages)) {
        mergedSelections[clusterName] = {};
        for (const [nodeIp, defaultStage] of Object.entries(nodeStages)) {
          mergedSelections[clusterName][nodeIp] = previousSelections[clusterName]?.[nodeIp] ?? defaultStage;
        }
      }

      return mergedSelections;
    });
  }, [initialSelectedNodeStages]);

  const existingClusterNames = useMemo(
    () =>
      new Set(
        Object.keys(rows)
          .filter(name => !name.startsWith('_'))
          .map(name => name.toLowerCase())
      ),
    [rows]
  );

  const shouldProvideNewClusterName = !isClusterPage && hasOrphans;
  const nextClusterNameValidationError = shouldProvideNewClusterName
    ? validateClusterName(newClusterName, existingClusterNames, t)
    : null;

  const handleNodeStageChange = (clusterName: string, nodeIp: string, nextStage: string) => {
    setSelectedNodeStages(previousSelections => ({
      ...previousSelections,
      [clusterName]: {
        ...(previousSelections[clusterName] || {}),
        [nodeIp]: nextStage,
      },
    }));
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const response = await fetch(buildServerUrl('/nodesTree'), {
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
        setRows(responseRows);
        setError(null);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        setError(err.message || t('common.failedToLoadData'));
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
  }, [t, timeout]);

  if (loading) {
    return (
      <SectionBox title="" textAlign="left" paddingTop={2}>
        <Alert severity="info">{t('clustersPage.loadingClusterList')}</Alert>
      </SectionBox>
    );
  }

  if (error) {
    return (
      <SectionBox title="" textAlign="left" paddingTop={2}>
        <Alert severity="error">{t('common.errorPrefix', { message: error })}</Alert>
      </SectionBox>
    );
  }

  if (!rows) {
    return (
      <SectionBox title="" textAlign="left" paddingTop={2}>
        <Alert severity="warning">{t('common.noDataReceived')}</Alert>
      </SectionBox>
    );
  }

  const handleSubmit = async nextSelectedNodeStages => {
    let targetClusterName: string | undefined;
    if (shouldProvideNewClusterName) {
      const validationError = validateClusterName(newClusterName, existingClusterNames, t);
      if (validationError) {
        setClusterNameError(validationError);
        return;
      }
      targetClusterName = newClusterName.trim();
    } else {
      for (const clusterName in nextSelectedNodeStages) {
        if (clusterName[0] !== '_') {
          targetClusterName = clusterName;
          break;
        }
      }
    }

    if (!targetClusterName) {
      alert(t('clustersPage.alertTargetClusterMissing'));
      return;
    }

    const actions = {};
    let orphanControlPlaneCount = 0;
    let orphanWorkerCount = 0;
    for (const clusterName in nextSelectedNodeStages) {
      const isOrphan = clusterName === orphansClusterName;
      for (const ip in nextSelectedNodeStages[clusterName]) {
        const state = nextSelectedNodeStages[clusterName][ip];
        if ((isOrphan && state !== 'maintenance') || (!isOrphan && state !== 'running')) {
          if (actions[targetClusterName] === undefined) {
            actions[targetClusterName] = {};
          }
          if (actions[targetClusterName][state] === undefined) {
            actions[targetClusterName][state] = [];
          }
          actions[targetClusterName][state].push(ip);
          if (state === 'controlplane') {
            orphanControlPlaneCount += 1;
          }
          if (state === 'worker') {
            orphanWorkerCount += 1;
          }
        }
      }
    }

    if (Object.keys(actions).length === 0) {
      alert(t('clustersPage.alertNoChanges'));
      return;
    }

    if (shouldProvideNewClusterName && orphanWorkerCount > 0 && orphanControlPlaneCount === 0) {
      alert(t('clustersPage.alertControlplaneRequired'));
      return;
    }

    try {
      const response = await fetch(buildServerUrl('/apply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actions),
      });

      if (response.ok) {
        setTimeout(alignRefreshInterval('5'));
      } else {
        console.error(t('clustersPage.sendError'));
      }
    } catch (err) {
      console.error(t('clustersPage.netError'), err);
    }
  };

  return (
    <SectionBox title="" textAlign="left" paddingTop={2}>
      <PageHeader
        breadcrumbs={[
          { label: t('common.clusters'), to: '/maestro' },
          ...(isClusterPage ? [{ label: selectedCluster || t('common.cluster') }] : []),
        ]}
        subtitle={t('clustersPage.subtitle')}
        title={t('clustersPage.title')}
      />
      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack direction={{ sm: 'row', xs: 'column' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
          <RefreshIntervalControl onChange={setTimeout} options={intervalOptions} value={timeout} />
          <Button component={Link} size="small" to="/maestro/cluster/scanNets" variant="contained">
            {t('clustersPage.scanNetworks')}
          </Button>
        </Stack>
        <form>
          <FormControl fullWidth margin="normal" required>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {clusterColumns.map(column => (
                      <TableCell key={column.id}>{column.label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(filteredRows).map(([clusterName, nodeTypes]) => (
                    <ClusterRows
                      clusterName={clusterName}
                      clusterNameRowSpans={clusterNameRowSpans}
                      isClusterPage={isClusterPage}
                      key={clusterName}
                      nodeTypes={nodeTypes}
                      onStageChange={handleNodeStageChange}
                      selectedNodeStages={selectedNodeStages}
                      t={t}
                    />
                  ))}
                  <Divider
                    style={{
                      backgroundColor: 'green',
                      height: 5,
                    }}
                  />
                </TableBody>
              </Table>
            </TableContainer>
          </FormControl>

          {hasOrphans && (
            <Stack
              alignItems={{ md: 'flex-start', xs: 'stretch' }}
              direction={{ md: 'row', xs: 'column' }}
              justifyContent="space-between"
              spacing={2}
              sx={{ mt: 2.5 }}
            >
              {shouldProvideNewClusterName && (
                <TextField
                  error={Boolean(clusterNameError)}
                  helperText={clusterNameError || t('clustersPage.clusterNameHelper')}
                  label={t('clustersPage.clusterNameLabel')}
                  onBlur={() => {
                    setClusterNameError(validateClusterName(newClusterName, existingClusterNames, t));
                  }}
                  onChange={event => {
                    const value = event.target.value;
                    setNewClusterName(value);
                    if (clusterNameError) {
                      setClusterNameError(validateClusterName(value, existingClusterNames, t));
                    }
                  }}
                  sx={{ maxWidth: 420, width: { md: 360, xs: '100%' } }}
                  value={newClusterName}
                  variant="outlined"
                />
              )}

              <Button
                aria-label={t('clustersPage.createClusterAria')}
                color="primary"
                disabled={Boolean(nextClusterNameValidationError)}
                onClick={() => handleSubmit(selectedNodeStages)}
                size="large"
                sx={{
                  ml: { md: 'auto' },
                  minWidth: { md: 220 },
                  px: 4,
                  width: { md: 'auto', xs: '100%' },
                }}
                variant="contained"
              >
                {t('clustersPage.applyChanges')}
              </Button>
            </Stack>
          )}
        </form>
      </Paper>
    </SectionBox>
  );
};

export default MaestroMainPage;
