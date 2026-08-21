import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '../../shared/utils/apiClient';
// Theme-aware accent color from the design
const ACCENT_LIGHT = '#664AE3';
const ACCENT_DARK = '#A999EF';

export interface PatchFile {
  name: string;
  content: string; // base64
}

export interface NodeTypePatches {
  general: PatchFile[];
  nodes: Record<string, PatchFile[]>;
}

export interface ClusterPatches {
  common: PatchFile[];
  controlplane: NodeTypePatches;
  worker: NodeTypePatches;
}

export interface ImageConfig {
  installerImageUrl?: string;
  version?: string;
  arch?: 'amd64' | 'arm64';
  secureBoot?: boolean;
  extensions?: string[];
  kernelArgs?: string[];
  cni?: string;
  kubernetesVersion?: string;
}

export interface ClusterConfigDialogProps {
  open: boolean;
  clusterName: string;
  controlplaneIps: string[];
  workerIps: string[];
  onClose: () => void;
  onSubmit: (imageConfig: ImageConfig | null, patches: ClusterPatches) => void;
}

interface FactoryExtension {
  name: string;
  ref: string;
  digest: string;
  description?: string;
}

function extractVersion(ref: string): string {
  const parts = ref.split(':');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      resolve(btoa(unescape(encodeURIComponent(text))));
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

interface PatchUploadButtonProps {
  onUpload: (patch: PatchFile) => void;
  label: string;
}

function PatchUploadButton({ onUpload, label }: PatchUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await readFileAsBase64(file);
    onUpload({ name: file.name, content });
    e.target.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        accept=".yaml,.yml,.json,.patch"
        hidden
        onChange={handleChange}
        type="file"
      />
      <Button
        onClick={() => inputRef.current?.click()}
        size="small"
        sx={{ borderRadius: 1, minWidth: 0, px: 1 }}
        variant="outlined"
      >
        {label}
      </Button>
    </>
  );
}

function PatchChips({
  patches,
  onChange,
}: {
  patches: PatchFile[];
  onChange: (patches: PatchFile[]) => void;
}) {
  return (
    <Box alignItems="center" display="flex" flexWrap="wrap" gap={0.5}>
      {patches.map((patch, i) => (
        <Chip
          key={`${patch.name}-${i}`}
          label={patch.name}
          onDelete={() => onChange(patches.filter((_, j) => j !== i))}
          size="small"
          variant="outlined"
        />
      ))}
      <PatchUploadButton label="+" onUpload={patch => onChange([...patches, patch])} />
    </Box>
  );
}

interface PatchGroupRow {
  key: string;
  label: string;
  patches: PatchFile[];
  onChange: (patches: PatchFile[]) => void;
}

// Single table with the group-level patches: Common, Controlplanes, Workers.
function PatchGroupTable({ rows }: { rows: PatchGroupRow[] }) {
  const { t } = useTranslation();
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '25%' }}>{t('clusterConfigDialog.group')}</TableCell>
            <TableCell>{t('clusterConfigDialog.patchesSection')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.key}>
              <TableCell>{row.label}</TableCell>
              <TableCell>
                <PatchChips onChange={row.onChange} patches={row.patches} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Per-IP patch table for a single node type (controlplanes or workers).
function PerIpPatchTable({
  ips,
  nodes,
  onChange,
}: {
  ips: string[];
  nodes: Record<string, PatchFile[]>;
  onChange: (nodes: Record<string, PatchFile[]>) => void;
}) {
  const { t } = useTranslation();

  if (ips.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ p: 1.5 }} variant="body2">
        {t('common.no')}
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '35%' }}>{t('clustersPage.columns.ip')}</TableCell>
            <TableCell>{t('clusterConfigDialog.patchesSection')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ips.map(ip => (
            <TableRow key={ip}>
              <TableCell>{ip}</TableCell>
              <TableCell>
                <PatchChips
                  onChange={next => onChange({ ...nodes, [ip]: next })}
                  patches={nodes[ip] || []}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Collapsible node-type section inside "Optional Node patching". Collapsed by default.
function CollapsibleNodePatches({
  title,
  accentColor,
  ips,
  nodes,
  onChange,
}: {
  title: string;
  accentColor: string;
  ips: string[];
  nodes: Record<string, PatchFile[]>;
  onChange: (nodes: Record<string, PatchFile[]>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <Stack
        alignItems="center"
        direction="row"
        onClick={() => setOpen(prev => !prev)}
        spacing={1}
        sx={{ cursor: 'pointer', py: 0.5, userSelect: 'none' }}
      >
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            transform: open ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          ▸
        </Box>
        <Typography variant="subtitle1">{title}</Typography>
        <Chip
          label={ips.length}
          size="small"
          sx={{ backgroundColor: accentColor, color: '#fff', fontWeight: 600 }}
        />
      </Stack>
      <Collapse in={open} unmountOnExit>
        <Box pb={1} pt={0.5}>
          <PerIpPatchTable ips={ips} nodes={nodes} onChange={onChange} />
        </Box>
      </Collapse>
    </Box>
  );
}

interface ExtensionTableProps {
  extensions: FactoryExtension[];
  selected: string[];
  accentColor: string;
  onChange: (selected: string[]) => void;
}

function ExtensionTable({ extensions, selected, accentColor, onChange }: ExtensionTableProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [showSelectedFirst, setShowSelectedFirst] = useState(false);

  const filtered = useMemo(() => {
    let result = [...extensions];
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        e =>
          e.name.toLowerCase().includes(lower) ||
          (e.description || '').toLowerCase().includes(lower)
      );
    }
    if (showSelectedFirst) {
      result = [
        ...result.filter(e => selected.includes(e.name)),
        ...result.filter(e => !selected.includes(e.name)),
      ];
    }
    return result;
  }, [extensions, search, showSelectedFirst, selected]);

  const toggleExtension = (name: string) => {
    onChange(
      selected.includes(name) ? selected.filter(n => n !== name) : [...selected, name]
    );
  };

  return (
    <Box>
      <Stack alignItems="center" direction="row" mb={1} spacing={1}>
        <Typography variant="subtitle2">{t('clusterConfigDialog.systemExtensions')}</Typography>
        {selected.length > 0 && (
          <Chip
            label={selected.length}
            size="small"
            sx={{ backgroundColor: accentColor, color: '#fff', fontWeight: 600 }}
          />
        )}
        <Box flex={1} />
        <FormControlLabel
          control={
            <Checkbox
              checked={showSelectedFirst}
              onChange={e => setShowSelectedFirst(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="caption">{t('clusterConfigDialog.showSelectedFirst')}</Typography>
          }
        />
        <TextField
          InputProps={{ sx: { height: 32 } }}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('clusterConfigDialog.search')}
          size="small"
          sx={{ width: 180 }}
          value={search}
        />
        {selected.length > 0 && (
          <Button onClick={() => onChange([])} size="small" variant="text">
            {t('clusterConfigDialog.clearSelection')}
          </Button>
        )}
      </Stack>
      <TableContainer component={Paper} sx={{ borderRadius: 2, maxHeight: 280 }} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>{t('clusterConfigDialog.extensionName')}</TableCell>
              <TableCell sx={{ width: 110 }}>{t('clusterConfigDialog.extensionVersion')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(ext => {
              const isSelected = selected.includes(ext.name);
              return (
                <TableRow
                  hover
                  key={ext.name}
                  onClick={() => toggleExtension(ext.name)}
                  selected={isSelected}
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected, &.Mui-selected:hover': {
                      backgroundColor: `${accentColor}26`,
                    },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleExtension(ext.name)}
                      onClick={e => e.stopPropagation()}
                      size="small"
                      sx={{ '&.Mui-checked': { color: accentColor } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{ext.name}</Typography>
                    {ext.description && (
                      <Typography color="text.secondary" variant="caption">
                        {ext.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={extractVersion(ext.ref)} size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography align="center" color="text.secondary" variant="body2">
                    {t('clusterConfigDialog.noExtensionsFound')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

const ARCH_OPTIONS: Array<{ value: 'amd64' | 'arm64'; label: string }> = [
  { value: 'amd64', label: 'amd64' },
  { value: 'arm64', label: 'arm64' },
];

const CNI_OPTIONS = ['flannel', 'custom', 'none'];

const DEFAULT_CONFIG_NAME = 'default';

const PRERELEASE_RANK: Record<string, number> = { alpha: 0, beta: 1, rc: 2 };

function compareVersionsDesc(a: string, b: string): number {
  const parse = (v: string) => {
    const [core, pre] = v.replace(/^v/, '').split('-');
    return {
      core: core.split('.').map(n => parseInt(n, 10) || 0),
      pre: pre || '',
    };
  };
  const pa = parse(a);
  const pb = parse(b);

  const len = Math.max(pa.core.length, pb.core.length);
  for (let i = 0; i < len; i++) {
    const diff = (pb.core[i] || 0) - (pa.core[i] || 0);
    if (diff !== 0) return diff;
  }

  if (!pa.pre && pb.pre) return -1;
  if (pa.pre && !pb.pre) return 1;
  if (!pa.pre && !pb.pre) return 0;

  const stageA = PRERELEASE_RANK[pa.pre.split('.')[0].toLowerCase()] ?? 3;
  const stageB = PRERELEASE_RANK[pb.pre.split('.')[0].toLowerCase()] ?? 3;
  if (stageA !== stageB) return stageB - stageA;

  const numA = parseInt(pa.pre.split('.')[1] || '0', 10);
  const numB = parseInt(pb.pre.split('.')[1] || '0', 10);
  return numB - numA;
}

export default function ClusterConfigDialog({
  open,
  clusterName,
  controlplaneIps,
  workerIps,
  onClose,
  onSubmit,
}: ClusterConfigDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const accentColor = theme.palette.mode === 'dark' ? ACCENT_DARK : ACCENT_LIGHT;

  // 'manual' = full config form, 'installer' = paste image URL
  const [setupType, setSetupType] = useState<'manual' | 'installer'>('manual');

  // installer URL mode
  const [installerImageUrl, setInstallerImageUrl] = useState('');

  // config name + saved configs
  const [configName, setConfigName] = useState(DEFAULT_CONFIG_NAME);
  const [activeConfigName, setActiveConfigName] = useState(DEFAULT_CONFIG_NAME);
  const [savedConfigs, setSavedConfigs] = useState<string[]>([]);
  const [configSaveError, setConfigSaveError] = useState<string | null>(null);

  // manual mode: image params
  const [version, setVersion] = useState('');
  const [arch, setArch] = useState<'amd64' | 'arm64'>('amd64');
  const [secureBoot, setSecureBoot] = useState(false);
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [kernelArgsText, setKernelArgsText] = useState('');

  // CNI (shared between both setup types)
  const [cniName, setCniName] = useState('flannel');

  // Kubernetes version (shared between both setup types)
  const [kubernetesVersion, setKubernetesVersion] = useState('');
  const [kubeVersions, setKubeVersions] = useState<string[]>([]);
  // Server-recommended version (newest compatible with the running Talos).
  const [recommendedKubeVersion, setRecommendedKubeVersion] = useState('');
  const [kubeVersionsLoading, setKubeVersionsLoading] = useState(false);
  const [kubeVersionsError, setKubeVersionsError] = useState<string | null>(null);

  const emptyNodeTypePatches = useCallback(
    (): NodeTypePatches => ({ general: [], nodes: {} }),
    []
  );

  // Patches: group-level (common / controlplane / worker) + per-IP (nodes).
  const [commonPatches, setCommonPatches] = useState<PatchFile[]>([]);
  const [cpPatches, setCpPatches] = useState<NodeTypePatches>(emptyNodeTypePatches);
  const [workerPatches, setWorkerPatches] = useState<NodeTypePatches>(emptyNodeTypePatches);

  // factory data
  const [versions, setVersions] = useState<string[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);

  const [extensions, setExtensions] = useState<FactoryExtension[]>([]);
  const [extensionsLoading, setExtensionsLoading] = useState(false);
  const [extensionsError, setExtensionsError] = useState<string | null>(null);

  // Load versions when switching to manual
  useEffect(() => {
    if (!open || setupType !== 'manual') return;
    setVersionsLoading(true);
    setVersionsError(null);
    apiClient.get<string[]>('/factory/versions')
      .then(response => {
        const sorted = [...response].sort(compareVersionsDesc);
        setVersions(sorted);
        if (sorted.length > 0 && !version) setVersion(sorted[0]);
      })
      .catch(err => setVersionsError(err.message || 'Failed to load versions'))
      .finally(() => setVersionsLoading(false));
  }, [open, setupType]);

  // Load extensions when version changes
  useEffect(() => {
    if (!open || setupType !== 'manual' || !version) return;
    setExtensionsLoading(true);
    setExtensionsError(null);
    apiClient.get<FactoryExtension[]>(`/factory/extensions/${encodeURIComponent(version)}`)
      .then(response => setExtensions(response))
      .catch(err => setExtensionsError(err.message || 'Failed to load extensions'))
      .finally(() => setExtensionsLoading(false));
  }, [open, setupType, version]);

  // Load Kubernetes versions (shared between both setup types)
  useEffect(() => {
    if (!open) return;
    setKubeVersionsLoading(true);
    setKubeVersionsError(null);
    apiClient.get<{ versions: string[]; recommended: string | null }>('/kubernetes/versions')
      .then(response => {
        const data = response;
        const sorted = [...(data.versions ?? [])].sort(compareVersionsDesc);
        setKubeVersions(sorted);
        const preferred =
          data.recommended && sorted.includes(data.recommended) ? data.recommended : sorted[0];
        setRecommendedKubeVersion(preferred ?? '');
        if (preferred && !kubernetesVersion) setKubernetesVersion(preferred);
      })
      .catch(err => setKubeVersionsError(err.message || 'Failed to load k8s versions'))
      .finally(() => setKubeVersionsLoading(false));
  }, [open]);

  // Load saved config names
  useEffect(() => {
    if (!open) return;
    apiClient.get<string[]>('/configs')
      .then(response => {
        // Гарантируем, что в стейт попадёт именно массив
        const data = response;
        setSavedConfigs(Array.isArray(data) ? data : []);
      })
      .catch(() => setSavedConfigs([]));
  }, [open])

  // Reset every config field to its default value
  const resetConfigFields = () => {
    setVersion(versions[0] ?? '');
    setArch('amd64');
    setSecureBoot(false);
    setSelectedExtensions([]);
    setKernelArgsText('');
    setCniName('flannel');
    setKubernetesVersion(recommendedKubeVersion || kubeVersions[0] || '');
    setCommonPatches([]);
    setCpPatches({ general: [], nodes: {} });
    setWorkerPatches({ general: [], nodes: {} });
  };

  const handleLoadConfig = async (name: string) => {
    if (!name) return;
    setConfigName(name);
    setActiveConfigName(name);
    try {
      const response = await apiClient.get<any>(`/configs/${encodeURIComponent(name)}`);
      const data = response;

      // Missing config (e.g. `default` before it is saved) — reset to defaults
      if (!data || typeof data !== 'object') {
        resetConfigFields();
        return;
      }

      // Start from defaults, then overlay whatever the saved config provides
      setVersion(data.version || versions[0] || '');
      setArch(data.arch || 'amd64');
      setSecureBoot(typeof data.secureBoot === 'boolean' ? data.secureBoot : false);
      setSelectedExtensions(Array.isArray(data.extensions) ? data.extensions : []);
      setKernelArgsText(Array.isArray(data.kernelArgs) ? data.kernelArgs.join('\n') : '');
      setCniName(data.cni || 'flannel');
      setKubernetesVersion(data.kubernetesVersion || recommendedKubeVersion || kubeVersions[0] || '');
      setCommonPatches(Array.isArray(data.patches?.common) ? data.patches.common : []);
      setCpPatches({
        general: Array.isArray(data.patches?.controlplane) ? data.patches.controlplane : [],
        nodes: {},
      });
      setWorkerPatches({
        general: Array.isArray(data.patches?.worker) ? data.patches.worker : [],
        nodes: {},
      });
    } catch {
      resetConfigFields();
    }
  };

  const handleDeleteConfig = async () => {
    const name = configName.trim();
    if (!name) return;
    setConfigSaveError(null);
    try {
      await apiClient.delete(`/configs/${encodeURIComponent(name)}`);
      const configs = await apiClient.get<string[]>('/configs');
      setSavedConfigs(Array.isArray(configs) ? configs : []);
    } catch (err: any) {
      setConfigSaveError(err.response?.data?.error || err.message || 'Unknown error');
    }
  };

  const handleSaveConfig = async () => {
    const name = configName.trim();
    if (!name) return;
    setConfigSaveError(null);
    const kernelArgs = kernelArgsText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const configData = {
      version,
      arch,
      secureBoot,
      extensions: selectedExtensions,
      kernelArgs,
      cni: cniName,
      kubernetesVersion,
      patches: {
        common: commonPatches,
        controlplane: cpPatches.general,
        worker: workerPatches.general,
      },
    };

    try {
      await apiClient.post(`/configs/${encodeURIComponent(name)}`, configData);
      const configs = await apiClient.get<string[]>('/configs');
      setSavedConfigs(Array.isArray(configs) ? configs : []);
    } catch (err: any) {
      setConfigSaveError(err.response?.data?.error || err.message || 'Unknown error');
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInstallerImageUrl(text);
    } catch {
      // clipboard access denied — ignore
    }
  };

  const handleSubmit = () => {
    let imageConfig: ImageConfig | null;

    if (setupType === 'installer') {
      imageConfig = installerImageUrl.trim()
        ? { installerImageUrl: installerImageUrl.trim(), cni: cniName, kubernetesVersion }
        : null;
    } else {
      const kernelArgs = kernelArgsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
      imageConfig = {
        version,
        arch,
        secureBoot,
        extensions: selectedExtensions,
        kernelArgs,
        cni: cniName,
        kubernetesVersion,
      };
    }

    const patches: ClusterPatches = {
      common: commonPatches,
      controlplane: cpPatches,
      worker: workerPatches,
    };
    onSubmit(imageConfig, patches);
  };

  const submitDisabled = setupType === 'installer' ? !installerImageUrl.trim() : !version;

  const configOptions = useMemo(
    () => Array.from(new Set([DEFAULT_CONFIG_NAME, ...savedConfigs])),
    [savedConfigs]
  );

  const patchGroupRows: PatchGroupRow[] = [
    {
      key: 'common',
      label: t('clusterConfigDialog.commonGroup'),
      patches: commonPatches,
      onChange: setCommonPatches,
    },
    {
      key: 'controlplane',
      label: t('clusterConfigDialog.controlplanes'),
      patches: cpPatches.general,
      onChange: next => setCpPatches(prev => ({ ...prev, general: next })),
    },
    {
      key: 'worker',
      label: t('clusterConfigDialog.workers'),
      patches: workerPatches.general,
      onChange: next => setWorkerPatches(prev => ({ ...prev, general: next })),
    },
  ];

  return (
    <Dialog fullWidth maxWidth="lg" onClose={onClose} open={open} scroll="paper">
      <DialogTitle>
        <Typography component="div" variant="h6">
          <Box component="span" sx={{ color: accentColor, fontWeight: 700 }}>
            {clusterName}
          </Box>{' '}
          {t('clusterConfigDialog.configurationSuffix')}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Config name — free input or select existing */}
          <Box>
            <Stack direction="row" mb={1} spacing={1}>
              <Autocomplete
                filterOptions={(options, { inputValue }) => {
                  if (inputValue === activeConfigName) return options;
                  const query = inputValue.trim().toLowerCase();
                  return options.filter(option => option.toLowerCase().includes(query));
                }}
                freeSolo
                fullWidth
                inputValue={configName}
                onChange={(_e, value) => {
                  if (value && typeof value === 'string') {
                    setConfigName(value);
                    setConfigSaveError(null);
                    handleLoadConfig(value);
                  }
                }}
                onInputChange={(_e, value) => {
                  setConfigName(value);
                  setConfigSaveError(null);
                }}
                options={configOptions}
                renderInput={params => (
                  <TextField
                    {...params}
                    label={t('clusterConfigDialog.configName')}
                    size="small"
                    variant="outlined"
                  />
                )}
              />
              <Button
                disabled={!configName.trim()}
                onClick={handleSaveConfig}
                size="small"
                variant="outlined"
              >
                {t('clusterConfigDialog.saveConfig')}
              </Button>
              <Button
                color="error"
                disabled={!savedConfigs.includes(configName.trim())}
                onClick={handleDeleteConfig}
                size="small"
                variant="outlined"
              >
                {t('clusterConfigDialog.deleteConfig')}
              </Button>
            </Stack>
            {configSaveError && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {configSaveError}
              </Alert>
            )}
          </Box>

          {/* Setup type */}
          <Box>
            <Typography gutterBottom variant="body2">
              {t('clusterConfigDialog.setupType')}
            </Typography>
            <RadioGroup
              onChange={e => setSetupType(e.target.value as 'manual' | 'installer')}
              row
              value={setupType}
            >
              <FormControlLabel
                control={<Radio size="small" />}
                label={t('clusterConfigDialog.manualSetup')}
                value="manual"
              />
              <FormControlLabel
                control={<Radio size="small" />}
                label={t('clusterConfigDialog.installerSetup')}
                value="installer"
              />
            </RadioGroup>
          </Box>

          {/* Setup from installer image — paste URL */}
          {setupType === 'installer' && (
            <TextField
              fullWidth
              helperText={t('clusterConfigDialog.installerImageUrlHelper')}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      onClick={handlePasteFromClipboard}
                      size="small"
                      sx={{ display: { xs: 'none', sm: 'flex' } }}
                      variant="outlined"
                    >
                      {t('clusterConfigDialog.pasteFromClipboard')}
                    </Button>
                  </InputAdornment>
                ),
              }}
              label={t('clusterConfigDialog.installerImageUrl')}
              onChange={e => setInstallerImageUrl(e.target.value)}
              value={installerImageUrl}
            />
          )}

          {/* Manual setup — image params */}
          {setupType === 'manual' && (
            <>
              {/* Version + Arch on same row */}
              <Stack direction={{ sm: 'row', xs: 'column' }} spacing={2}>
                <FormControl fullWidth size="small" variant="outlined">
                  <InputLabel id="version-label">{t('clusterConfigDialog.version')}</InputLabel>
                  <Select
                    disabled={versionsLoading}
                    label={t('clusterConfigDialog.version')}
                    labelId="version-label"
                    onChange={(e: SelectChangeEvent) => setVersion(e.target.value)}
                    value={version}
                  >
                    {versionsLoading && (
                      <MenuItem disabled value="">
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        {t('clusterConfigDialog.loadingVersions')}
                      </MenuItem>
                    )}
                    {versions.map(v => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                  {versionsError && (
                    <Alert severity="error" sx={{ mt: 0.5 }}>
                      {versionsError}
                    </Alert>
                  )}
                </FormControl>

                <FormControl fullWidth size="small" variant="outlined">
                  <InputLabel id="arch-label">{t('clusterConfigDialog.architecture')}</InputLabel>
                  <Select
                    label={t('clusterConfigDialog.architecture')}
                    labelId="arch-label"
                    onChange={(e: SelectChangeEvent) => setArch(e.target.value as 'amd64' | 'arm64')}
                    value={arch}
                  >
                    {ARCH_OPTIONS.map(o => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              {/* SecureBoot */}
              <FormControlLabel
                control={
                  <Switch
                    checked={secureBoot}
                    onChange={e => setSecureBoot(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: accentColor },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: accentColor,
                      },
                    }}
                  />
                }
                label={t('clusterConfigDialog.secureBoot')}
              />

              {/* Extensions */}
              {extensionsLoading ? (
                <Stack alignItems="center" direction="row" spacing={1}>
                  <CircularProgress size={16} />
                  <Typography variant="body2">
                    {t('clusterConfigDialog.loadingExtensions')}
                  </Typography>
                </Stack>
              ) : extensionsError ? (
                <Alert severity="error">{extensionsError}</Alert>
              ) : (
                <ExtensionTable
                  accentColor={accentColor}
                  extensions={extensions}
                  onChange={setSelectedExtensions}
                  selected={selectedExtensions}
                />
              )}
            </>
          )}

          {/* Kubernetes version + CNI — shared between both setup types */}
          <Box>
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={2}>
              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel id="kube-version-label">
                  {t('clusterConfigDialog.kubernetesVersion')}
                </InputLabel>
                <Select
                  disabled={kubeVersionsLoading}
                  label={t('clusterConfigDialog.kubernetesVersion')}
                  labelId="kube-version-label"
                  onChange={(e: SelectChangeEvent) => setKubernetesVersion(e.target.value)}
                  value={kubernetesVersion}
                >
                  {kubeVersionsLoading && (
                    <MenuItem disabled value="">
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      {t('clusterConfigDialog.loadingVersions')}
                    </MenuItem>
                  )}
                  {kubeVersions.map(v => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" variant="outlined">
                <InputLabel id="cni-name-label">{t('clusterConfigDialog.cni')}</InputLabel>
                <Select
                  label={t('clusterConfigDialog.cni')}
                  labelId="cni-name-label"
                  onChange={(e: SelectChangeEvent) => setCniName(e.target.value)}
                  value={cniName}
                >
                  {CNI_OPTIONS.map(c => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            {kubeVersionsError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {kubeVersionsError}
              </Alert>
            )}
            {cniName === 'custom' && (
              <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
                {t('clusterConfigDialog.cniCustomHelper')}
              </Typography>
            )}
          </Box>

          {/* Kernel args — manual setup only */}
          {setupType === 'manual' && (
            <TextField
              fullWidth
              helperText={t('clusterConfigDialog.kernelArgsHelper')}
              label={t('clusterConfigDialog.kernelArgs')}
              minRows={3}
              multiline
              onChange={e => setKernelArgsText(e.target.value)}
              value={kernelArgsText}
              variant="outlined"
            />
          )}

          {/* Patches — group-level, shared between both setup types */}
          <Box>
            <Typography gutterBottom variant="h6">
              {t('clusterConfigDialog.patchesSection')}
            </Typography>
            <PatchGroupTable rows={patchGroupRows} />
          </Box>

          {/* Optional Node patching — per-IP, collapsed by default */}
          <Box>
            <Typography variant="h6">{t('clusterConfigDialog.optionalNodePatching')}</Typography>
            <Alert severity="warning" sx={{ my: 1 }}>
              {t('clusterConfigDialog.optionalNodePatchingHelper')}
            </Alert>
            <CollapsibleNodePatches
              accentColor={accentColor}
              ips={controlplaneIps}
              nodes={cpPatches.nodes}
              onChange={nodes => setCpPatches(prev => ({ ...prev, nodes }))}
              title={t('clusterConfigDialog.controlplanes')}
            />
            <CollapsibleNodePatches
              accentColor={accentColor}
              ips={workerIps}
              nodes={workerPatches.nodes}
              onChange={nodes => setWorkerPatches(prev => ({ ...prev, nodes }))}
              title={t('clusterConfigDialog.workers')}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          {t('clusterConfigDialog.cancel')}
        </Button>
        <Button
          disabled={submitDisabled}
          onClick={handleSubmit}
          sx={{
            backgroundColor: accentColor,
            '&:hover': { backgroundColor: accentColor, filter: 'brightness(0.92)' },
          }}
          variant="contained"
        >
          {t('clusterConfigDialog.applyChanges')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
