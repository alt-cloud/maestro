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
  sidebar: {
    item: 'maestro',
    sidebar: 'myplugin',
  },
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
  sidebar: {
    item: 'maestro',
    sidebar: 'myplugin',
  },
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

/*
registerSidebarEntry({
  parent: null,
  name: 'get',
  label: 'GET',
  url: '/maestro/get',
  icon: 'MaestroIcon',
  sidebar: 'myplugin',
});*/


// // GET/BLOCK Tree
// registerSidebarEntry({
// //   parent: '/maestro/get',
//   name: 'block',
//   label: 'BLOCK',
//   url: '/maestro/get/block',
//   icon: 'MaestroIcon',
//   sidebar: 'myplugin',
// });

// registerSidebarEntry({
// //   parent: '/maestro/get',
//   name: 'blockdevice',
//   label: 'BLOCKDEVICE',
//   url: '/maestro/get/block/blockdevice',
//   icon: 'MaestroIcon',
//   sidebar: 'myplugin',
// });

// registerSidebarEntry({
// //   parent: '/maestro/get',
//   name: 'hardwaredevices',
//   label: 'HARDWAREDEVICES',
//   url: '/maestro/get/hardware/devices',
//   icon: 'MaestroIcon',
//   sidebar: 'myplugin',
// });

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
import GetBlockBlockdevice from './node/get/block/blockdevice/Page';

registerRoute({
  path: '/maestro/node/get/block/blockdevice',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_blockdevice',
  exact: true,
  component: () => (<GetBlockBlockdevice/>)
});

import GetBlockBlocksymlink from './node/get/block/blocksymlink/Page';

registerRoute({
  path: '/maestro/node/get/block/blocksymlink',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_blocksymlink',
  exact: true,
  component: () => (<GetBlockBlocksymlink/>)
});

import GetBlockDiscoveredvolume from './node/get/block/discoveredvolume/Page';

registerRoute({
  path: '/maestro/node/get/block/discoveredvolume',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_discoveredvolume',
  exact: true,
  component: () => (<GetBlockDiscoveredvolume/>)
});

import GetBlockDiscoveryrefreshrequest from './node/get/block/discoveryrefreshrequest/Page';

registerRoute({
  path: '/maestro/node/get/block/discoveryrefreshrequest',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_discoveryrefreshrequest',
  exact: true,
  component: () => (<GetBlockDiscoveryrefreshrequest/>)
});

import GetBlockDiscoveryrefreshstatus from './node/get/block/discoveryrefreshstatus/Page';

registerRoute({
  path: '/maestro/node/get/block/discoveryrefreshstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_discoveryrefreshstatus',
  exact: true,
  component: () => (<GetBlockDiscoveryrefreshstatus/>)
});

import GetBlockDisk from './node/get/block/disk/Page';

registerRoute({
  path: '/maestro/node/get/block/disk',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_disk',
  exact: true,
  component: () => (<GetBlockDisk/>)
});

import GetBlockMountrequest from './node/get/block/mountrequest/Page';

registerRoute({
  path: '/maestro/node/get/block/mountrequest',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_mountrequest',
  exact: true,
  component: () => (<GetBlockMountrequest/>)
});

import GetBlockMountstatus from './node/get/block/mountstatus/Page';

registerRoute({
  path: '/maestro/node/get/block/mountstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_mountstatus',
  exact: true,
  component: () => (<GetBlockMountstatus/>)
});

import GetBlockSystemdisk from './node/get/block/systemdisk/Page';

registerRoute({
  path: '/maestro/node/get/block/systemdisk',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_systemdisk',
  exact: true,
  component: () => (<GetBlockSystemdisk/>)
});

import GetBlockUserdiskconfigstatus from './node/get/block/userdiskconfigstatus/Page';

registerRoute({
  path: '/maestro/node/get/block/userdiskconfigstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_userdiskconfigstatus',
  exact: true,
  component: () => (<GetBlockUserdiskconfigstatus/>)
});

import GetBlockVolumeconfig from './node/get/block/volumeconfig/Page';

registerRoute({
  path: '/maestro/node/get/block/volumeconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumeconfig',
  exact: true,
  component: () => (<GetBlockVolumeconfig/>)
});

import GetBlockVolumelifecycle from './node/get/block/volumelifecycle/Page';

registerRoute({
  path: '/maestro/node/get/block/volumelifecycle',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumelifecycle',
  exact: true,
  component: () => (<GetBlockVolumelifecycle/>)
});

import GetBlockVolumemountrequest from './node/get/block/volumemountrequest/Page';

registerRoute({
  path: '/maestro/node/get/block/volumemountrequest',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumemountrequest',
  exact: true,
  component: () => (<GetBlockVolumemountrequest/>)
});

import GetBlockVolumemountstatus from './node/get/block/volumemountstatus/Page';

registerRoute({
  path: '/maestro/node/get/block/volumemountstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumemountstatus',
  exact: true,
  component: () => (<GetBlockVolumemountstatus/>)
});

import GetBlockVolumestatus from './node/get/block/volumestatus/Page';

registerRoute({
  path: '/maestro/node/get/block/volumestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumestatus',
  exact: true,
  component: () => (<GetBlockVolumestatus/>)
});

import GetClusterAffiliate from './node/get/cluster/affiliate/Page';

registerRoute({
  path: '/maestro/node/get/cluster/affiliate',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_affiliate',
  exact: true,
  component: () => (<GetClusterAffiliate/>)
});

import GetClusterDiscoveryconfig from './node/get/cluster/discoveryconfig/Page';

registerRoute({
  path: '/maestro/node/get/cluster/discoveryconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_discoveryconfig',
  exact: true,
  component: () => (<GetClusterDiscoveryconfig/>)
});

import GetClusterIdentity from './node/get/cluster/identity/Page';

registerRoute({
  path: '/maestro/node/get/cluster/identity',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_identity',
  exact: true,
  component: () => (<GetClusterIdentity/>)
});

import GetClusterInfo from './node/get/cluster/info/Page';

registerRoute({
  path: '/maestro/node/get/cluster/info',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_info',
  exact: true,
  component: () => (<GetClusterInfo/>)
});

import GetClusterKubernetesaccessconfig from './node/get/cluster/kubernetesaccessconfig/Page';

registerRoute({
  path: '/maestro/node/get/cluster/kubernetesaccessconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_kubernetesaccessconfig',
  exact: true,
  component: () => (<GetClusterKubernetesaccessconfig/>)
});

import GetClusterMember from './node/get/cluster/member/Page';

registerRoute({
  path: '/maestro/node/get/cluster/member',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_member',
  exact: true,
  component: () => (<GetClusterMember/>)
});

import GetConfigMachineconfig from './node/get/config/machineconfig/Page';

registerRoute({
  path: '/maestro/node/get/config/machineconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_config_machineconfig',
  exact: true,
  component: () => (<GetConfigMachineconfig/>)
});

import GetConfigMachinetype from './node/get/config/machinetype/Page';

registerRoute({
  path: '/maestro/node/get/config/machinetype',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_config_machinetype',
  exact: true,
  component: () => (<GetConfigMachinetype/>)
});

import GetCriImagecacheconfig from './node/get/cri/imagecacheconfig/Page';

registerRoute({
  path: '/maestro/node/get/cri/imagecacheconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cri_imagecacheconfig',
  exact: true,
  component: () => (<GetCriImagecacheconfig/>)
});

import GetCriRegistryconfig from './node/get/cri/registryconfig/Page';

registerRoute({
  path: '/maestro/node/get/cri/registryconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cri_registryconfig',
  exact: true,
  component: () => (<GetCriRegistryconfig/>)
});

import GetCriSeccompprofile from './node/get/cri/seccompprofile/Page';

registerRoute({
  path: '/maestro/node/get/cri/seccompprofile',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cri_seccompprofile',
  exact: true,
  component: () => (<GetCriSeccompprofile/>)
});

import GetEtcdEtcdconfig from './node/get/etcd/etcdconfig/Page';

registerRoute({
  path: '/maestro/node/get/etcd/etcdconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_etcdconfig',
  exact: true,
  component: () => (<GetEtcdEtcdconfig/>)
});

import GetEtcdEtcdmember from './node/get/etcd/etcdmember/Page';

registerRoute({
  path: '/maestro/node/get/etcd/etcdmember',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_etcdmember',
  exact: true,
  component: () => (<GetEtcdEtcdmember/>)
});

import GetEtcdEtcdspec from './node/get/etcd/etcdspec/Page';

registerRoute({
  path: '/maestro/node/get/etcd/etcdspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_etcdspec',
  exact: true,
  component: () => (<GetEtcdEtcdspec/>)
});

import GetEtcdPkistatus from './node/get/etcd/pkistatus/Page';

registerRoute({
  path: '/maestro/node/get/etcd/pkistatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_pkistatus',
  exact: true,
  component: () => (<GetEtcdPkistatus/>)
});

import GetFilesEtcfilespec from './node/get/files/etcfilespec/Page';

registerRoute({
  path: '/maestro/node/get/files/etcfilespec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_files_etcfilespec',
  exact: true,
  component: () => (<GetFilesEtcfilespec/>)
});

import GetFilesEtcfilestatus from './node/get/files/etcfilestatus/Page';

registerRoute({
  path: '/maestro/node/get/files/etcfilestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_files_etcfilestatus',
  exact: true,
  component: () => (<GetFilesEtcfilestatus/>)
});

import GetHardwareMemorymodules from './node/get/hardware/memorymodules/Page';

registerRoute({
  path: '/maestro/node/get/hardware/memorymodules',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_memorymodules',
  exact: true,
  component: () => (<GetHardwareMemorymodules/>)
});

import GetHardwareDevices from './node/get/hardware/devices/Page';

registerRoute({
  path: '/maestro/node/get/hardware/devices',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_devices',
  exact: true,
  component: () => (<GetHardwareDevices/>)
});

import GetHardwarePcrstatus from './node/get/hardware/pcrstatus/Page';

registerRoute({
  path: '/maestro/node/get/hardware/pcrstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_pcrstatus',
  exact: true,
  component: () => (<GetHardwarePcrstatus/>)
});

import GetHardwareCpus from './node/get/hardware/cpus/Page';

registerRoute({
  path: '/maestro/node/get/hardware/cpus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_cpus',
  exact: true,
  component: () => (<GetHardwareCpus/>)
});

import GetHardwareSysteminformation from './node/get/hardware/systeminformation/Page';

registerRoute({
  path: '/maestro/node/get/hardware/systeminformation',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_systeminformation',
  exact: true,
  component: () => (<GetHardwareSysteminformation/>)
});

import GetK8SNodeannotationspec from './node/get/k8s/nodeannotationspec/Page';

registerRoute({
  path: '/maestro/node/get/k8s/nodeannotationspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodeannotationspec',
  exact: true,
  component: () => (<GetK8SNodeannotationspec/>)
});

import GetK8SNodecordonedspec from './node/get/k8s/nodecordonedspec/Page';

registerRoute({
  path: '/maestro/node/get/k8s/nodecordonedspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodecordonedspec',
  exact: true,
  component: () => (<GetK8SNodecordonedspec/>)
});

import GetK8SNodelabelspec from './node/get/k8s/nodelabelspec/Page';

registerRoute({
  path: '/maestro/node/get/k8s/nodelabelspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodelabelspec',
  exact: true,
  component: () => (<GetK8SNodelabelspec/>)
});

import GetK8SNodetaintspec from './node/get/k8s/nodetaintspec/Page';

registerRoute({
  path: '/maestro/node/get/k8s/nodetaintspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodetaintspec',
  exact: true,
  component: () => (<GetK8SNodetaintspec/>)
});

import GetKubernetesAdmissioncontrolconfig from './node/get/kubernetes/admissioncontrolconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/admissioncontrolconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_admissioncontrolconfig',
  exact: true,
  component: () => (<GetKubernetesAdmissioncontrolconfig/>)
});

import GetKubernetesApiserverconfig from './node/get/kubernetes/apiserverconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/apiserverconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_apiserverconfig',
  exact: true,
  component: () => (<GetKubernetesApiserverconfig/>)
});

import GetKubernetesAuditpolicyconfig from './node/get/kubernetes/auditpolicyconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/auditpolicyconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_auditpolicyconfig',
  exact: true,
  component: () => (<GetKubernetesAuditpolicyconfig/>)
});

import GetKubernetesAuthorizationconfig from './node/get/kubernetes/authorizationconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/authorizationconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_authorizationconfig',
  exact: true,
  component: () => (<GetKubernetesAuthorizationconfig/>)
});

import GetKubernetesBootstrapmanifestsconfig from './node/get/kubernetes/bootstrapmanifestsconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/bootstrapmanifestsconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_bootstrapmanifestsconfig',
  exact: true,
  component: () => (<GetKubernetesBootstrapmanifestsconfig/>)
});

import GetKubernetesConfigstatus from './node/get/kubernetes/configstatus/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/configstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_configstatus',
  exact: true,
  component: () => (<GetKubernetesConfigstatus/>)
});

import GetKubernetesControllermanagerconfig from './node/get/kubernetes/controllermanagerconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/controllermanagerconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_controllermanagerconfig',
  exact: true,
  component: () => (<GetKubernetesControllermanagerconfig/>)
});

import GetKubernetesEndpoint from './node/get/kubernetes/endpoint/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/endpoint',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_endpoint',
  exact: true,
  component: () => (<GetKubernetesEndpoint/>)
});

import GetKubernetesExtramanifestsconfig from './node/get/kubernetes/extramanifestsconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/extramanifestsconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_extramanifestsconfig',
  exact: true,
  component: () => (<GetKubernetesExtramanifestsconfig/>)
});

import GetKubernetesKubeletconfig from './node/get/kubernetes/kubeletconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeletconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeletconfig',
  exact: true,
  component: () => (<GetKubernetesKubeletconfig/>)
});

import GetKubernetesKubeletlifecycle from './node/get/kubernetes/kubeletlifecycle/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeletlifecycle',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeletlifecycle',
  exact: true,
  component: () => (<GetKubernetesKubeletlifecycle/>)
});

import GetKubernetesKubeletspec from './node/get/kubernetes/kubeletspec/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeletspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeletspec',
  exact: true,
  component: () => (<GetKubernetesKubeletspec/>)
});

import GetKubernetesKubeprismconfig from './node/get/kubernetes/kubeprismconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeprismconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeprismconfig',
  exact: true,
  component: () => (<GetKubernetesKubeprismconfig/>)
});

import GetKubernetesKubeprismendpoint from './node/get/kubernetes/kubeprismendpoint/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeprismendpoint',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeprismendpoint',
  exact: true,
  component: () => (<GetKubernetesKubeprismendpoint/>)
});

import GetKubernetesKubeprismstatus from './node/get/kubernetes/kubeprismstatus/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/kubeprismstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeprismstatus',
  exact: true,
  component: () => (<GetKubernetesKubeprismstatus/>)
});

import GetKubernetesManifest from './node/get/kubernetes/manifest/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/manifest',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_manifest',
  exact: true,
  component: () => (<GetKubernetesManifest/>)
});

import GetKubernetesManifeststatus from './node/get/kubernetes/manifeststatus/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/manifeststatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_manifeststatus',
  exact: true,
  component: () => (<GetKubernetesManifeststatus/>)
});

import GetKubernetesNodeipconfig from './node/get/kubernetes/nodeipconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/nodeipconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodeipconfig',
  exact: true,
  component: () => (<GetKubernetesNodeipconfig/>)
});

import GetKubernetesNodeip from './node/get/kubernetes/nodeip/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/nodeip',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodeip',
  exact: true,
  component: () => (<GetKubernetesNodeip/>)
});

import GetKubernetesNodename from './node/get/kubernetes/nodename/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/nodename',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodename',
  exact: true,
  component: () => (<GetKubernetesNodename/>)
});

import GetKubernetesNodestatus from './node/get/kubernetes/nodestatus/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/nodestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodestatus',
  exact: true,
  component: () => (<GetKubernetesNodestatus/>)
});

import GetKubernetesSchedulerconfig from './node/get/kubernetes/schedulerconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/schedulerconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_schedulerconfig',
  exact: true,
  component: () => (<GetKubernetesSchedulerconfig/>)
});

import GetKubernetesSecretstatus from './node/get/kubernetes/secretstatus/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/secretstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_secretstatus',
  exact: true,
  component: () => (<GetKubernetesSecretstatus/>)
});

import GetKubernetesStaticpod from './node/get/kubernetes/staticpod/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/staticpod',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_staticpod',
  exact: true,
  component: () => (<GetKubernetesStaticpod/>)
});

import GetKubernetesStaticpodserverstatus from './node/get/kubernetes/staticpodserverstatus/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/staticpodserverstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_staticpodserverstatus',
  exact: true,
  component: () => (<GetKubernetesStaticpodserverstatus/>)
});

import GetKubernetesPodstatus from './node/get/kubernetes/podstatus/Page';

registerRoute({
  path: '/maestro/node/get/kubernetes/podstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_podstatus',
  exact: true,
  component: () => (<GetKubernetesPodstatus/>)
});

import GetKubespanKubespanconfig from './node/get/kubespan/kubespanconfig/Page';

registerRoute({
  path: '/maestro/node/get/kubespan/kubespanconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanconfig',
  exact: true,
  component: () => (<GetKubespanKubespanconfig/>)
});

import GetKubespanKubespanendpoint from './node/get/kubespan/kubespanendpoint/Page';

registerRoute({
  path: '/maestro/node/get/kubespan/kubespanendpoint',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanendpoint',
  exact: true,
  component: () => (<GetKubespanKubespanendpoint/>)
});

import GetKubespanKubespanidentity from './node/get/kubespan/kubespanidentity/Page';

registerRoute({
  path: '/maestro/node/get/kubespan/kubespanidentity',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanidentity',
  exact: true,
  component: () => (<GetKubespanKubespanidentity/>)
});

import GetKubespanKubespanpeerspec from './node/get/kubespan/kubespanpeerspec/Page';

registerRoute({
  path: '/maestro/node/get/kubespan/kubespanpeerspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanpeerspec',
  exact: true,
  component: () => (<GetKubespanKubespanpeerspec/>)
});

import GetKubespanKubespanpeerstatus from './node/get/kubespan/kubespanpeerstatus/Page';

registerRoute({
  path: '/maestro/node/get/kubespan/kubespanpeerstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanpeerstatus',
  exact: true,
  component: () => (<GetKubespanKubespanpeerstatus/>)
});

import GetMetaNs from './node/get/meta/ns/Page';

registerRoute({
  path: '/maestro/node/get/meta/ns',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_meta_ns',
  exact: true,
  component: () => (<GetMetaNs/>)
});

import GetMetaApi_Resources from './node/get/meta/api-resources/Page';

registerRoute({
  path: '/maestro/node/get/meta/api-resources',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_meta_api-resources',
  exact: true,
  component: () => (<GetMetaApi_Resources/>)
});

import GetNetAddressspec from './node/get/net/addressspec/Page';

registerRoute({
  path: '/maestro/node/get/net/addressspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_addressspec',
  exact: true,
  component: () => (<GetNetAddressspec/>)
});

import GetNetAddress from './node/get/net/address/Page';

registerRoute({
  path: '/maestro/node/get/net/address',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_address',
  exact: true,
  component: () => (<GetNetAddress/>)
});

import GetNetDeviceconfigspec from './node/get/net/deviceconfigspec/Page';

registerRoute({
  path: '/maestro/node/get/net/deviceconfigspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_deviceconfigspec',
  exact: true,
  component: () => (<GetNetDeviceconfigspec/>)
});

import GetNetDnsresolvecach from './node/get/net/dnsresolvecach/Page';

registerRoute({
  path: '/maestro/node/get/net/dnsresolvecach',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_dnsresolvecach',
  exact: true,
  component: () => (<GetNetDnsresolvecach/>)
});

import GetNetDnsupstream from './node/get/net/dnsupstream/Page';

registerRoute({
  path: '/maestro/node/get/net/dnsupstream',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_dnsupstream',
  exact: true,
  component: () => (<GetNetDnsupstream/>)
});

import GetNetEthernetspec from './node/get/net/ethernetspec/Page';

registerRoute({
  path: '/maestro/node/get/net/ethernetspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_ethernetspec',
  exact: true,
  component: () => (<GetNetEthernetspec/>)
});

import GetNetEthtool from './node/get/net/ethtool/Page';

registerRoute({
  path: '/maestro/node/get/net/ethtool',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_ethtool',
  exact: true,
  component: () => (<GetNetEthtool/>)
});

import GetNetHardwareaddress from './node/get/net/hardwareaddress/Page';

registerRoute({
  path: '/maestro/node/get/net/hardwareaddress',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hardwareaddress',
  exact: true,
  component: () => (<GetNetHardwareaddress/>)
});

import GetNetHostdnsconfig from './node/get/net/hostdnsconfig/Page';

registerRoute({
  path: '/maestro/node/get/net/hostdnsconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hostdnsconfig',
  exact: true,
  component: () => (<GetNetHostdnsconfig/>)
});

import GetNetHostnamespec from './node/get/net/hostnamespec/Page';

registerRoute({
  path: '/maestro/node/get/net/hostnamespec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hostnamespec',
  exact: true,
  component: () => (<GetNetHostnamespec/>)
});

import GetNetHostname from './node/get/net/hostname/Page';

registerRoute({
  path: '/maestro/node/get/net/hostname',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hostname',
  exact: true,
  component: () => (<GetNetHostname/>)
});

import GetNetLinkrefresh from './node/get/net/linkrefresh/Page';

registerRoute({
  path: '/maestro/node/get/net/linkrefresh',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_linkrefresh',
  exact: true,
  component: () => (<GetNetLinkrefresh/>)
});

import GetNetLinkspec from './node/get/net/linkspec/Page';

registerRoute({
  path: '/maestro/node/get/net/linkspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_linkspec',
  exact: true,
  component: () => (<GetNetLinkspec/>)
});

import GetNetLink from './node/get/net/link/Page';

registerRoute({
  path: '/maestro/node/get/net/link',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_link',
  exact: true,
  component: () => (<GetNetLink/>)
});

import GetNetNetstatus from './node/get/net/netstatus/Page';

registerRoute({
  path: '/maestro/node/get/net/netstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_netstatus',
  exact: true,
  component: () => (<GetNetNetstatus/>)
});

import GetNetChain from './node/get/net/chain/Page';

registerRoute({
  path: '/maestro/node/get/net/chain',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_chain',
  exact: true,
  component: () => (<GetNetChain/>)
});

import GetNetNodeaddress from './node/get/net/nodeaddress/Page';

registerRoute({
  path: '/maestro/node/get/net/nodeaddress',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_nodeaddress',
  exact: true,
  component: () => (<GetNetNodeaddress/>)
});

import GetNetNodeaddressfilter from './node/get/net/nodeaddressfilter/Page';

registerRoute({
  path: '/maestro/node/get/net/nodeaddressfilter',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_nodeaddressfilter',
  exact: true,
  component: () => (<GetNetNodeaddressfilter/>)
});

import GetNetNodeaddresssortalgorithm from './node/get/net/nodeaddresssortalgorithm/Page';

registerRoute({
  path: '/maestro/node/get/net/nodeaddresssortalgorithm',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_nodeaddresssortalgorithm',
  exact: true,
  component: () => (<GetNetNodeaddresssortalgorithm/>)
});

import GetNetOperatorspec from './node/get/net/operatorspec/Page';

registerRoute({
  path: '/maestro/node/get/net/operatorspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_operatorspec',
  exact: true,
  component: () => (<GetNetOperatorspec/>)
});

import GetNetProbespec from './node/get/net/probespec/Page';

registerRoute({
  path: '/maestro/node/get/net/probespec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_probespec',
  exact: true,
  component: () => (<GetNetProbespec/>)
});

import GetNetProbe from './node/get/net/probe/Page';

registerRoute({
  path: '/maestro/node/get/net/probe',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_probe',
  exact: true,
  component: () => (<GetNetProbe/>)
});

import GetNetResolverspec from './node/get/net/resolverspec/Page';

registerRoute({
  path: '/maestro/node/get/net/resolverspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_resolverspec',
  exact: true,
  component: () => (<GetNetResolverspec/>)
});

import GetNetResolvers from './node/get/net/resolvers/Page';

registerRoute({
  path: '/maestro/node/get/net/resolvers',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_resolvers',
  exact: true,
  component: () => (<GetNetResolvers/>)
});

import GetNetRoutespec from './node/get/net/routespec/Page';

registerRoute({
  path: '/maestro/node/get/net/routespec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_routespec',
  exact: true,
  component: () => (<GetNetRoutespec/>)
});

import GetNetRoute from './node/get/net/route/Page';

registerRoute({
  path: '/maestro/node/get/net/route',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_route',
  exact: true,
  component: () => (<GetNetRoute/>)
});

import GetNetTimeserverspec from './node/get/net/timeserverspec/Page';

registerRoute({
  path: '/maestro/node/get/net/timeserverspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_timeserverspec',
  exact: true,
  component: () => (<GetNetTimeserverspec/>)
});

import GetNetTimeserver from './node/get/net/timeserver/Page';

registerRoute({
  path: '/maestro/node/get/net/timeserver',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_timeserver',
  exact: true,
  component: () => (<GetNetTimeserver/>)
});

import GetPerfCpustat from './node/get/perf/cpustat/Page';

registerRoute({
  path: '/maestro/node/get/perf/cpustat',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_perf_cpustat',
  exact: true,
  component: () => (<GetPerfCpustat/>)
});

import GetPerfMemorystat from './node/get/perf/memorystat/Page';

registerRoute({
  path: '/maestro/node/get/perf/memorystat',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_perf_memorystat',
  exact: true,
  component: () => (<GetPerfMemorystat/>)
});

import GetRuntimeDevicesstatus from './node/get/runtime/devicesstatus/Page';

registerRoute({
  path: '/maestro/node/get/runtime/devicesstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_devicesstatus',
  exact: true,
  component: () => (<GetRuntimeDevicesstatus/>)
});

import GetRuntimeDiagnostic from './node/get/runtime/diagnostic/Page';

registerRoute({
  path: '/maestro/node/get/runtime/diagnostic',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_diagnostic',
  exact: true,
  component: () => (<GetRuntimeDiagnostic/>)
});

import GetRuntimeEventsinkconfig from './node/get/runtime/eventsinkconfig/Page';

registerRoute({
  path: '/maestro/node/get/runtime/eventsinkconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_eventsinkconfig',
  exact: true,
  component: () => (<GetRuntimeEventsinkconfig/>)
});

import GetRuntimeExtensionserviceconfig from './node/get/runtime/extensionserviceconfig/Page';

registerRoute({
  path: '/maestro/node/get/runtime/extensionserviceconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_extensionserviceconfig',
  exact: true,
  component: () => (<GetRuntimeExtensionserviceconfig/>)
});

import GetRuntimeExtensionserviceconfigstatus from './node/get/runtime/extensionserviceconfigstatus/Page';

registerRoute({
  path: '/maestro/node/get/runtime/extensionserviceconfigstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_extensionserviceconfigstatus',
  exact: true,
  component: () => (<GetRuntimeExtensionserviceconfigstatus/>)
});

import GetRuntimeExtensions from './node/get/runtime/extensions/Page';

registerRoute({
  path: '/maestro/node/get/runtime/extensions',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_extensions',
  exact: true,
  component: () => (<GetRuntimeExtensions/>)
});

import GetRuntimeModules from './node/get/runtime/modules/Page';

registerRoute({
  path: '/maestro/node/get/runtime/modules',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_modules',
  exact: true,
  component: () => (<GetRuntimeModules/>)
});

import GetRuntimeKernelparamdefaultspec from './node/get/runtime/kernelparamdefaultspec/Page';

registerRoute({
  path: '/maestro/node/get/runtime/kernelparamdefaultspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_kernelparamdefaultspec',
  exact: true,
  component: () => (<GetRuntimeKernelparamdefaultspec/>)
});

import GetRuntimeKernelparamspec from './node/get/runtime/kernelparamspec/Page';

registerRoute({
  path: '/maestro/node/get/runtime/kernelparamspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_kernelparamspec',
  exact: true,
  component: () => (<GetRuntimeKernelparamspec/>)
});

import GetRuntimeSysctls from './node/get/runtime/sysctls/Page';

registerRoute({
  path: '/maestro/node/get/runtime/sysctls',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_sysctls',
  exact: true,
  component: () => (<GetRuntimeSysctls/>)
});

import GetRuntimeKmsglogconfig from './node/get/runtime/kmsglogconfig/Page';

registerRoute({
  path: '/maestro/node/get/runtime/kmsglogconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_kmsglogconfig',
  exact: true,
  component: () => (<GetRuntimeKmsglogconfig/>)
});

import GetRuntimeMachineresetsignal from './node/get/runtime/machineresetsignal/Page';

registerRoute({
  path: '/maestro/node/get/runtime/machineresetsignal',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_machineresetsignal',
  exact: true,
  component: () => (<GetRuntimeMachineresetsignal/>)
});

import GetRuntimeMachinestatus from './node/get/runtime/machinestatus/Page';

registerRoute({
  path: '/maestro/node/get/runtime/machinestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_machinestatus',
  exact: true,
  component: () => (<GetRuntimeMachinestatus/>)
});

import GetRuntimeMaintenanceserviceconfig from './node/get/runtime/maintenanceserviceconfig/Page';

registerRoute({
  path: '/maestro/node/get/runtime/maintenanceserviceconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_maintenanceserviceconfig',
  exact: true,
  component: () => (<GetRuntimeMaintenanceserviceconfig/>)
});

import GetRuntimeMaintenanceservicerequest from './node/get/runtime/maintenanceservicerequest/Page';

registerRoute({
  path: '/maestro/node/get/runtime/maintenanceservicerequest',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_maintenanceservicerequest',
  exact: true,
  component: () => (<GetRuntimeMaintenanceservicerequest/>)
});

import GetRuntimeMeta from './node/get/runtime/meta/Page';

registerRoute({
  path: '/maestro/node/get/runtime/meta',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_meta',
  exact: true,
  component: () => (<GetRuntimeMeta/>)
});

import GetRuntimeMetaload from './node/get/runtime/metaload/Page';

registerRoute({
  path: '/maestro/node/get/runtime/metaload',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_metaload',
  exact: true,
  component: () => (<GetRuntimeMetaload/>)
});

import GetRuntimeMounts from './node/get/runtime/mounts/Page';

registerRoute({
  path: '/maestro/node/get/runtime/mounts',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_mounts',
  exact: true,
  component: () => (<GetRuntimeMounts/>)
});

import GetRuntimePcidriverrebindconfig from './node/get/runtime/pcidriverrebindconfig/Page';

registerRoute({
  path: '/maestro/node/get/runtime/pcidriverrebindconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_pcidriverrebindconfig',
  exact: true,
  component: () => (<GetRuntimePcidriverrebindconfig/>)
});

import GetRuntimePcidriverrebinds from './node/get/runtime/pcidriverrebinds/Page';

registerRoute({
  path: '/maestro/node/get/runtime/pcidriverrebinds',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_pcidriverrebinds',
  exact: true,
  component: () => (<GetRuntimePcidriverrebinds/>)
});

import GetRuntimeUniquemachinetoken from './node/get/runtime/uniquemachinetoken/Page';

registerRoute({
  path: '/maestro/node/get/runtime/uniquemachinetoken',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_uniquemachinetoken',
  exact: true,
  component: () => (<GetRuntimeUniquemachinetoken/>)
});

import GetRuntimeVersion from './node/get/runtime/version/Page';

registerRoute({
  path: '/maestro/node/get/runtime/version',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_version',
  exact: true,
  component: () => (<GetRuntimeVersion/>)
});

import GetRuntimeWatchdogtimerconfig from './node/get/runtime/watchdogtimerconfig/Page';

registerRoute({
  path: '/maestro/node/get/runtime/watchdogtimerconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_watchdogtimerconfig',
  exact: true,
  component: () => (<GetRuntimeWatchdogtimerconfig/>)
});

import GetRuntimeWatchdogtimerstatus from './node/get/runtime/watchdogtimerstatus/Page';

registerRoute({
  path: '/maestro/node/get/runtime/watchdogtimerstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_watchdogtimerstatus',
  exact: true,
  component: () => (<GetRuntimeWatchdogtimerstatus/>)
});

import GetSecretsApicertificate from './node/get/secrets/apicertificate/Page';

registerRoute({
  path: '/maestro/node/get/secrets/apicertificate',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_apicertificate',
  exact: true,
  component: () => (<GetSecretsApicertificate/>)
});

import GetSecretsCertsan from './node/get/secrets/certsan/Page';

registerRoute({
  path: '/maestro/node/get/secrets/certsan',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_certsan',
  exact: true,
  component: () => (<GetSecretsCertsan/>)
});

import GetSecretsEtcdrootsecret from './node/get/secrets/etcdrootsecret/Page';

registerRoute({
  path: '/maestro/node/get/secrets/etcdrootsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_etcdrootsecret',
  exact: true,
  component: () => (<GetSecretsEtcdrootsecret/>)
});

import GetSecretsEtcdsecret from './node/get/secrets/etcdsecret/Page';

registerRoute({
  path: '/maestro/node/get/secrets/etcdsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_etcdsecret',
  exact: true,
  component: () => (<GetSecretsEtcdsecret/>)
});

import GetSecretsKubeletsecret from './node/get/secrets/kubeletsecret/Page';

registerRoute({
  path: '/maestro/node/get/secrets/kubeletsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubeletsecret',
  exact: true,
  component: () => (<GetSecretsKubeletsecret/>)
});

import GetSecretsKubernetesdynamiccert from './node/get/secrets/kubernetesdynamiccert/Page';

registerRoute({
  path: '/maestro/node/get/secrets/kubernetesdynamiccert',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubernetesdynamiccert',
  exact: true,
  component: () => (<GetSecretsKubernetesdynamiccert/>)
});

import GetSecretsKubernetesrootsecret from './node/get/secrets/kubernetesrootsecret/Page';

registerRoute({
  path: '/maestro/node/get/secrets/kubernetesrootsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubernetesrootsecret',
  exact: true,
  component: () => (<GetSecretsKubernetesrootsecret/>)
});

import GetSecretsKubernetessecret from './node/get/secrets/kubernetessecret/Page';

registerRoute({
  path: '/maestro/node/get/secrets/kubernetessecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubernetessecret',
  exact: true,
  component: () => (<GetSecretsKubernetessecret/>)
});

import GetSecretsMaintenancerootsecret from './node/get/secrets/maintenancerootsecret/Page';

registerRoute({
  path: '/maestro/node/get/secrets/maintenancerootsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_maintenancerootsecret',
  exact: true,
  component: () => (<GetSecretsMaintenancerootsecret/>)
});

import GetSecretsMaintenanceservicecertificate from './node/get/secrets/maintenanceservicecertificate/Page';

registerRoute({
  path: '/maestro/node/get/secrets/maintenanceservicecertificate',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_maintenanceservicecertificate',
  exact: true,
  component: () => (<GetSecretsMaintenanceservicecertificate/>)
});

import GetSecretsOsrootsecret from './node/get/secrets/osrootsecret/Page';

registerRoute({
  path: '/maestro/node/get/secrets/osrootsecret',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_osrootsecret',
  exact: true,
  component: () => (<GetSecretsOsrootsecret/>)
});

import GetSecretsTrustdcertificate from './node/get/secrets/trustdcertificate/Page';

registerRoute({
  path: '/maestro/node/get/secrets/trustdcertificate',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_trustdcertificate',
  exact: true,
  component: () => (<GetSecretsTrustdcertificate/>)
});

import GetSiderolinkSiderolinkconfig from './node/get/siderolink/siderolinkconfig/Page';

registerRoute({
  path: '/maestro/node/get/siderolink/siderolinkconfig',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_siderolink_siderolinkconfig',
  exact: true,
  component: () => (<GetSiderolinkSiderolinkconfig/>)
});

import GetSiderolinkSiderolinkstatus from './node/get/siderolink/siderolinkstatus/Page';

registerRoute({
  path: '/maestro/node/get/siderolink/siderolinkstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_siderolink_siderolinkstatus',
  exact: true,
  component: () => (<GetSiderolinkSiderolinkstatus/>)
});

import GetSiderolinkSiderolinktunnel from './node/get/siderolink/siderolinktunnel/Page';

registerRoute({
  path: '/maestro/node/get/siderolink/siderolinktunnel',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_siderolink_siderolinktunnel',
  exact: true,
  component: () => (<GetSiderolinkSiderolinktunnel/>)
});

import GetTalosPlatformmetadata from './node/get/talos/platformmetadata/Page';

registerRoute({
  path: '/maestro/node/get/talos/platformmetadata',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_talos_platformmetadata',
  exact: true,
  component: () => (<GetTalosPlatformmetadata/>)
});

import GetTalosSecuritystate from './node/get/talos/securitystate/Page';

registerRoute({
  path: '/maestro/node/get/talos/securitystate',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_talos_securitystate',
  exact: true,
  component: () => (<GetTalosSecuritystate/>)
});

import GetV1Alpha1Acquireconfigspec from './node/get/v1alpha1/acquireconfigspec/Page';

registerRoute({
  path: '/maestro/node/get/v1alpha1/acquireconfigspec',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_acquireconfigspec',
  exact: true,
  component: () => (<GetV1Alpha1Acquireconfigspec/>)
});

import GetV1Alpha1Acquireconfigstatus from './node/get/v1alpha1/acquireconfigstatus/Page';

registerRoute({
  path: '/maestro/node/get/v1alpha1/acquireconfigstatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_acquireconfigstatus',
  exact: true,
  component: () => (<GetV1Alpha1Acquireconfigstatus/>)
});

import GetV1Alpha1Adjtimestatus from './node/get/v1alpha1/adjtimestatus/Page';

registerRoute({
  path: '/maestro/node/get/v1alpha1/adjtimestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_adjtimestatus',
  exact: true,
  component: () => (<GetV1Alpha1Adjtimestatus/>)
});

import GetV1Alpha1Svc from './node/get/v1alpha1/svc/Page';

registerRoute({
  path: '/maestro/node/get/v1alpha1/svc',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_svc',
  exact: true,
  component: () => (<GetV1Alpha1Svc/>)
});

import GetV1Alpha1Timestatus from './node/get/v1alpha1/timestatus/Page';

registerRoute({
  path: '/maestro/node/get/v1alpha1/timestatus',
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_timestatus',
  exact: true,
  component: () => (<GetV1Alpha1Timestatus/>)
});


