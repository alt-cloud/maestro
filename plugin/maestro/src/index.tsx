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
import ScanNets from './cluster/scanNets';
import MaestroMainPage from './MaestroMainPage';
import MaestroNodePage from './node';
import GetTree from './node/get';
import GetPage from './node/get/Page';
import ServiceTableCmdPage from './node/service/cmdPage';
import TableCmdPage from './node/tableCmdPage';
import TextCmdPage from './node/textCmdPage';

interface SidebarConfig {
  item: string;
  sidebar: string;
}

interface MaestroPageRegistrationConfig {
  path: string;
  name: string;
  Component: React.ComponentType<any>;
  exact?: boolean;
  sidebar: SidebarConfig;
}

interface MaestroResourceRegistrationConfig {
  name: string;
  listPath: string;
  listRouteName: string;
  ListComponent: React.ComponentType<any>;
  detailPath?: string;
  detailRouteName?: string;
  DetailComponent?: React.ComponentType<any>;
  listExact?: boolean;
  detailExact?: boolean;
  sidebar: SidebarConfig;
}

const homeSidebar: SidebarConfig = { item: 'maestroplugin', sidebar: 'HOME' };
const maestroSidebar: SidebarConfig = { item: 'maestro', sidebar: 'myplugin' };
const clustersSidebar: SidebarConfig = { item: 'Clusters', sidebar: 'HOME' };

function registerMaestroPage(config: MaestroPageRegistrationConfig) {
  const { path, name, Component, exact = true, sidebar } = config;
  registerRoute({
    path,
    name,
    exact,
    sidebar,
    useClusterURL: false,
    noAuthRequired: true,
    component: () => <Component />,
  });
}

function registerMaestroResource(config: MaestroResourceRegistrationConfig) {
  const {
    name,
    listPath,
    listRouteName,
    ListComponent,
    detailPath,
    detailRouteName,
    DetailComponent,
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
    Component: ListComponent,
    exact: listExact,
    sidebar: resourceSidebar,
  });

  if (detailPath && detailRouteName && DetailComponent) {
    registerMaestroPage({
      path: detailPath,
      name: detailRouteName,
      Component: DetailComponent,
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
  name: 'backtoroot',
  label: 'Back to kubernetes',
  url: '/',
  icon: 'mdi:hexagon',
  sidebar: 'myplugin',
});

registerSidebarEntry({
  name: 'maestro',
  label: 'MAESTRO AREA',
  url: '/maestro',
  icon: 'mdi:music-note-outline',
  sidebar: 'myplugin',
});

registerMaestroResource({
  name: 'Clusters',
  listPath: '/maestro',
  listRouteName: 'maestro_home',
  ListComponent: MaestroMainPage,
  sidebar: homeSidebar,
});

registerMaestroPage({
  path: '/maestro/cluster',
  name: 'maestro_cluster',
  Component: MaestroMainPage,
  sidebar: clustersSidebar,
});

registerMaestroPage({
  path: '/maestro/cluster/scanNets',
  name: 'maestro_cluster_scan_nets',
  Component: ScanNets,
  sidebar: clustersSidebar,
});

registerMaestroPage({
  path: '/maestro/node',
  name: 'maestro_node',
  Component: MaestroNodePage,
  sidebar: maestroSidebar,
});

registerMaestroResource({
  name: 'NodeGet',
  listPath: '/maestro/node/get',
  listRouteName: 'maestro_node_get_tree',
  ListComponent: GetTree,
  detailPath: '/maestro/node/get/:commandSet/:command',
  detailRouteName: 'maestro_node_get_resource',
  DetailComponent: GetPage,
  sidebar: maestroSidebar,
});

registerMaestroPage({
  path: '/maestro/node/service',
  name: 'maestro_node_service',
  Component: ServiceTableCmdPage,
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
    Component: TextCmdPage,
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
    Component: TableCmdPage,
    sidebar: maestroSidebar,
  });
});
