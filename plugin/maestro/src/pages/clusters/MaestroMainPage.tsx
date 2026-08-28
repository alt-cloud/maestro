import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Alert,
  AlertColor,
  Box,
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApiErrorHandler } from '../../shared/auth/useApiErrorHandler';
import { apiClient, MaestroApiError } from '../../shared/utils/apiClient';
import PageHeader from '../shared/ui/PageHeader';
import RefreshIntervalControl from '../shared/ui/RefreshIntervalControl';
import { alignRefreshInterval, getRefreshIntervalOptions, IntervalValue } from '../shared/ui/refreshIntervals';
import ClusterConfigDialog, {
  ClusterPatches,
  ImageConfig,
} from './ClusterConfigDialog';

const clusterStatusOptions: StatusOption[] = [
  {
    value: 'running',
    labelKey: 'clustersPage.stages.running',
    markerColor: '#2e7d32',
  },
  {
    value: 'restart',
    labelKey: 'clustersPage.stages.restart',
    markerColor: '#ed6c02',
  },
  {
    value: 'reboot',
    labelKey: 'clustersPage.stages.reboot',
    markerColor: '#ed6c02',
  },
  {
    value: 'shutdown',
    labelKey: 'clustersPage.stages.shutdown',
    markerColor: '#ed6c02',
  },
  {
    value: 'reset',
    labelKey: 'clustersPage.stages.reset',
    markerColor: '#d32f2f',
  },
];
const orphanStatusOptions: StatusOption[] = [
  {
    value: 'maintenance',
    labelKey: 'clustersPage.stages.maintenance',
    markerColor: '#ed6c02',
  },
  {
    value: 'controlplane',
    labelKey: 'clustersPage.stages.controlplane',
    markerColor: '#2e7d32',
  },
  {
    value: 'worker',
    labelKey: 'clustersPage.stages.worker',
    markerColor: '#2e7d32',
  },
];

const orphansClusterName = '_Orphans';
type SelectedNodeStages = Record<string, Record<string, string>>;

interface Column {
  id: string;
  label: string;
  sortable?: boolean;
}

interface StatusOption {
  value: string;
  labelKey: string;
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
    <FormControl size="small" sx={{ minWidth: 90 }}>
      <Select
        onChange={handleChange}
        size="small"
        value={stage}
        label={t('clustersPage.columns.status')}
        sx={{
          '& .MuiSelect-select': {
            alignItems: 'center',
            display: 'flex',
            fontSize: '0.875rem',
            gap: 1,
          },
        }}
      >
      {statusOptions.map((option) => (
        <MenuItem
          key={option.value}
          value={option.value}
          sx={{
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            '&.Mui-selected': {
              backgroundColor: 'action.selected',
              fontWeight: 600,
            },
            '&.Mui-selected:hover': {
              backgroundColor: 'action.selected',
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

const allStatusOptions = [...clusterStatusOptions, ...orphanStatusOptions];

function StageIndicator({ stage, t }: { stage: string | undefined; t: (key: string) => string }) {
  const option = allStatusOptions.find(o => o.value === stage);
  return (
    <Box alignItems="center" display="flex" gap={0.75}>
      <Box
        component="span"
        sx={{
          backgroundColor: option?.markerColor ?? 'grey.400',
          borderRadius: '50%',
          display: 'inline-block',
          flexShrink: 0,
          height: 8,
          width: 8,
        }}
      />
      <Typography variant="body2">{getTranslatedStage(stage, t)}</Typography>
    </Box>
  );
}

function ClusterSeparator() {
  return (
    <TableRow>
      <TableCell
        colSpan={9}
        sx={{ backgroundColor: 'action.hover', border: 0, height: 6, p: 0 }}
      />
    </TableRow>
  );
}

function NodeStage(props) {
  const stage = props.stage;
  const originalStage = props.originalStage;
  const isOrphan = props.isOrphan;
  const isClusterPage = props.isClusterPage;
  const t = props.t;
  if (originalStage === 'running' && isClusterPage) {
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
  if (isOrphan) {
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
    <TableCell>
      <StageIndicator stage={stage} t={t} />
    </TableCell>
  );
}


function NodeColumns(props) {
  const cols = props.cols;
  const t = props.t;
  if (cols === undefined) {
    return (
      <>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
        <TableCell>-</TableCell>
      </>
    );
  }
  const nodeType = props.nodeType;
  const node = cols['ip'];
  const clusterName = props.clusterName;
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
      <Link key={node} to={nodeLink} >
        {node}
      </Link>
    </TableCell>
    <NodeStage
      isClusterPage={props.isClusterPage}
      isOrphan={props.isOrphan}
      onChangeStage={props.onChangeStage}
      originalStage={cols['stage']}
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

const nodeTypeCellSx = (color: string) => ({
  borderLeft: '3px solid',
  borderLeftColor: color,
  color: 'text.secondary',
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
  verticalAlign: 'top',
  whiteSpace: 'nowrap' as const,
});

function ClusterRows(props) {
  const clusterName = props.clusterName;
  const clusterNodeStages = props.selectedNodeStages?.[clusterName] || {};
  const t = props.t;
  const nodeTypes = props.nodeTypes;
  const clusterNameRowSpans = props.clusterNameRowSpans;
  const isClusterPage = props.isClusterPage;
  const isOrphan = clusterName === orphansClusterName;
  const clusterLink = buildPathWithQuery('/maestro/cluster', { cluster: clusterName });

  const clusterNameCell = (
    <TableCell
      rowSpan={clusterNameRowSpans[clusterName]['all']}
      sx={{ fontWeight: 600, verticalAlign: 'top' }}
    >
      {isClusterPage || clusterName[0] === '_' ? (
        <span>{clusterName}</span>
      ) : (
        <Link to={clusterLink}>{clusterName}</Link>
      )}
    </TableCell>
  );

  if (isOrphan) {
    // No machine config applied, or unreachable — there's no reliable role to report.
    const [firstRow, ...restRows] = nodeTypes['unassigned'] ?? [];
    return (
      <>
        <ClusterSeparator />
        <TableRow>
          {clusterNameCell}
          <TableCell rowSpan={clusterNameRowSpans[clusterName]['unassigned']} sx={nodeTypeCellSx('text.disabled')}>
            -
          </TableCell>
          <NodeColumns
            clusterName={props.clusterName}
            cols={firstRow}
            currentStage={clusterNodeStages[firstRow?.ip]}
            isClusterPage={isClusterPage}
            isOrphan={isOrphan}
            onChangeStage={(nextStage: string) => {
              if (firstRow?.ip) {
                props.onStageChange(clusterName, firstRow.ip, nextStage);
              }
            }}
            t={t}
          />
        </TableRow>
        {restRows.map((value, index) => (
          <TableRow key={`${clusterName}-unassigned-${value?.ip || index}`}>
            <NodeColumns
              clusterName={props.clusterName}
              cols={value}
              currentStage={clusterNodeStages[value?.ip]}
              isClusterPage={isClusterPage}
              isOrphan={isOrphan}
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
    );
  }

  const [firstControlPlaneRow, ...controlPlaneRows] = nodeTypes['controlplanes'] ?? [];
  const [firstWorkerRow, ...workerRows] = nodeTypes['workers'] ?? [];

  return (
    <>
      <ClusterSeparator />
      <TableRow>
        {clusterNameCell}
        <TableCell
          rowSpan={clusterNameRowSpans[clusterName]['controlplanes']}
          sx={nodeTypeCellSx('info.main')}
        >
          {t('common.controlplane')}
        </TableCell>
        <NodeColumns
          clusterName={props.clusterName}
          cols={firstControlPlaneRow}
          currentStage={clusterNodeStages[firstControlPlaneRow?.ip]}
          isClusterPage={isClusterPage}
          isOrphan={isOrphan}
          nodeType="controlplane"
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
            cols={value}
            currentStage={clusterNodeStages[value?.ip]}
            isClusterPage={isClusterPage}
            isOrphan={isOrphan}
            nodeType="controlplane"
            onChangeStage={(nextStage: string) => {
              if (value?.ip) {
                props.onStageChange(clusterName, value.ip, nextStage);
              }
            }}
            t={t}
          />
        </TableRow>
      ))}
        <TableRow>
          <TableCell
            rowSpan={clusterNameRowSpans[clusterName]['workers']}
            sx={nodeTypeCellSx('success.main')}
          >
            {t('common.worker')}
          </TableCell>
          <NodeColumns
            clusterName={props.clusterName}
            cols={firstWorkerRow}
            currentStage={clusterNodeStages[firstWorkerRow?.ip]}
            isClusterPage={isClusterPage}
            isOrphan={false}
            nodeType="worker"
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
              cols={value}
              currentStage={clusterNodeStages[value?.ip]}
              isClusterPage={isClusterPage}
              isOrphan={false}
              nodeType="worker"
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
  );
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

const MaestroMainPage: React.FC<PageProps> = ({ delay }) => {
  const { t } = useTranslation();
  const safeApiCall = useApiErrorHandler();
  const failedToLoadDataText = t('common.failedToLoadData');
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
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [selectedNodeStages, setSelectedNodeStages] = useState<SelectedNodeStages>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingSubmitStages, setPendingSubmitStages] = useState<SelectedNodeStages | null>(null);
  const [newClusterName, setNewClusterName] = useState('');
  const [clusterNameError, setClusterNameError] = useState<string | null>(null);

  const [rows, setRows] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

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
    const rowSpansByCluster: Record<
      string,
      { all: number; controlplanes: number; workers: number; unassigned: number }
    > = {};
    for (const clusterName of Object.keys(filteredRows)) {
      const isOrphan = clusterName === orphansClusterName;
      const nodeTypes = filteredRows[clusterName] || {};
      if (isOrphan) {
        const unassignedRowSpan = Math.max((nodeTypes['unassigned'] || []).length, 1);
        rowSpansByCluster[clusterName] = {
          all: unassignedRowSpan,
          controlplanes: 0,
          workers: 0,
          unassigned: unassignedRowSpan,
        };
        continue;
      }
      const controlPlanes = nodeTypes['controlplanes'] || [];
      const workers = nodeTypes['workers'] || [];
      const controlPlanesRowSpan = Math.max(controlPlanes.length, 1);
      const workersRowSpan = Math.max(workers.length, 1);
      rowSpansByCluster[clusterName] = {
        all: controlPlanesRowSpan + workersRowSpan,
        controlplanes: controlPlanesRowSpan,
        workers: workersRowSpan,
        unassigned: 0,
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
      const unassigned = nodeTypes['unassigned'] || [];
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

      for (const node of unassigned) {
        if (node?.ip) {
          nextSelections[clusterName][node.ip] = 'maintenance';
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
    let isFetching = false;

    const fetchData = async () => {
      if (isFetching || controller.signal.aborted) {
        return;
      }
      isFetching = true;
      try {
        const responseRows = await safeApiCall(() =>
          apiClient.get<Record<string, any>>('/nodesTree', {
            signal: controller.signal,
          })
        );
        setRows(responseRows);
        setError(null);
        setLastUpdatedAt(new Date());
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        if (err instanceof MaestroApiError) {
          setError(err.toUserMessage());
        } else {
          setError(err.message || failedToLoadDataText);
        }
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
    const id = setInterval(fetchData, timeout);
    return () => {
      clearInterval(id);
      controller.abort();
    };
  }, [failedToLoadDataText, timeout, refreshTick]);

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

  const buildActions = (nextSelectedNodeStages: SelectedNodeStages, targetClusterName: string) => {
    const actions: Record<string, Record<string, string[]>> = {};
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
          if (state === 'controlplane') orphanControlPlaneCount += 1;
          if (state === 'worker') orphanWorkerCount += 1;
        }
      }
    }

    return { actions, orphanControlPlaneCount, orphanWorkerCount };
  };

  const handleSubmit = (nextSelectedNodeStages: SelectedNodeStages) => {
    let targetClusterName: string | undefined;
    if (!shouldProvideNewClusterName) {
      for (const clusterName in nextSelectedNodeStages) {
        if (clusterName[0] !== '_') {
          targetClusterName = clusterName;
          break;
        }
      }
      if (!targetClusterName) {
        alert(t('clustersPage.alertTargetClusterMissing'));
        return;
      }
    } else {
      targetClusterName = '__new__';
    }

    const { actions, orphanControlPlaneCount, orphanWorkerCount } = buildActions(
      nextSelectedNodeStages,
      targetClusterName
    );

    if (Object.keys(actions).length === 0) {
      alert(t('clustersPage.alertNoChanges'));
      return;
    }

    if (shouldProvideNewClusterName && orphanWorkerCount > 0 && orphanControlPlaneCount === 0) {
      alert(t('clustersPage.alertControlplaneRequired'));
      return;
    }

    setPendingSubmitStages(nextSelectedNodeStages);
    setDialogOpen(true);
  };

  const getSelectedIps = (
    nextSelectedNodeStages: SelectedNodeStages,
    nodeType: 'controlplane' | 'worker'
  ): string[] => {
    const ips: string[] = [];
    for (const clusterName in nextSelectedNodeStages) {
      for (const ip in nextSelectedNodeStages[clusterName]) {
        if (nextSelectedNodeStages[clusterName][ip] === nodeType) {
          ips.push(ip);
        }
      }
    }
    return ips;
  };

  const handleDialogSubmit = async (
    imageConfig: ImageConfig | null,
    patches: ClusterPatches
  ) => {
    if (!pendingSubmitStages) return;

    let targetClusterName = '';
    if (shouldProvideNewClusterName) {
      targetClusterName = newClusterName.trim();
    } else {
      for (const cn in pendingSubmitStages) {
        if (cn[0] !== '_') {
          targetClusterName = cn;
          break;
        }
      }
    }

    const { actions } = buildActions(pendingSubmitStages, targetClusterName);

    const patchesPayload = {
      common: patches.common,
      controlplane: patches.controlplane.general,
      worker: patches.worker.general,
      nodes: {
        ...patches.controlplane.nodes,
        ...patches.worker.nodes,
      },
    };

    const body: Record<string, unknown> = { actions };
    if (imageConfig) body.imageConfig = imageConfig;
    body.patches = patchesPayload;
    try {
      await apiClient.post('/apply', body);
      setRefreshTick(current => current + 1);
    } catch (err) {
      if (err instanceof MaestroApiError) {
        console.error(t('clustersPage.sendError'), err.toUserMessage());
        setSnackbar({ open: true, message: t('scanNetworks.sendError') + `: ${err.toUserMessage()}`, severity: 'error' });
      } else {
        console.error(t('clustersPage.netError'), err);
        setSnackbar({ open: true, message: t('scanNetworks.netError') + `: ${err}`, severity: 'error' });
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  const dialogControlplaneIps = pendingSubmitStages
    ? getSelectedIps(pendingSubmitStages, 'controlplane')
    : [];
  const dialogWorkerIps = pendingSubmitStages
    ? getSelectedIps(pendingSubmitStages, 'worker')
    : [];
  const dialogClusterName = shouldProvideNewClusterName
    ? newClusterName.trim()
    : (() => {
        for (const clusterName in selectedNodeStages) {
          if (clusterName[0] !== '_') return clusterName;
        }
        return '';
      })();

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
      <Paper sx={{ p: 2.5, borderRadius: 2 }} variant="outlined">
        <Stack
          alignItems={{ sm: 'center' }}
          direction={{ sm: 'row', xs: 'column' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 2.5 }}
        >
          <Box>
            <RefreshIntervalControl onChange={setTimeout} options={intervalOptions} value={timeout} />
            <Typography color="text.secondary" display="block" sx={{ mt: 0.25 }} variant="caption">
              {t('clustersPage.lastUpdated')}:{' '}
              {lastUpdatedAt ? lastUpdatedAt.toLocaleTimeString() : t('common.unknown')}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => setRefreshTick(current => current + 1)}
              size="small"
              variant="outlined"
            >
              {t('clustersPage.refreshNow')}
            </Button>
            <Button component={Link} size="small" to="/maestro/cluster/scanNets" variant="contained">
              {t('clustersPage.scanNetworks')}
            </Button>
          </Stack>
        </Stack>
        <form>
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 2 }}
            variant="outlined"
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  {clusterColumns.map(column => (
                    <TableCell
                      key={column.id}
                      sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                    >
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
                    isClusterPage={isClusterPage}
                    key={clusterName}
                    nodeTypes={nodeTypes}
                    onStageChange={handleNodeStageChange}
                    selectedNodeStages={selectedNodeStages}
                    t={t}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

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
                aria-label={isClusterPage ? t('clustersPage.addNodesToClusterAria') : t('clustersPage.createClusterAria')}
                color="primary"
                disabled={
                  shouldProvideNewClusterName &&
                  Boolean(validateClusterName(newClusterName, existingClusterNames, t))
                }
                onClick={() => handleSubmit(selectedNodeStages)}
                sx={{
                  alignSelf: { md: 'stretch' },
                  ml: { md: 'auto' },
                  minWidth: { md: 220 },
                  px: 4,
                  width: { md: 'auto', xs: '100%' },
                }}
                variant="contained"
              >
                {isClusterPage ? t('clustersPage.addNodesToCluster') : t('clustersPage.createCluster')}
              </Button>
            </Stack>
          )}

          <ClusterConfigDialog
            clusterName={dialogClusterName}
            controlplaneIps={dialogControlplaneIps}
            onClose={() => {
              setDialogOpen(false);
              setPendingSubmitStages(null);
            }}
            onSubmit={handleDialogSubmit}
            open={dialogOpen}
            workerIps={dialogWorkerIps}
          />
        </form>
      </Paper>
      <Snackbar autoHideDuration={3000} onClose={handleCloseSnackbar} open={snackbar.open}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SectionBox>
  );
};

export default MaestroMainPage;
