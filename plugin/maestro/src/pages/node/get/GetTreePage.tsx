import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import React, { useMemo } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import PageHeader from '../../shared/ui/PageHeader';
import resourceTree from './RDTree.json';

interface TreeCommand {
  command: string;
  id: string;
  name: string;
}

interface TreeCommandGroup {
  commands: TreeCommand[];
  name: string;
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

function GetTreePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

  const cluster = queryParams.cluster;
  const controlPlane = queryParams.controlplane;
  const node = queryParams.node;
  const nodeType = queryParams.type;
  const clusterPageLink = buildPathWithQuery('/maestro', { cluster });
  const nodeTypePageLink = buildPathWithQuery('/maestro', { cluster, type: nodeType });
  const nodePageLink = buildPathWithQuery('/maestro/node', { cluster, type: nodeType, node });

  const commandGroups = Object.entries(resourceTree as Record<string, TreeCommandGroup>);

  return (
    <SectionBox title="" textAlign="left" paddingTop={2}>
      <PageHeader
        breadcrumbs={[
          { label: t('common.clusters'), to: '/maestro' },
          { label: cluster || t('common.cluster'), to: clusterPageLink },
          { label: nodeType || t('common.nodeType'), to: nodeTypePageLink },
          { label: node || t('common.node'), to: nodePageLink },
          { label: t('common.get') },
        ]}
        subtitle={t('getTreePage.subtitle')}
        title={t('getTreePage.title')}
      />

      <Grid container spacing={2}>
        {commandGroups.map(([commandSet, commandGroup]) => (
          <Grid item key={commandSet} lg={4} md={6} xs={12}>
            <Card sx={{ height: '100%' }} variant="outlined">
              <CardContent>
                <Typography sx={{ mb: 1 }} variant="h6">
                  {commandGroup.name}
                </Typography>
                <List dense disablePadding>
                  {commandGroup.commands.map(command => (
                    <ListItem disableGutters disablePadding key={command.id}>
                      <ListItemButton
                        component={RouterLink}
                        to={buildPathWithQuery(`/maestro/node/get/${commandSet}/${command.command}`, {
                          cluster,
                          controlplane: controlPlane,
                          node,
                          type: nodeType,
                        })}
                      >
                        <ListItemText primary={command.name} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </SectionBox>
  );
}

export default GetTreePage;
