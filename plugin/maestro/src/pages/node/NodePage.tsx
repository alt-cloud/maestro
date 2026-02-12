import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import React, { useMemo } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import PageHeader from '../shared/ui/PageHeader';
import SupportDownloadButton from './support/SupportDownloadButton';

interface CommandLink {
  label: string;
  path: string;
}

interface ActionCardProps {
  description: string;
  links: CommandLink[];
  title: string;
}

function ActionCard({ title, description, links }: ActionCardProps) {
  return (
    <Card sx={{ height: '100%' }} variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6">{title}</Typography>
          <Typography color="text.secondary" variant="body2">
            {description}
          </Typography>
          <List dense disablePadding>
            {links.map(link => (
              <ListItem disableGutters disablePadding key={link.path}>
                <ListItemButton component={RouterLink} to={link.path}>
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Stack>
      </CardContent>
    </Card>
  );
}

const NodePage: React.FC<{}> = () => {
  const location = useLocation();
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

  const cluster = queryParams.cluster;
  const node = queryParams.node;
  const nodeType = queryParams.type;
  const isControlPlane = nodeType === 'controlplane';

  const querySuffix = useMemo(() => {
    const params = new URLSearchParams();
    if (cluster) params.set('cluster', cluster);
    if (nodeType) params.set('type', nodeType);
    if (node) params.set('node', node);
    const query = params.toString();
    return query ? `?${query}` : '';
  }, [cluster, node, nodeType]);

  const buildPath = (path: string) => `${path}${querySuffix}`;

  const overviewLinks: CommandLink[] = [
    { label: 'Get resources', path: buildPath('/maestro/node/get') },
    { label: 'Services', path: buildPath('/maestro/node/service') },
    { label: 'Service logs', path: buildPath('/maestro/node/logs') },
    { label: 'Containers', path: buildPath('/maestro/node/containers') },
  ];

  const textCommandLinks: CommandLink[] = [
    { label: 'dmesg', path: buildPath('/maestro/node/dmesg') },
    { label: 'version', path: buildPath('/maestro/node/version') },
    { label: 'inspect dependencies', path: buildPath('/maestro/node/inspect/dependencies') },
  ];

  const tableCommandLinks: CommandLink[] = [
    { label: 'memory', path: buildPath('/maestro/node/memory') },
    { label: 'mounts', path: buildPath('/maestro/node/mounts') },
    { label: 'netstat', path: buildPath('/maestro/node/netstat') },
    { label: 'processes', path: buildPath('/maestro/node/processes') },
    { label: 'stats', path: buildPath('/maestro/node/stats') },
    { label: 'time', path: buildPath('/maestro/node/time') },
    { label: 'usage', path: buildPath('/maestro/node/usage') },
    { label: 'image default', path: buildPath('/maestro/node/image/default') },
    { label: 'image list', path: buildPath('/maestro/node/image/list') },
  ];

  if (isControlPlane) {
    tableCommandLinks.push(
      { label: 'etcd members', path: buildPath('/maestro/node/etcd/members') },
      { label: 'etcd status', path: buildPath('/maestro/node/etcd/status') }
    );
  }

  const plannedActions = [
    'dashboard',
    'health',
    'patch',
    'reboot',
    'reset',
    'shutdown',
    'upgrade',
  ];

  return (
    <SectionBox title="" textAlign="left" paddingTop={2}>
      <PageHeader
        breadcrumbs={[
          { label: 'Clusters', to: '/maestro' },
          { label: cluster || 'Cluster', to: `/maestro?cluster=${cluster || ''}` },
          { label: nodeType || 'Node type', to: `/maestro/?cluster=${cluster || ''}&type=${nodeType || ''}` },
          { label: node || 'Node' },
        ]}
        subtitle="Manage node actions and jump to Talos command views."
        title="Node operations"
      />

      <Grid container spacing={2}>
        <Grid item md={6} xs={12}>
          <ActionCard description="Primary entry points for this node." links={overviewLinks} title="Overview" />
        </Grid>
        <Grid item md={6} xs={12}>
          <ActionCard description="Streaming text outputs from Talos commands." links={textCommandLinks} title="Text commands" />
        </Grid>
        <Grid item md={6} xs={12}>
          <ActionCard description="Tabular command outputs with sorting and pagination." links={tableCommandLinks} title="Table commands" />
        </Grid>
        <Grid item md={6} xs={12}>
          <Card sx={{ height: '100%' }} variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">Support and roadmap</Typography>
                <SupportDownloadButton cluster={cluster} node={node} />
                <Typography color="text.secondary" variant="body2">
                  Planned actions:
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {plannedActions.map(action => (
                    <Chip key={action} label={action} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </SectionBox>
  );
};

export default NodePage;
