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

// Example of using i18n (internationalization):
// function MyComponent() {
//   const { t } = useTranslation();
//   return <div>{t('translation_key')}</div>;
// }


import {
  registerRoute,
  registerRouteFilter,
  registerSidebarEntry,
  registerSidebarEntryFilter,
} from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';

import MaestroIcon from './maestro.svg';
import MaestroMainPage from './MaestroMainPage';
import MaestroNodePage from './node/index';

// Add an entry to the home sidebar (not in cluster).
registerSidebarEntry({
  name: 'maestroplugin',
  label: 'Maestro',
  url: '/maestro',
  icon: 'MaestroIcon',
  sidebar: 'HOME',
});


registerRoute({
  path: '/maestro',
//   sidebar: {
//     item: 'maestro',
//     sidebar: 'myplugin',
//   },
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro',
  exact: true,
  component: () => (
      <MaestroMainPage/>
  ),
});

registerRoute({
  path: '/maestro/node',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'node',
  exact: true,
  component: () => (
      <MaestroNodePage/>
  ),
});

// Adds a completely new sidebar + entry because the sidebar "myplugin" does not exist.
registerSidebarEntry({
  name: 'backtoroot',
  label: 'Back to kubernetes',
  url: '/',
  icon: 'mdi:hexagon',
  sidebar: 'myplugin',
});


// Adds a entry to the recently created sidebar "maestro".
registerSidebarEntry({
  name: 'maestro',
  label: 'MAESTRO AREA',
  url: '/maestro',
  icon: 'MaestroIcon',
  sidebar: 'myplugin',
});

// CLUSTERS PAGE

import EnterIPs from './cluster/enterScanIPS.tsx';

// registerRoute({
//   path: '/maestro/cluster/enterips',
//   sidebar: {
//     item: 'maestro',
//     sidebar: 'myplugin',
//   },
//   useClusterURL: false,
//   noAuthRequired: true, // No authentication is required to see the view
//   name: 'maestro_cluster_enterips',
//   exact: true,
//   component: () => (
//       <EnterIPs/>
//   ),
// });

// import EnterIPsPage from './cluster/enterScanIPS.tsx';
import ScanNets from './cluster/scanNets.tsx';

registerRoute({
  path: '/maestro/cluster/scanNets',
  sidebar: {
    item: 'maestro',
    sidebar: 'myplugin',
  },
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_cluster_scanNets',
//   id: 'maestro_get',
  exact: true,
  component: () => (<ScanNets/>)});


// TALOSCTL TEXTCMDPAGES
import TextCmdPage from './node/textCmdPage.tsx';

registerRoute({
  path: '/maestro/node/dmesg',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_dmesg',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TextCmdPage/>)});

registerRoute({
  path: '/maestro/node/logs',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_service_logs',
//   id: 'maestro_get',
  exact: false,
  component: () => (<TextCmdPage/>)});

registerRoute({
  path: '/maestro/node/version',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_version',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TextCmdPage/>)});


registerRoute({
  path: '/maestro/node/inspect/dependencies',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_inspect_dependencies',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TextCmdPage/>)});

// TALOSCTL TABLECMDPAGES
// TALOSCTL CONTAINERS
import TableCmdPage from './node/tableCmdPage.tsx';

registerRoute({
  path: '/maestro/node/containers',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_containers',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL ETCD MEMBERS
// import EtcdMembers from './node/etcd/members/cmdPage';
registerRoute({
  path: '/maestro/node/etcd/members',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_etcd_members',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL ETCD MEMBERS
// import EtcdStatus from './node/etcd/status/cmdPage';
registerRoute({
  path: '/maestro/node/etcd/status',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_etcd_status',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL MEMORY
// import Memory from './node/memory/cmdPage';
registerRoute({
  path: '/maestro/node/memory',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_memory',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL MOUNTS
// import Mounts from './node/mounts/cmdPage';
registerRoute({
  path: '/maestro/node/mounts',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_mounts',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL NETSTAT
// import Netstat from './node/netstat/cmdPage';
registerRoute({
  path: '/maestro/node/netstat',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_netstat',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL IMAGE DEFAULT
// import ImageDefault from './node/image/default/cmdPage';
registerRoute({
  path: '/maestro/node/image/default',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_image_default',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL IMAGE LIST
// import ImageList from './node/image/list/cmdPage';
registerRoute({
  path: '/maestro/node/image/list',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_image_list',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL IMAGE LIST
// import Processes from './node/processes/cmdPage';
registerRoute({
  path: '/maestro/node/processes',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_processes',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL SERVICE
import ServiceTableCmdPage from './node/service/cmdPage';
registerRoute({
  path: '/maestro/node/service',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_service',
//   id: 'maestro_get',
  exact: true,
  component: () => (<ServiceTableCmdPage/>)});

// TALOSCTL STATS
// import Stats from './node/stats/cmdPage';
registerRoute({
  path: '/maestro/node/stats',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_stats',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL TIME
// import Time from './node/time/cmdPage';
registerRoute({
  path: '/maestro/node/time',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_time',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL STATS
// import Usage from './node/usage/cmdPage';
registerRoute({
  path: '/maestro/node/usage',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_usage',
//   id: 'maestro_get',
  exact: true,
  component: () => (<TableCmdPage/>)});

// TALOSCTL GET TREE
registerRoute({
  path: '/maestro/node/get',
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_node_get',
//   id: 'maestro_get',
  exact: true,
  component: () => (<GetTree/>)});

import GetTree from './node/get/index';

// TALOSCTL GET IMPORTS
// TALOSCTL GET REGISTERROUTES
// GET/BLOCK/BLOCKDEVICE Tree

// import getRoutes from './node/get/routes';
// import getRoutes from './getRoutes';
import GetPage from './node/get/Page';

registerRoute({
  path: '/maestro/node/get/block/blockdevice',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_blockdevice',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/blocksymlink',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_blocksymlink',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/discoveredvolume',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_discoveredvolume',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/discoveryrefreshrequest',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_discoveryrefreshrequest',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/discoveryrefreshstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_discoveryrefreshstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/disk',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_disk',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/mountrequest',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_mountrequest',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/mountstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_mountstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/systemdisk',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_systemdisk',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/userdiskconfigstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_userdiskconfigstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/volumeconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumeconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/volumelifecycle',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumelifecycle',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/volumemountrequest',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumemountrequest',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/volumemountstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumemountstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/block/volumestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumestatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/cluster/affiliate',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_affiliate',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/cluster/discoveryconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_discoveryconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/cluster/identity',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_identity',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/cluster/info',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_info',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/cluster/kubernetesaccessconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_kubernetesaccessconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/cluster/member',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_member',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/config/machineconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_config_machineconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/config/machinetype',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_config_machinetype',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/cri/imagecacheconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cri_imagecacheconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/cri/registryconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cri_registryconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/cri/seccompprofile',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cri_seccompprofile',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/etcd/etcdconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_etcdconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/etcd/etcdmember',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_etcdmember',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/etcd/etcdspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_etcdspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/etcd/pkistatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_pkistatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/files/etcfilespec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_files_etcfilespec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/files/etcfilestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_files_etcfilestatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/hardware/memorymodules',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_memorymodules',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/hardware/devices',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_devices',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/hardware/pcrstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_pcrstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/hardware/cpus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_cpus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/hardware/systeminformation',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_systeminformation',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/k8s/nodeannotationspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodeannotationspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/k8s/nodecordonedspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodecordonedspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/k8s/nodelabelspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodelabelspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/k8s/nodetaintspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodetaintspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/admissioncontrolconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_admissioncontrolconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/apiserverconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_apiserverconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/auditpolicyconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_auditpolicyconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/authorizationconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_authorizationconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/bootstrapmanifestsconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_bootstrapmanifestsconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/configstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_configstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/controllermanagerconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_controllermanagerconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/endpoint',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_endpoint',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/extramanifestsconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_extramanifestsconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeletconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeletconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeletlifecycle',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeletlifecycle',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeletspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeletspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeprismconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeprismconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeprismendpoint',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeprismendpoint',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeprismstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeprismstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/manifest',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_manifest',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/manifeststatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_manifeststatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/nodeipconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodeipconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/nodeip',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodeip',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/nodename',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodename',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/nodestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodestatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/schedulerconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_schedulerconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/secretstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_secretstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/staticpod',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_staticpod',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/staticpodserverstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_staticpodserverstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubernetes/podstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_podstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubespan/kubespanconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubespan/kubespanendpoint',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanendpoint',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubespan/kubespanidentity',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanidentity',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubespan/kubespanpeerspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanpeerspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/kubespan/kubespanpeerstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanpeerstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/meta/ns',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_meta_ns',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/meta/api-resources',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_meta_api-resources',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/addressspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_addressspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/address',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_address',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/deviceconfigspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_deviceconfigspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/dnsresolvecach',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_dnsresolvecach',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/dnsupstream',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_dnsupstream',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/ethernetspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_ethernetspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/ethtool',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_ethtool',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/hardwareaddress',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hardwareaddress',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/hostdnsconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hostdnsconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/hostnamespec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hostnamespec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/hostname',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hostname',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/linkrefresh',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_linkrefresh',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/linkspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_linkspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/link',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_link',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/netstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_netstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/chain',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_chain',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/nodeaddress',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_nodeaddress',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/nodeaddressfilter',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_nodeaddressfilter',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/nodeaddresssortalgorithm',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_nodeaddresssortalgorithm',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/operatorspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_operatorspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/probespec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_probespec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/probe',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_probe',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/resolverspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_resolverspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/resolvers',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_resolvers',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/routespec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_routespec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/route',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_route',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/timeserverspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_timeserverspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/net/timeserver',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_timeserver',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/perf/cpustat',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_perf_cpustat',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/perf/memorystat',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_perf_memorystat',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/devicesstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_devicesstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/diagnostic',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_diagnostic',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/eventsinkconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_eventsinkconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/extensionserviceconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_extensionserviceconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/extensionserviceconfigstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_extensionserviceconfigstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/extensions',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_extensions',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/modules',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_modules',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/kernelparamdefaultspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_kernelparamdefaultspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/kernelparamspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_kernelparamspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/sysctls',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_sysctls',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/kmsglogconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_kmsglogconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/machineresetsignal',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_machineresetsignal',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/machinestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_machinestatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/maintenanceserviceconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_maintenanceserviceconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/maintenanceservicerequest',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_maintenanceservicerequest',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/meta',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_meta',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/metaload',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_metaload',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/mounts',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_mounts',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/pcidriverrebindconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_pcidriverrebindconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/pcidriverrebinds',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_pcidriverrebinds',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/uniquemachinetoken',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_uniquemachinetoken',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/version',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_version',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/watchdogtimerconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_watchdogtimerconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/runtime/watchdogtimerstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_watchdogtimerstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/apicertificate',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_apicertificate',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/certsan',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_certsan',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/etcdrootsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_etcdrootsecret',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/etcdsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_etcdsecret',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/kubeletsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubeletsecret',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/kubernetesdynamiccert',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubernetesdynamiccert',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/kubernetesrootsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubernetesrootsecret',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/kubernetessecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubernetessecret',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/maintenancerootsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_maintenancerootsecret',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/maintenanceservicecertificate',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_maintenanceservicecertificate',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/osrootsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_osrootsecret',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/secrets/trustdcertificate',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_trustdcertificate',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/siderolink/siderolinkconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_siderolink_siderolinkconfig',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/siderolink/siderolinkstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_siderolink_siderolinkstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/siderolink/siderolinktunnel',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_siderolink_siderolinktunnel',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/talos/platformmetadata',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_talos_platformmetadata',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/talos/securitystate',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_talos_securitystate',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/v1alpha1/acquireconfigspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_acquireconfigspec',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/v1alpha1/acquireconfigstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_acquireconfigstatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/v1alpha1/adjtimestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_adjtimestatus',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/v1alpha1/svc',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_svc',
  exact: true,
  component: () => (<GetPage/>)
});

registerRoute({
  path: '/maestro/node/get/v1alpha1/timestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_timestatus',
  exact: true,
  component: () => (<GetPage/>)
});



