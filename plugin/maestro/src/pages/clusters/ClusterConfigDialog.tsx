import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Alert,
  Autocomplete,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
} from '@mui/material';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildServerUrl } from '../../config/server';

export interface PatchFile {
  name: string;
  content: string; // base64
}

export interface NodeTypePatches {
  general: PatchFile[];
  nodes: Record<string, PatchFile[]>;
}

export interface ClusterPatches {
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
}

export interface ClusterConfigDialogProps {
  open: boolean;
  clusterName: string;
  controlplaneIps: string[];
  workerIps: string[];
  showClusterNameInput?: boolean;
  existingClusterNames?: Set<string>;
  onClose: () => void;
  onSubmit: (imageConfig: ImageConfig | null, patches: ClusterPatches, clusterName?: string) => void;
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

interface PatchTableProps {
  ips: string[];
  patches: NodeTypePatches;
  onChange: (patches: NodeTypePatches) => void;
}

function PatchTable({ ips, patches, onChange }: PatchTableProps) {
  const { t } = useTranslation();

  const handleAddToGeneral = (patch: PatchFile) => {
    onChange({ ...patches, general: [...patches.general, patch] });
  };

  const handleRemoveFromGeneral = (index: number) => {
    onChange({ ...patches, general: patches.general.filter((_, i) => i !== index) });
  };

  const handleRemoveAllGeneral = () => {
    onChange({ ...patches, general: [] });
  };

  const handleAddToNode = (ip: string, patch: PatchFile) => {
    onChange({
      ...patches,
      nodes: { ...patches.nodes, [ip]: [...(patches.nodes[ip] || []), patch] },
    });
  };

  const handleRemoveFromNode = (ip: string, index: number) => {
    onChange({
      ...patches,
      nodes: {
        ...patches.nodes,
        [ip]: (patches.nodes[ip] || []).filter((_, i) => i !== index),
      },
    });
  };

  const rows = [
    { key: 'general', label: t('clusterConfigDialog.general') },
    ...ips.map(ip => ({ key: ip, label: ip })),
  ];

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: '35%' }}>{t('clustersPage.columns.ip')}</TableCell>
            <TableCell>
              <Box alignItems="center" display="flex" justifyContent="space-between">
                <span>{t('clusterConfigDialog.patch')}</span>
                {patches.general.length > 0 && (
                  <Button
                    color="error"
                    onClick={handleRemoveAllGeneral}
                    size="small"
                    variant="outlined"
                  >
                    {t('clusterConfigDialog.removeGeneralPatch')}
                  </Button>
                )}
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(row => {
            const rowPatches = row.key === 'general' ? patches.general : (patches.nodes[row.key] || []);
            const isGeneral = row.key === 'general';
            return (
              <TableRow key={row.key}>
                <TableCell>{row.label}</TableCell>
                <TableCell>
                  <Box alignItems="center" display="flex" flexWrap="wrap" gap={0.5}>
                    {rowPatches.map((patch, i) => (
                      <Chip
                        key={`${patch.name}-${i}`}
                        label={patch.name}
                        onDelete={() =>
                          isGeneral
                            ? handleRemoveFromGeneral(i)
                            : handleRemoveFromNode(row.key, i)
                        }
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    <PatchUploadButton
                      label="+"
                      onUpload={patch =>
                        isGeneral ? handleAddToGeneral(patch) : handleAddToNode(row.key, patch)
                      }
                    />
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface ExtensionTableProps {
  extensions: FactoryExtension[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function ExtensionTable({ extensions, selected, onChange }: ExtensionTableProps) {
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
          <Chip color="primary" label={selected.length} size="small" />
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
            {filtered.map(ext => (
              <TableRow
                hover
                key={ext.name}
                onClick={() => toggleExtension(ext.name)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(ext.name)}
                    onChange={() => toggleExtension(ext.name)}
                    onClick={e => e.stopPropagation()}
                    size="small"
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
            ))}
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

function validateClusterName(value: string, existingNames?: Set<string>): string | null {
  const name = value.trim();
  if (!name) return 'required';
  if (existingNames?.has(name.toLowerCase())) return 'duplicate';
  return null;
}

export default function ClusterConfigDialog({
  open,
  clusterName,
  controlplaneIps,
  workerIps,
  showClusterNameInput = false,
  existingClusterNames,
  onClose,
  onSubmit,
}: ClusterConfigDialogProps) {
  const { t } = useTranslation();

  // cluster name (only when showClusterNameInput)
  const [clusterNameValue, setClusterNameValue] = useState('');
  const [clusterNameError, setClusterNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open && showClusterNameInput) {
      setClusterNameValue('');
      setClusterNameError(null);
    }
  }, [open, showClusterNameInput]);

  // 'manual' = full config form, 'installer' = paste image URL
  const [setupType, setSetupType] = useState<'manual' | 'installer'>('manual');

  // installer URL mode
  const [installerImageUrl, setInstallerImageUrl] = useState('');

  // manual mode: config name + saved configs
  const [configName, setConfigName] = useState('New conf');
  const [savedConfigs, setSavedConfigs] = useState<string[]>([]);
  const [configSaveError, setConfigSaveError] = useState<string | null>(null);

  // manual mode: image params
  const [version, setVersion] = useState('');
  const [arch, setArch] = useState<'amd64' | 'arm64'>('amd64');
  const [secureBoot, setSecureBoot] = useState(false);
  const [selectedExtensions, setSelectedExtensions] = useState<string[]>([]);
  const [kernelArgsText, setKernelArgsText] = useState('');

  // CNI
  const [cniName, setCniName] = useState('flannel');

  const emptyNodeTypePatches = useCallback(
    (): NodeTypePatches => ({ general: [], nodes: {} }),
    []
  );

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
    fetch(buildServerUrl('/factory/versions'))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: string[]) => {
        setVersions(data);
        if (data.length > 0 && !version) setVersion(data[0]);
      })
      .catch(err => setVersionsError(err.message))
      .finally(() => setVersionsLoading(false));
  }, [open, setupType]);

  // Load extensions when version changes
  useEffect(() => {
    if (!open || setupType !== 'manual' || !version) return;
    setExtensionsLoading(true);
    setExtensionsError(null);
    fetch(buildServerUrl(`/factory/extensions/${encodeURIComponent(version)}`))
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: FactoryExtension[]) => setExtensions(data))
      .catch(err => setExtensionsError(err.message))
      .finally(() => setExtensionsLoading(false));
  }, [open, setupType, version]);


  // Load saved config names
  useEffect(() => {
    if (!open || setupType !== 'manual') return;
    fetch(buildServerUrl('/configs'))
      .then(r => r.json())
      .then((data: string[]) => setSavedConfigs(data))
      .catch(() => setSavedConfigs([]));
  }, [open, setupType]);

  const handleLoadConfig = (name: string) => {
    if (!name) return;
    fetch(buildServerUrl(`/configs/${encodeURIComponent(name)}`))
      .then(r => r.json())
      .then(data => {
        setConfigName(name);
        if (data.version) setVersion(data.version);
        if (data.arch) setArch(data.arch);
        if (typeof data.secureBoot === 'boolean') setSecureBoot(data.secureBoot);
        if (Array.isArray(data.extensions)) setSelectedExtensions(data.extensions);
        if (Array.isArray(data.kernelArgs)) setKernelArgsText(data.kernelArgs.join('\n'));
        if (data.cni) setCniName(data.cni);
        if (Array.isArray(data.patches?.controlplane)) setCpPatches({ general: data.patches.controlplane, nodes: {} });
        if (Array.isArray(data.patches?.worker)) setWorkerPatches({ general: data.patches.worker, nodes: {} });
      })
      .catch(() => {});
  };

  const handleDeleteConfig = async () => {
    const name = configName.trim();
    if (!name) return;
    setConfigSaveError(null);
    try {
      const resp = await fetch(buildServerUrl(`/configs/${encodeURIComponent(name)}`), {
        method: 'DELETE',
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setConfigSaveError(err.error || `HTTP ${resp.status}`);
        return;
      }
      const updated: string[] = await fetch(buildServerUrl('/configs')).then(r => r.json());
      setSavedConfigs(updated);
    } catch (err: unknown) {
      setConfigSaveError(err instanceof Error ? err.message : 'Unknown error');
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
      patches: {
        controlplane: cpPatches.general,
        worker: workerPatches.general,
      },
    };
    try {
      const resp = await fetch(buildServerUrl(`/configs/${encodeURIComponent(name)}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setConfigSaveError(err.error || `HTTP ${resp.status}`);
        return;
      }
      const updated: string[] = await fetch(buildServerUrl('/configs')).then(r => r.json());
      setSavedConfigs(updated);
    } catch (err: unknown) {
      setConfigSaveError(err instanceof Error ? err.message : 'Unknown error');
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
    let imageConfig: ImageConfig | null = null;

    if (setupType === 'installer') {
      if (installerImageUrl.trim()) {
        imageConfig = { installerImageUrl: installerImageUrl.trim() };
      }
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
      };
    }

    const patches: ClusterPatches = { controlplane: cpPatches, worker: workerPatches };
    onSubmit(imageConfig, patches, showClusterNameInput ? clusterNameValue.trim() : undefined);
  };

  const clusterNameInvalid = showClusterNameInput && Boolean(validateClusterName(clusterNameValue, existingClusterNames));
  const submitDisabled =
    clusterNameInvalid ||
    (setupType === 'installer' ? !installerImageUrl.trim() : !version);

  return (
    <Dialog fullWidth maxWidth="lg" onClose={onClose} open={open} scroll="paper">
      <DialogTitle>
        <Stack alignItems="center" direction="row" spacing={1}>
          <Box flex={1}>
            <Typography variant="subtitle1">
              {t('clusterConfigDialog.title')}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {clusterName}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>

          {/* ── Common ── */}
          <Box>
            <Typography gutterBottom variant="h5">
              {t('clusterConfigDialog.sectionCommon')}
            </Typography>

            {showClusterNameInput && (
              <Box mb={2.5}>
                <TextField
                  error={Boolean(clusterNameError)}
                  fullWidth
                  helperText={
                    clusterNameError === 'duplicate'
                      ? t('clustersPage.alertNameDuplicate')
                      : clusterNameError === 'required'
                      ? t('clustersPage.alertNameRequired')
                      : t('clustersPage.clusterNameHelper')
                  }
                  label={t('clustersPage.clusterNameLabel')}
                  onBlur={() => setClusterNameError(validateClusterName(clusterNameValue, existingClusterNames))}
                  onChange={e => {
                    setClusterNameValue(e.target.value);
                    if (clusterNameError) setClusterNameError(validateClusterName(e.target.value, existingClusterNames));
                  }}
                  value={clusterNameValue}
                  variant="outlined"
                />
              </Box>
            )}

            <Stack mb={2} spacing={1}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Typography variant="h6">{t('clusterConfigDialog.controlplanes')}</Typography>
                <Badge
                  badgeContent={controlplaneIps.length}
                  color="primary"
                  sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }}
                />
              </Stack>
              <PatchTable ips={controlplaneIps} onChange={setCpPatches} patches={cpPatches} />
            </Stack>

            <Stack spacing={1}>
              <Stack alignItems="center" direction="row" spacing={1}>
                <Typography variant="h6">{t('clusterConfigDialog.workers')}</Typography>
                <Badge
                  badgeContent={workerIps.length}
                  color="primary"
                  sx={{ '& .MuiBadge-badge': { position: 'static', transform: 'none' } }}
                />
              </Stack>
              <PatchTable ips={workerIps} onChange={setWorkerPatches} patches={workerPatches} />
            </Stack>
          </Box>

          <Divider />

          {/* ── Config ── */}
          <Box>
            <Typography gutterBottom variant="h5">
              {t('clusterConfigDialog.sectionConfig')}
            </Typography>
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

            {/* Setup from installer image — paste URL */}
            {setupType === 'installer' && (
              <Box mt={2}>
                <TextField
                  fullWidth
                  helperText={t('clusterConfigDialog.installerImageUrlHelper')}
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button onClick={handlePasteFromClipboard} size="small" sx={{ display: { xs: 'none', sm: 'flex' } }} variant="outlined">
                          {t('clusterConfigDialog.pasteFromClipboard')}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                  label={t('clusterConfigDialog.installerImageUrl')}
                  onChange={e => setInstallerImageUrl(e.target.value)}
                  value={installerImageUrl}
                />
              </Box>
            )}

            {/* Manual setup — full config form */}
            {setupType === 'manual' && (
              <Stack mt={2} spacing={2.5}>

                {/* Config name — free input or select existing */}
                <Box>
                  <Stack direction="row" mb={1} spacing={1}>
                    <Autocomplete
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
                      options={savedConfigs}
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
                      onChange={(e: SelectChangeEvent) =>
                        setArch(e.target.value as 'amd64' | 'arm64')
                      }
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
                    extensions={extensions}
                    onChange={setSelectedExtensions}
                    selected={selectedExtensions}
                  />
                )}

                {/* CNI */}
                <Box>
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
                  {cniName === 'custom' && (
                    <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
                      {t('clusterConfigDialog.cniCustomHelper')}
                    </Typography>
                  )}
                </Box>

                {/* Kernel args */}
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
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          {t('clusterConfigDialog.cancel')}
        </Button>
        <Button disabled={submitDisabled} onClick={handleSubmit} variant="contained">
          {t('clusterConfigDialog.applyChanges')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
