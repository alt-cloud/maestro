/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import MaestroMainPage from './pages/clusters/MaestroMainPage';
import ScanNetworksPage from './pages/clusters/ScanNetworksPage';
import ServiceCommandPage from './pages/node/commands/ServiceCommandPage';
import TableCommandPage from './pages/node/commands/TableCommandPage';
import TextCommandPage from './pages/node/commands/TextCommandPage';
import GetResourcePage from './pages/node/get/GetResourcePage';
import GetTreePage from './pages/node/get/GetTreePage';
import NodePage from './pages/node/NodePage';

interface SidebarConfig {
  item: string;
  sidebar: string;
}

interface MaestroPageRegistrationConfig {
  path: string;
  name: string;
  component: React.ComponentType<any>;
  exact?: boolean;
  sidebar: SidebarConfig;
}

interface MaestroResourceRegistrationConfig {
  name: string;
  listPath: string;
  listRouteName: string;
  listComponent: React.ComponentType<any>;
  detailPath?: string;
  detailRouteName?: string;
  detailComponent?: React.ComponentType<any>;
  listExact?: boolean;
  detailExact?: boolean;
  sidebar: SidebarConfig;
}

const homeSidebar: SidebarConfig = { item: 'maestroplugin', sidebar: 'HOME' };
const maestroSidebar: SidebarConfig = { item: 'maestro', sidebar: 'myplugin' };
const clustersSidebar: SidebarConfig = { item: 'Clusters', sidebar: 'HOME' };

function registerMaestroPage(config: MaestroPageRegistrationConfig) {
  const { path, name, component: PageComponent, exact = true, sidebar } = config;
  registerRoute({
    path,
    name,
    exact,
    sidebar,
    useClusterURL: false,
    noAuthRequired: true,
    component: () => <PageComponent />,
  });
}

function registerMaestroResource(config: MaestroResourceRegistrationConfig) {
  const {
    name,
    listPath,
    listRouteName,
    listComponent,
    detailPath,
    detailRouteName,
    detailComponent,
    listExact = true,
    detailExact = true,
    sidebar,
  } = config;

  registerSidebarEntry({
    name,
    label: name,
    url: listPath,
    sidebar: sidebar.sidebar,
    parent: sidebar.item,
  });

  const resourceSidebar: SidebarConfig = {
    item: name,
    sidebar: sidebar.sidebar,
  };

  registerMaestroPage({
    path: listPath,
    name: listRouteName,
    component: listComponent,
    exact: listExact,
    sidebar: resourceSidebar,
  });

  if (detailPath && detailRouteName && detailComponent) {
    registerMaestroPage({
      path: detailPath,
      name: detailRouteName,
      component: detailComponent,
      exact: detailExact,
      sidebar: resourceSidebar,
    });
  }
}

registerSidebarEntry({
  name: 'maestroplugin',
  label: 'Maestro',
  url: '/maestro',
  icon: 'mdi:music-note-outline',
  sidebar: 'HOME',
});

registerSidebarEntry({
  name: 'backToRoot',
  label: 'Back to Kubernetes',
  url: '/',
  icon: 'mdi:hexagon',
  sidebar: 'myplugin',
});

registerSidebarEntry({
  name: 'maestro',
  label: 'Maestro',
  url: '/maestro',
  icon: 'mdi:music-note-outline',
  sidebar: 'myplugin',
});

registerMaestroResource({
  name: 'Clusters',
  listPath: '/maestro',
  listRouteName: 'maestro_home',
  listComponent: MaestroMainPage,
  sidebar: homeSidebar,
});

registerMaestroPage({
  path: '/maestro/cluster',
  name: 'maestro_cluster',
  component: MaestroMainPage,
  sidebar: clustersSidebar,
});

registerMaestroPage({
  path: '/maestro/cluster/scanNets',
  name: 'maestro_cluster_scan_nets',
  component: ScanNetworksPage,
  sidebar: clustersSidebar,
});

registerMaestroPage({
  path: '/maestro/node',
  name: 'maestro_node',
  component: NodePage,
  sidebar: maestroSidebar,
});

registerMaestroPage({
  path: '/maestro/node/get',
  name: 'maestro_node_get_tree',
  component: GetTreePage,
  sidebar: maestroSidebar,
});

registerMaestroPage({
  path: '/maestro/node/get/:commandSet/:command',
  name: 'maestro_node_get_resource',
  component: GetResourcePage,
  sidebar: maestroSidebar,
});

registerMaestroPage({
  path: '/maestro/node/service',
  name: 'maestro_node_service',
  component: ServiceCommandPage,
  sidebar: maestroSidebar,
});

const textCommandRoutes = [
  { path: '/maestro/node/dmesg', name: 'maestro_node_dmesg', exact: true },
  { path: '/maestro/node/version', name: 'maestro_node_version', exact: true },
  {
    path: '/maestro/node/inspect/dependencies',
    name: 'maestro_node_inspect_dependencies',
    exact: true,
  },
  { path: '/maestro/node/logs/:service?', name: 'maestro_node_service_logs', exact: false },
] as const;

textCommandRoutes.forEach(route => {
  registerMaestroPage({
    path: route.path,
    name: route.name,
    component: TextCommandPage,
    exact: route.exact,
    sidebar: maestroSidebar,
  });
});

const tableCommandPaths = [
  'containers',
  'etcd/members',
  'etcd/status',
  'memory',
  'mounts',
  'netstat',
  'image/default',
  'image/list',
  'processes',
  'stats',
  'time',
  'usage',
] as const;

tableCommandPaths.forEach(commandPath => {
  registerMaestroPage({
    path: `/maestro/node/${commandPath}`,
    name: `maestro_node_${commandPath.replace('/', '_')}`,
    component: TableCommandPage,
    sidebar: maestroSidebar,
  });
});
