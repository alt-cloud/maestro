import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
  const { t } = useTranslation();
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
    { label: t('nodePage.links.getResources'), path: buildPath('/maestro/node/get') },
    { label: t('nodePage.links.services'), path: buildPath('/maestro/node/service') },
    { label: t('nodePage.links.containers'), path: buildPath('/maestro/node/containers') },
  ];

  const textCommandLinks: CommandLink[] = [
    { label: t('nodePage.links.dmesg'), path: buildPath('/maestro/node/dmesg') },
    { label: t('nodePage.links.version'), path: buildPath('/maestro/node/version') },
    { label: t('nodePage.links.inspectDependencies'), path: buildPath('/maestro/node/inspect/dependencies') },
  ];

  const tableCommandLinks: CommandLink[] = [
    { label: t('nodePage.links.memory'), path: buildPath('/maestro/node/memory') },
    { label: t('nodePage.links.mounts'), path: buildPath('/maestro/node/mounts') },
    { label: t('nodePage.links.netstat'), path: buildPath('/maestro/node/netstat') },
    { label: t('nodePage.links.processes'), path: buildPath('/maestro/node/processes') },
    { label: t('nodePage.links.stats'), path: buildPath('/maestro/node/stats') },
    { label: t('nodePage.links.time'), path: buildPath('/maestro/node/time') },
    { label: t('nodePage.links.usage'), path: buildPath('/maestro/node/usage') },
    { label: t('nodePage.links.imageDefault'), path: buildPath('/maestro/node/image/default') },
    { label: t('nodePage.links.imageList'), path: buildPath('/maestro/node/image/list') },
  ];

  if (isControlPlane) {
    tableCommandLinks.push(
      { label: t('nodePage.links.etcdMembers'), path: buildPath('/maestro/node/etcd/members') },
      { label: t('nodePage.links.etcdStatus'), path: buildPath('/maestro/node/etcd/status') }
    );
  }

  const plannedActions = [
    t('nodePage.roadmap.dashboard'),
    t('nodePage.roadmap.health'),
    t('nodePage.roadmap.patch'),
    t('nodePage.roadmap.reboot'),
    t('nodePage.roadmap.reset'),
    t('nodePage.roadmap.shutdown'),
    t('nodePage.roadmap.upgrade'),
  ];

  return (
    <SectionBox title="" textAlign="left" paddingTop={2}>
      <PageHeader
        breadcrumbs={[
          { label: t('common.clusters'), to: '/maestro' },
          { label: cluster || t('common.cluster'), to: `/maestro?cluster=${cluster || ''}` },
          { label: nodeType || t('common.nodeType'), to: `/maestro/?cluster=${cluster || ''}&type=${nodeType || ''}` },
          { label: node || t('common.node') },
        ]}
        subtitle={t('nodePage.subtitle')}
        title={t('nodePage.title')}
      />

      <Grid container spacing={2}>
        <Grid item md={6} xs={12}>
          <ActionCard
            description={t('nodePage.cards.overviewDescription')}
            links={overviewLinks}
            title={t('nodePage.cards.overviewTitle')}
          />
        </Grid>
        <Grid item md={6} xs={12}>
          <ActionCard
            description={t('nodePage.cards.textCommandsDescription')}
            links={textCommandLinks}
            title={t('nodePage.cards.textCommandsTitle')}
          />
        </Grid>
        <Grid item md={6} xs={12}>
          <ActionCard
            description={t('nodePage.cards.tableCommandsDescription')}
            links={tableCommandLinks}
            title={t('nodePage.cards.tableCommandsTitle')}
          />
        </Grid>
        <Grid item md={6} xs={12}>
          <Card sx={{ height: '100%' }} variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6">{t('nodePage.cards.supportTitle')}</Typography>
                <SupportDownloadButton cluster={cluster} node={node} />
                <Typography color="text.secondary" variant="body2">
                  {t('nodePage.plannedActions')}
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
