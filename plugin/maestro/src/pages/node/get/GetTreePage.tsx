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

  const commandGroups = Object.entries(resourceTree as Record<string, TreeCommandGroup>);

  return (
    <SectionBox title="" textAlign="left" paddingTop={2}>
      <PageHeader
        breadcrumbs={[
          { label: t('common.clusters'), to: '/maestro' },
          { label: cluster || t('common.cluster'), to: `/maestro?cluster=${cluster || ''}` },
          { label: nodeType || t('common.nodeType'), to: `/maestro/?cluster=${cluster || ''}&type=${nodeType || ''}` },
          { label: node || t('common.node'), to: `/maestro/node?cluster=${cluster || ''}&type=${nodeType || ''}&node=${node || ''}` },
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
                        to={`/maestro/node/get/${commandSet}/${command.command}?cluster=${cluster}&controlplane=${controlPlane}&node=${node}&type=${nodeType}`}
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
