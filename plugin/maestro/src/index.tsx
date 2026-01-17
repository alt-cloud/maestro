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
      <MaestroMainPage enabled={true} />
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

// GET Tree

registerSidebarEntry({
  parent: null,
  name: 'get',
  label: 'GET',
  url: '/maestro/get',
  icon: 'MaestroIcon',
  sidebar: 'myplugin',
});


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
  path: '/maestro/get',
  sidebar: {
    item: 'maestro',
    sidebar: 'myplugin',
  },
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_get',
//   id: 'maestro_get',
  exact: true,
  component: () => (<GetTree/>)});

import GetTree from './get/index';

// TALOSCTL GET IMPORTS
// TALOSCTL GET REGISTERROUTES
// GET/BLOCK/BLOCKDEVICE Tree

import GetBlockBlockdevice from './get/block/blockdevice/Page';

registerRoute({
  path: '/maestro/get/block/blockdevice',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_blockdevice',
  exact: true,
  component: () => (<GetBlockBlockdevice/>)
});

import GetBlockBlocksymlink from './get/block/blocksymlink/Page';

registerRoute({
  path: '/maestro/get/block/blocksymlink',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_blocksymlink',
  exact: true,
  component: () => (<GetBlockBlocksymlink/>)
});

import GetBlockDiscoveredvolume from './get/block/discoveredvolume/Page';

registerRoute({
  path: '/maestro/get/block/discoveredvolume',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_discoveredvolume',
  exact: true,
  component: () => (<GetBlockDiscoveredvolume/>)
});

import GetBlockDiscoveryrefreshrequest from './get/block/discoveryrefreshrequest/Page';

registerRoute({
  path: '/maestro/get/block/discoveryrefreshrequest',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_discoveryrefreshrequest',
  exact: true,
  component: () => (<GetBlockDiscoveryrefreshrequest/>)
});

import GetBlockDiscoveryrefreshstatus from './get/block/discoveryrefreshstatus/Page';

registerRoute({
  path: '/maestro/get/block/discoveryrefreshstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_discoveryrefreshstatus',
  exact: true,
  component: () => (<GetBlockDiscoveryrefreshstatus/>)
});

import GetBlockDisk from './get/block/disk/Page';

registerRoute({
  path: '/maestro/get/block/disk',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_disk',
  exact: true,
  component: () => (<GetBlockDisk/>)
});

import GetBlockMountrequest from './get/block/mountrequest/Page';

registerRoute({
  path: '/maestro/get/block/mountrequest',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_mountrequest',
  exact: true,
  component: () => (<GetBlockMountrequest/>)
});

import GetBlockMountstatus from './get/block/mountstatus/Page';

registerRoute({
  path: '/maestro/get/block/mountstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_mountstatus',
  exact: true,
  component: () => (<GetBlockMountstatus/>)
});

import GetBlockSystemdisk from './get/block/systemdisk/Page';

registerRoute({
  path: '/maestro/get/block/systemdisk',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_systemdisk',
  exact: true,
  component: () => (<GetBlockSystemdisk/>)
});

import GetBlockUserdiskconfigstatus from './get/block/userdiskconfigstatus/Page';

registerRoute({
  path: '/maestro/get/block/userdiskconfigstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_userdiskconfigstatus',
  exact: true,
  component: () => (<GetBlockUserdiskconfigstatus/>)
});

import GetBlockVolumeconfig from './get/block/volumeconfig/Page';

registerRoute({
  path: '/maestro/get/block/volumeconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumeconfig',
  exact: true,
  component: () => (<GetBlockVolumeconfig/>)
});

import GetBlockVolumelifecycle from './get/block/volumelifecycle/Page';

registerRoute({
  path: '/maestro/get/block/volumelifecycle',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumelifecycle',
  exact: true,
  component: () => (<GetBlockVolumelifecycle/>)
});

import GetBlockVolumemountrequest from './get/block/volumemountrequest/Page';

registerRoute({
  path: '/maestro/get/block/volumemountrequest',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumemountrequest',
  exact: true,
  component: () => (<GetBlockVolumemountrequest/>)
});

import GetBlockVolumemountstatus from './get/block/volumemountstatus/Page';

registerRoute({
  path: '/maestro/get/block/volumemountstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumemountstatus',
  exact: true,
  component: () => (<GetBlockVolumemountstatus/>)
});

import GetBlockVolumestatus from './get/block/volumestatus/Page';

registerRoute({
  path: '/maestro/get/block/volumestatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_block_volumestatus',
  exact: true,
  component: () => (<GetBlockVolumestatus/>)
});

import GetClusterAffiliate from './get/cluster/affiliate/Page';

registerRoute({
  path: '/maestro/get/cluster/affiliate',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_affiliate',
  exact: true,
  component: () => (<GetClusterAffiliate/>)
});

import GetClusterDiscoveryconfig from './get/cluster/discoveryconfig/Page';

registerRoute({
  path: '/maestro/get/cluster/discoveryconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_discoveryconfig',
  exact: true,
  component: () => (<GetClusterDiscoveryconfig/>)
});

import GetClusterIdentity from './get/cluster/identity/Page';

registerRoute({
  path: '/maestro/get/cluster/identity',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_identity',
  exact: true,
  component: () => (<GetClusterIdentity/>)
});

import GetClusterInfo from './get/cluster/info/Page';

registerRoute({
  path: '/maestro/get/cluster/info',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_info',
  exact: true,
  component: () => (<GetClusterInfo/>)
});

import GetClusterKubernetesaccessconfig from './get/cluster/kubernetesaccessconfig/Page';

registerRoute({
  path: '/maestro/get/cluster/kubernetesaccessconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_kubernetesaccessconfig',
  exact: true,
  component: () => (<GetClusterKubernetesaccessconfig/>)
});

import GetClusterMember from './get/cluster/member/Page';

registerRoute({
  path: '/maestro/get/cluster/member',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cluster_member',
  exact: true,
  component: () => (<GetClusterMember/>)
});

import GetConfigMachineconfig from './get/config/machineconfig/Page';

registerRoute({
  path: '/maestro/get/config/machineconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_config_machineconfig',
  exact: true,
  component: () => (<GetConfigMachineconfig/>)
});

import GetConfigMachinetype from './get/config/machinetype/Page';

registerRoute({
  path: '/maestro/get/config/machinetype',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_config_machinetype',
  exact: true,
  component: () => (<GetConfigMachinetype/>)
});

import GetCriImagecacheconfig from './get/cri/imagecacheconfig/Page';

registerRoute({
  path: '/maestro/get/cri/imagecacheconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cri_imagecacheconfig',
  exact: true,
  component: () => (<GetCriImagecacheconfig/>)
});

import GetCriRegistryconfig from './get/cri/registryconfig/Page';

registerRoute({
  path: '/maestro/get/cri/registryconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cri_registryconfig',
  exact: true,
  component: () => (<GetCriRegistryconfig/>)
});

import GetCriSeccompprofile from './get/cri/seccompprofile/Page';

registerRoute({
  path: '/maestro/get/cri/seccompprofile',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_cri_seccompprofile',
  exact: true,
  component: () => (<GetCriSeccompprofile/>)
});

import GetEtcdEtcdconfig from './get/etcd/etcdconfig/Page';

registerRoute({
  path: '/maestro/get/etcd/etcdconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_etcdconfig',
  exact: true,
  component: () => (<GetEtcdEtcdconfig/>)
});

import GetEtcdEtcdmember from './get/etcd/etcdmember/Page';

registerRoute({
  path: '/maestro/get/etcd/etcdmember',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_etcdmember',
  exact: true,
  component: () => (<GetEtcdEtcdmember/>)
});

import GetEtcdEtcdspec from './get/etcd/etcdspec/Page';

registerRoute({
  path: '/maestro/get/etcd/etcdspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_etcdspec',
  exact: true,
  component: () => (<GetEtcdEtcdspec/>)
});

import GetEtcdPkistatus from './get/etcd/pkistatus/Page';

registerRoute({
  path: '/maestro/get/etcd/pkistatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_etcd_pkistatus',
  exact: true,
  component: () => (<GetEtcdPkistatus/>)
});

import GetFilesEtcfilespec from './get/files/etcfilespec/Page';

registerRoute({
  path: '/maestro/get/files/etcfilespec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_files_etcfilespec',
  exact: true,
  component: () => (<GetFilesEtcfilespec/>)
});

import GetFilesEtcfilestatus from './get/files/etcfilestatus/Page';

registerRoute({
  path: '/maestro/get/files/etcfilestatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_files_etcfilestatus',
  exact: true,
  component: () => (<GetFilesEtcfilestatus/>)
});

import GetHardwareMemorymodules from './get/hardware/memorymodules/Page';

registerRoute({
  path: '/maestro/get/hardware/memorymodules',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_memorymodules',
  exact: true,
  component: () => (<GetHardwareMemorymodules/>)
});

import GetHardwareDevices from './get/hardware/devices/Page';

registerRoute({
  path: '/maestro/get/hardware/devices',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_devices',
  exact: true,
  component: () => (<GetHardwareDevices/>)
});

import GetHardwarePcrstatus from './get/hardware/pcrstatus/Page';

registerRoute({
  path: '/maestro/get/hardware/pcrstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_pcrstatus',
  exact: true,
  component: () => (<GetHardwarePcrstatus/>)
});

import GetHardwareCpus from './get/hardware/cpus/Page';

registerRoute({
  path: '/maestro/get/hardware/cpus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_cpus',
  exact: true,
  component: () => (<GetHardwareCpus/>)
});

import GetHardwareSysteminformation from './get/hardware/systeminformation/Page';

registerRoute({
  path: '/maestro/get/hardware/systeminformation',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_hardware_systeminformation',
  exact: true,
  component: () => (<GetHardwareSysteminformation/>)
});

import GetK8SNodeannotationspec from './get/k8s/nodeannotationspec/Page';

registerRoute({
  path: '/maestro/get/k8s/nodeannotationspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodeannotationspec',
  exact: true,
  component: () => (<GetK8SNodeannotationspec/>)
});

import GetK8SNodecordonedspec from './get/k8s/nodecordonedspec/Page';

registerRoute({
  path: '/maestro/get/k8s/nodecordonedspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodecordonedspec',
  exact: true,
  component: () => (<GetK8SNodecordonedspec/>)
});

import GetK8SNodelabelspec from './get/k8s/nodelabelspec/Page';

registerRoute({
  path: '/maestro/get/k8s/nodelabelspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodelabelspec',
  exact: true,
  component: () => (<GetK8SNodelabelspec/>)
});

import GetK8SNodetaintspec from './get/k8s/nodetaintspec/Page';

registerRoute({
  path: '/maestro/get/k8s/nodetaintspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_k8s_nodetaintspec',
  exact: true,
  component: () => (<GetK8SNodetaintspec/>)
});

import GetKubernetesAdmissioncontrolconfig from './get/kubernetes/admissioncontrolconfig/Page';

registerRoute({
  path: '/maestro/get/kubernetes/admissioncontrolconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_admissioncontrolconfig',
  exact: true,
  component: () => (<GetKubernetesAdmissioncontrolconfig/>)
});

import GetKubernetesApiserverconfig from './get/kubernetes/apiserverconfig/Page';

registerRoute({
  path: '/maestro/get/kubernetes/apiserverconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_apiserverconfig',
  exact: true,
  component: () => (<GetKubernetesApiserverconfig/>)
});

import GetKubernetesAuditpolicyconfig from './get/kubernetes/auditpolicyconfig/Page';

registerRoute({
  path: '/maestro/get/kubernetes/auditpolicyconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_auditpolicyconfig',
  exact: true,
  component: () => (<GetKubernetesAuditpolicyconfig/>)
});

import GetKubernetesAuthorizationconfig from './get/kubernetes/authorizationconfig/Page';

registerRoute({
  path: '/maestro/get/kubernetes/authorizationconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_authorizationconfig',
  exact: true,
  component: () => (<GetKubernetesAuthorizationconfig/>)
});

import GetKubernetesBootstrapmanifestsconfig from './get/kubernetes/bootstrapmanifestsconfig/Page';

registerRoute({
  path: '/maestro/get/kubernetes/bootstrapmanifestsconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_bootstrapmanifestsconfig',
  exact: true,
  component: () => (<GetKubernetesBootstrapmanifestsconfig/>)
});

import GetKubernetesConfigstatus from './get/kubernetes/configstatus/Page';

registerRoute({
  path: '/maestro/get/kubernetes/configstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_configstatus',
  exact: true,
  component: () => (<GetKubernetesConfigstatus/>)
});

import GetKubernetesControllermanagerconfig from './get/kubernetes/controllermanagerconfig/Page';

registerRoute({
  path: '/maestro/get/kubernetes/controllermanagerconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_controllermanagerconfig',
  exact: true,
  component: () => (<GetKubernetesControllermanagerconfig/>)
});

import GetKubernetesEndpoint from './get/kubernetes/endpoint/Page';

registerRoute({
  path: '/maestro/get/kubernetes/endpoint',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_endpoint',
  exact: true,
  component: () => (<GetKubernetesEndpoint/>)
});

import GetKubernetesExtramanifestsconfig from './get/kubernetes/extramanifestsconfig/Page';

registerRoute({
  path: '/maestro/get/kubernetes/extramanifestsconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_extramanifestsconfig',
  exact: true,
  component: () => (<GetKubernetesExtramanifestsconfig/>)
});

import GetKubernetesKubeletconfig from './get/kubernetes/kubeletconfig/Page';

registerRoute({
  path: '/maestro/get/kubernetes/kubeletconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeletconfig',
  exact: true,
  component: () => (<GetKubernetesKubeletconfig/>)
});

import GetKubernetesKubeletlifecycle from './get/kubernetes/kubeletlifecycle/Page';

registerRoute({
  path: '/maestro/get/kubernetes/kubeletlifecycle',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeletlifecycle',
  exact: true,
  component: () => (<GetKubernetesKubeletlifecycle/>)
});

import GetKubernetesKubeletspec from './get/kubernetes/kubeletspec/Page';

registerRoute({
  path: '/maestro/get/kubernetes/kubeletspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeletspec',
  exact: true,
  component: () => (<GetKubernetesKubeletspec/>)
});

import GetKubernetesKubeprismconfig from './get/kubernetes/kubeprismconfig/Page';

registerRoute({
  path: '/maestro/get/kubernetes/kubeprismconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeprismconfig',
  exact: true,
  component: () => (<GetKubernetesKubeprismconfig/>)
});

import GetKubernetesKubeprismendpoint from './get/kubernetes/kubeprismendpoint/Page';

registerRoute({
  path: '/maestro/get/kubernetes/kubeprismendpoint',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeprismendpoint',
  exact: true,
  component: () => (<GetKubernetesKubeprismendpoint/>)
});

import GetKubernetesKubeprismstatus from './get/kubernetes/kubeprismstatus/Page';

registerRoute({
  path: '/maestro/get/kubernetes/kubeprismstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_kubeprismstatus',
  exact: true,
  component: () => (<GetKubernetesKubeprismstatus/>)
});

import GetKubernetesManifest from './get/kubernetes/manifest/Page';

registerRoute({
  path: '/maestro/get/kubernetes/manifest',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_manifest',
  exact: true,
  component: () => (<GetKubernetesManifest/>)
});

import GetKubernetesManifeststatus from './get/kubernetes/manifeststatus/Page';

registerRoute({
  path: '/maestro/get/kubernetes/manifeststatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_manifeststatus',
  exact: true,
  component: () => (<GetKubernetesManifeststatus/>)
});

import GetKubernetesNodeipconfig from './get/kubernetes/nodeipconfig/Page';

registerRoute({
  path: '/maestro/get/kubernetes/nodeipconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodeipconfig',
  exact: true,
  component: () => (<GetKubernetesNodeipconfig/>)
});

import GetKubernetesNodeip from './get/kubernetes/nodeip/Page';

registerRoute({
  path: '/maestro/get/kubernetes/nodeip',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodeip',
  exact: true,
  component: () => (<GetKubernetesNodeip/>)
});

import GetKubernetesNodename from './get/kubernetes/nodename/Page';

registerRoute({
  path: '/maestro/get/kubernetes/nodename',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodename',
  exact: true,
  component: () => (<GetKubernetesNodename/>)
});

import GetKubernetesNodestatus from './get/kubernetes/nodestatus/Page';

registerRoute({
  path: '/maestro/get/kubernetes/nodestatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_nodestatus',
  exact: true,
  component: () => (<GetKubernetesNodestatus/>)
});

import GetKubernetesSchedulerconfig from './get/kubernetes/schedulerconfig/Page';

registerRoute({
  path: '/maestro/get/kubernetes/schedulerconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_schedulerconfig',
  exact: true,
  component: () => (<GetKubernetesSchedulerconfig/>)
});

import GetKubernetesSecretstatus from './get/kubernetes/secretstatus/Page';

registerRoute({
  path: '/maestro/get/kubernetes/secretstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_secretstatus',
  exact: true,
  component: () => (<GetKubernetesSecretstatus/>)
});

import GetKubernetesStaticpod from './get/kubernetes/staticpod/Page';

registerRoute({
  path: '/maestro/get/kubernetes/staticpod',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_staticpod',
  exact: true,
  component: () => (<GetKubernetesStaticpod/>)
});

import GetKubernetesStaticpodserverstatus from './get/kubernetes/staticpodserverstatus/Page';

registerRoute({
  path: '/maestro/get/kubernetes/staticpodserverstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_staticpodserverstatus',
  exact: true,
  component: () => (<GetKubernetesStaticpodserverstatus/>)
});

import GetKubernetesPodstatus from './get/kubernetes/podstatus/Page';

registerRoute({
  path: '/maestro/get/kubernetes/podstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubernetes_podstatus',
  exact: true,
  component: () => (<GetKubernetesPodstatus/>)
});

import GetKubespanKubespanconfig from './get/kubespan/kubespanconfig/Page';

registerRoute({
  path: '/maestro/get/kubespan/kubespanconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanconfig',
  exact: true,
  component: () => (<GetKubespanKubespanconfig/>)
});

import GetKubespanKubespanendpoint from './get/kubespan/kubespanendpoint/Page';

registerRoute({
  path: '/maestro/get/kubespan/kubespanendpoint',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanendpoint',
  exact: true,
  component: () => (<GetKubespanKubespanendpoint/>)
});

import GetKubespanKubespanidentity from './get/kubespan/kubespanidentity/Page';

registerRoute({
  path: '/maestro/get/kubespan/kubespanidentity',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanidentity',
  exact: true,
  component: () => (<GetKubespanKubespanidentity/>)
});

import GetKubespanKubespanpeerspec from './get/kubespan/kubespanpeerspec/Page';

registerRoute({
  path: '/maestro/get/kubespan/kubespanpeerspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanpeerspec',
  exact: true,
  component: () => (<GetKubespanKubespanpeerspec/>)
});

import GetKubespanKubespanpeerstatus from './get/kubespan/kubespanpeerstatus/Page';

registerRoute({
  path: '/maestro/get/kubespan/kubespanpeerstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_kubespan_kubespanpeerstatus',
  exact: true,
  component: () => (<GetKubespanKubespanpeerstatus/>)
});

import GetMetaNs from './get/meta/ns/Page';

registerRoute({
  path: '/maestro/get/meta/ns',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_meta_ns',
  exact: true,
  component: () => (<GetMetaNs/>)
});

import GetMetaApi_Resources from './get/meta/api-resources/Page';

registerRoute({
  path: '/maestro/get/meta/api-resources',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_meta_api-resources',
  exact: true,
  component: () => (<GetMetaApi_Resources/>)
});

import GetNetAddressspec from './get/net/addressspec/Page';

registerRoute({
  path: '/maestro/get/net/addressspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_addressspec',
  exact: true,
  component: () => (<GetNetAddressspec/>)
});

import GetNetAddress from './get/net/address/Page';

registerRoute({
  path: '/maestro/get/net/address',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_address',
  exact: true,
  component: () => (<GetNetAddress/>)
});

import GetNetDeviceconfigspec from './get/net/deviceconfigspec/Page';

registerRoute({
  path: '/maestro/get/net/deviceconfigspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_deviceconfigspec',
  exact: true,
  component: () => (<GetNetDeviceconfigspec/>)
});

import GetNetDnsresolvecach from './get/net/dnsresolvecach/Page';

registerRoute({
  path: '/maestro/get/net/dnsresolvecach',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_dnsresolvecach',
  exact: true,
  component: () => (<GetNetDnsresolvecach/>)
});

import GetNetDnsupstream from './get/net/dnsupstream/Page';

registerRoute({
  path: '/maestro/get/net/dnsupstream',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_dnsupstream',
  exact: true,
  component: () => (<GetNetDnsupstream/>)
});

import GetNetEthernetspec from './get/net/ethernetspec/Page';

registerRoute({
  path: '/maestro/get/net/ethernetspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_ethernetspec',
  exact: true,
  component: () => (<GetNetEthernetspec/>)
});

import GetNetEthtool from './get/net/ethtool/Page';

registerRoute({
  path: '/maestro/get/net/ethtool',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_ethtool',
  exact: true,
  component: () => (<GetNetEthtool/>)
});

import GetNetHardwareaddress from './get/net/hardwareaddress/Page';

registerRoute({
  path: '/maestro/get/net/hardwareaddress',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hardwareaddress',
  exact: true,
  component: () => (<GetNetHardwareaddress/>)
});

import GetNetHostdnsconfig from './get/net/hostdnsconfig/Page';

registerRoute({
  path: '/maestro/get/net/hostdnsconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hostdnsconfig',
  exact: true,
  component: () => (<GetNetHostdnsconfig/>)
});

import GetNetHostnamespec from './get/net/hostnamespec/Page';

registerRoute({
  path: '/maestro/get/net/hostnamespec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hostnamespec',
  exact: true,
  component: () => (<GetNetHostnamespec/>)
});

import GetNetHostname from './get/net/hostname/Page';

registerRoute({
  path: '/maestro/get/net/hostname',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_hostname',
  exact: true,
  component: () => (<GetNetHostname/>)
});

import GetNetLinkrefresh from './get/net/linkrefresh/Page';

registerRoute({
  path: '/maestro/get/net/linkrefresh',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_linkrefresh',
  exact: true,
  component: () => (<GetNetLinkrefresh/>)
});

import GetNetLinkspec from './get/net/linkspec/Page';

registerRoute({
  path: '/maestro/get/net/linkspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_linkspec',
  exact: true,
  component: () => (<GetNetLinkspec/>)
});

import GetNetLink from './get/net/link/Page';

registerRoute({
  path: '/maestro/get/net/link',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_link',
  exact: true,
  component: () => (<GetNetLink/>)
});

import GetNetNetstatus from './get/net/netstatus/Page';

registerRoute({
  path: '/maestro/get/net/netstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_netstatus',
  exact: true,
  component: () => (<GetNetNetstatus/>)
});

import GetNetChain from './get/net/chain/Page';

registerRoute({
  path: '/maestro/get/net/chain',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_chain',
  exact: true,
  component: () => (<GetNetChain/>)
});

import GetNetNodeaddress from './get/net/nodeaddress/Page';

registerRoute({
  path: '/maestro/get/net/nodeaddress',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_nodeaddress',
  exact: true,
  component: () => (<GetNetNodeaddress/>)
});

import GetNetNodeaddressfilter from './get/net/nodeaddressfilter/Page';

registerRoute({
  path: '/maestro/get/net/nodeaddressfilter',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_nodeaddressfilter',
  exact: true,
  component: () => (<GetNetNodeaddressfilter/>)
});

import GetNetNodeaddresssortalgorithm from './get/net/nodeaddresssortalgorithm/Page';

registerRoute({
  path: '/maestro/get/net/nodeaddresssortalgorithm',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_nodeaddresssortalgorithm',
  exact: true,
  component: () => (<GetNetNodeaddresssortalgorithm/>)
});

import GetNetOperatorspec from './get/net/operatorspec/Page';

registerRoute({
  path: '/maestro/get/net/operatorspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_operatorspec',
  exact: true,
  component: () => (<GetNetOperatorspec/>)
});

import GetNetProbespec from './get/net/probespec/Page';

registerRoute({
  path: '/maestro/get/net/probespec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_probespec',
  exact: true,
  component: () => (<GetNetProbespec/>)
});

import GetNetProbe from './get/net/probe/Page';

registerRoute({
  path: '/maestro/get/net/probe',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_probe',
  exact: true,
  component: () => (<GetNetProbe/>)
});

import GetNetResolverspec from './get/net/resolverspec/Page';

registerRoute({
  path: '/maestro/get/net/resolverspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_resolverspec',
  exact: true,
  component: () => (<GetNetResolverspec/>)
});

import GetNetResolvers from './get/net/resolvers/Page';

registerRoute({
  path: '/maestro/get/net/resolvers',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_resolvers',
  exact: true,
  component: () => (<GetNetResolvers/>)
});

import GetNetRoutespec from './get/net/routespec/Page';

registerRoute({
  path: '/maestro/get/net/routespec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_routespec',
  exact: true,
  component: () => (<GetNetRoutespec/>)
});

import GetNetRoute from './get/net/route/Page';

registerRoute({
  path: '/maestro/get/net/route',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_route',
  exact: true,
  component: () => (<GetNetRoute/>)
});

import GetNetTimeserverspec from './get/net/timeserverspec/Page';

registerRoute({
  path: '/maestro/get/net/timeserverspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_timeserverspec',
  exact: true,
  component: () => (<GetNetTimeserverspec/>)
});

import GetNetTimeserver from './get/net/timeserver/Page';

registerRoute({
  path: '/maestro/get/net/timeserver',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_net_timeserver',
  exact: true,
  component: () => (<GetNetTimeserver/>)
});

import GetPerfCpustat from './get/perf/cpustat/Page';

registerRoute({
  path: '/maestro/get/perf/cpustat',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_perf_cpustat',
  exact: true,
  component: () => (<GetPerfCpustat/>)
});

import GetPerfMemorystat from './get/perf/memorystat/Page';

registerRoute({
  path: '/maestro/get/perf/memorystat',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_perf_memorystat',
  exact: true,
  component: () => (<GetPerfMemorystat/>)
});

import GetRuntimeDevicesstatus from './get/runtime/devicesstatus/Page';

registerRoute({
  path: '/maestro/get/runtime/devicesstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_devicesstatus',
  exact: true,
  component: () => (<GetRuntimeDevicesstatus/>)
});

import GetRuntimeDiagnostic from './get/runtime/diagnostic/Page';

registerRoute({
  path: '/maestro/get/runtime/diagnostic',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_diagnostic',
  exact: true,
  component: () => (<GetRuntimeDiagnostic/>)
});

import GetRuntimeEventsinkconfig from './get/runtime/eventsinkconfig/Page';

registerRoute({
  path: '/maestro/get/runtime/eventsinkconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_eventsinkconfig',
  exact: true,
  component: () => (<GetRuntimeEventsinkconfig/>)
});

import GetRuntimeExtensionserviceconfig from './get/runtime/extensionserviceconfig/Page';

registerRoute({
  path: '/maestro/get/runtime/extensionserviceconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_extensionserviceconfig',
  exact: true,
  component: () => (<GetRuntimeExtensionserviceconfig/>)
});

import GetRuntimeExtensionserviceconfigstatus from './get/runtime/extensionserviceconfigstatus/Page';

registerRoute({
  path: '/maestro/get/runtime/extensionserviceconfigstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_extensionserviceconfigstatus',
  exact: true,
  component: () => (<GetRuntimeExtensionserviceconfigstatus/>)
});

import GetRuntimeExtensions from './get/runtime/extensions/Page';

registerRoute({
  path: '/maestro/get/runtime/extensions',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_extensions',
  exact: true,
  component: () => (<GetRuntimeExtensions/>)
});

import GetRuntimeModules from './get/runtime/modules/Page';

registerRoute({
  path: '/maestro/get/runtime/modules',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_modules',
  exact: true,
  component: () => (<GetRuntimeModules/>)
});

import GetRuntimeKernelparamdefaultspec from './get/runtime/kernelparamdefaultspec/Page';

registerRoute({
  path: '/maestro/get/runtime/kernelparamdefaultspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_kernelparamdefaultspec',
  exact: true,
  component: () => (<GetRuntimeKernelparamdefaultspec/>)
});

import GetRuntimeKernelparamspec from './get/runtime/kernelparamspec/Page';

registerRoute({
  path: '/maestro/get/runtime/kernelparamspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_kernelparamspec',
  exact: true,
  component: () => (<GetRuntimeKernelparamspec/>)
});

import GetRuntimeSysctls from './get/runtime/sysctls/Page';

registerRoute({
  path: '/maestro/get/runtime/sysctls',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_sysctls',
  exact: true,
  component: () => (<GetRuntimeSysctls/>)
});

import GetRuntimeKmsglogconfig from './get/runtime/kmsglogconfig/Page';

registerRoute({
  path: '/maestro/get/runtime/kmsglogconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_kmsglogconfig',
  exact: true,
  component: () => (<GetRuntimeKmsglogconfig/>)
});

import GetRuntimeMachineresetsignal from './get/runtime/machineresetsignal/Page';

registerRoute({
  path: '/maestro/get/runtime/machineresetsignal',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_machineresetsignal',
  exact: true,
  component: () => (<GetRuntimeMachineresetsignal/>)
});

import GetRuntimeMachinestatus from './get/runtime/machinestatus/Page';

registerRoute({
  path: '/maestro/get/runtime/machinestatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_machinestatus',
  exact: true,
  component: () => (<GetRuntimeMachinestatus/>)
});

import GetRuntimeMaintenanceserviceconfig from './get/runtime/maintenanceserviceconfig/Page';

registerRoute({
  path: '/maestro/get/runtime/maintenanceserviceconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_maintenanceserviceconfig',
  exact: true,
  component: () => (<GetRuntimeMaintenanceserviceconfig/>)
});

import GetRuntimeMaintenanceservicerequest from './get/runtime/maintenanceservicerequest/Page';

registerRoute({
  path: '/maestro/get/runtime/maintenanceservicerequest',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_maintenanceservicerequest',
  exact: true,
  component: () => (<GetRuntimeMaintenanceservicerequest/>)
});

import GetRuntimeMeta from './get/runtime/meta/Page';

registerRoute({
  path: '/maestro/get/runtime/meta',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_meta',
  exact: true,
  component: () => (<GetRuntimeMeta/>)
});

import GetRuntimeMetaload from './get/runtime/metaload/Page';

registerRoute({
  path: '/maestro/get/runtime/metaload',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_metaload',
  exact: true,
  component: () => (<GetRuntimeMetaload/>)
});

import GetRuntimeMounts from './get/runtime/mounts/Page';

registerRoute({
  path: '/maestro/get/runtime/mounts',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_mounts',
  exact: true,
  component: () => (<GetRuntimeMounts/>)
});

import GetRuntimePcidriverrebindconfig from './get/runtime/pcidriverrebindconfig/Page';

registerRoute({
  path: '/maestro/get/runtime/pcidriverrebindconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_pcidriverrebindconfig',
  exact: true,
  component: () => (<GetRuntimePcidriverrebindconfig/>)
});

import GetRuntimePcidriverrebinds from './get/runtime/pcidriverrebinds/Page';

registerRoute({
  path: '/maestro/get/runtime/pcidriverrebinds',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_pcidriverrebinds',
  exact: true,
  component: () => (<GetRuntimePcidriverrebinds/>)
});

import GetRuntimeUniquemachinetoken from './get/runtime/uniquemachinetoken/Page';

registerRoute({
  path: '/maestro/get/runtime/uniquemachinetoken',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_uniquemachinetoken',
  exact: true,
  component: () => (<GetRuntimeUniquemachinetoken/>)
});

import GetRuntimeVersion from './get/runtime/version/Page';

registerRoute({
  path: '/maestro/get/runtime/version',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_version',
  exact: true,
  component: () => (<GetRuntimeVersion/>)
});

import GetRuntimeWatchdogtimerconfig from './get/runtime/watchdogtimerconfig/Page';

registerRoute({
  path: '/maestro/get/runtime/watchdogtimerconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_watchdogtimerconfig',
  exact: true,
  component: () => (<GetRuntimeWatchdogtimerconfig/>)
});

import GetRuntimeWatchdogtimerstatus from './get/runtime/watchdogtimerstatus/Page';

registerRoute({
  path: '/maestro/get/runtime/watchdogtimerstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_runtime_watchdogtimerstatus',
  exact: true,
  component: () => (<GetRuntimeWatchdogtimerstatus/>)
});

import GetSecretsApicertificate from './get/secrets/apicertificate/Page';

registerRoute({
  path: '/maestro/get/secrets/apicertificate',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_apicertificate',
  exact: true,
  component: () => (<GetSecretsApicertificate/>)
});

import GetSecretsCertsan from './get/secrets/certsan/Page';

registerRoute({
  path: '/maestro/get/secrets/certsan',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_certsan',
  exact: true,
  component: () => (<GetSecretsCertsan/>)
});

import GetSecretsEtcdrootsecret from './get/secrets/etcdrootsecret/Page';

registerRoute({
  path: '/maestro/get/secrets/etcdrootsecret',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_etcdrootsecret',
  exact: true,
  component: () => (<GetSecretsEtcdrootsecret/>)
});

import GetSecretsEtcdsecret from './get/secrets/etcdsecret/Page';

registerRoute({
  path: '/maestro/get/secrets/etcdsecret',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_etcdsecret',
  exact: true,
  component: () => (<GetSecretsEtcdsecret/>)
});

import GetSecretsKubeletsecret from './get/secrets/kubeletsecret/Page';

registerRoute({
  path: '/maestro/get/secrets/kubeletsecret',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubeletsecret',
  exact: true,
  component: () => (<GetSecretsKubeletsecret/>)
});

import GetSecretsKubernetesdynamiccert from './get/secrets/kubernetesdynamiccert/Page';

registerRoute({
  path: '/maestro/get/secrets/kubernetesdynamiccert',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubernetesdynamiccert',
  exact: true,
  component: () => (<GetSecretsKubernetesdynamiccert/>)
});

import GetSecretsKubernetesrootsecret from './get/secrets/kubernetesrootsecret/Page';

registerRoute({
  path: '/maestro/get/secrets/kubernetesrootsecret',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubernetesrootsecret',
  exact: true,
  component: () => (<GetSecretsKubernetesrootsecret/>)
});

import GetSecretsKubernetessecret from './get/secrets/kubernetessecret/Page';

registerRoute({
  path: '/maestro/get/secrets/kubernetessecret',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_kubernetessecret',
  exact: true,
  component: () => (<GetSecretsKubernetessecret/>)
});

import GetSecretsMaintenancerootsecret from './get/secrets/maintenancerootsecret/Page';

registerRoute({
  path: '/maestro/get/secrets/maintenancerootsecret',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_maintenancerootsecret',
  exact: true,
  component: () => (<GetSecretsMaintenancerootsecret/>)
});

import GetSecretsMaintenanceservicecertificate from './get/secrets/maintenanceservicecertificate/Page';

registerRoute({
  path: '/maestro/get/secrets/maintenanceservicecertificate',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_maintenanceservicecertificate',
  exact: true,
  component: () => (<GetSecretsMaintenanceservicecertificate/>)
});

import GetSecretsOsrootsecret from './get/secrets/osrootsecret/Page';

registerRoute({
  path: '/maestro/get/secrets/osrootsecret',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_osrootsecret',
  exact: true,
  component: () => (<GetSecretsOsrootsecret/>)
});

import GetSecretsTrustdcertificate from './get/secrets/trustdcertificate/Page';

registerRoute({
  path: '/maestro/get/secrets/trustdcertificate',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_secrets_trustdcertificate',
  exact: true,
  component: () => (<GetSecretsTrustdcertificate/>)
});

import GetSiderolinkSiderolinkconfig from './get/siderolink/siderolinkconfig/Page';

registerRoute({
  path: '/maestro/get/siderolink/siderolinkconfig',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_siderolink_siderolinkconfig',
  exact: true,
  component: () => (<GetSiderolinkSiderolinkconfig/>)
});

import GetSiderolinkSiderolinkstatus from './get/siderolink/siderolinkstatus/Page';

registerRoute({
  path: '/maestro/get/siderolink/siderolinkstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_siderolink_siderolinkstatus',
  exact: true,
  component: () => (<GetSiderolinkSiderolinkstatus/>)
});

import GetSiderolinkSiderolinktunnel from './get/siderolink/siderolinktunnel/Page';

registerRoute({
  path: '/maestro/get/siderolink/siderolinktunnel',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_siderolink_siderolinktunnel',
  exact: true,
  component: () => (<GetSiderolinkSiderolinktunnel/>)
});

import GetTalosPlatformmetadata from './get/talos/platformmetadata/Page';

registerRoute({
  path: '/maestro/get/talos/platformmetadata',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_talos_platformmetadata',
  exact: true,
  component: () => (<GetTalosPlatformmetadata/>)
});

import GetTalosSecuritystate from './get/talos/securitystate/Page';

registerRoute({
  path: '/maestro/get/talos/securitystate',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_talos_securitystate',
  exact: true,
  component: () => (<GetTalosSecuritystate/>)
});

import GetV1Alpha1Acquireconfigspec from './get/v1alpha1/acquireconfigspec/Page';

registerRoute({
  path: '/maestro/get/v1alpha1/acquireconfigspec',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_acquireconfigspec',
  exact: true,
  component: () => (<GetV1Alpha1Acquireconfigspec/>)
});

import GetV1Alpha1Acquireconfigstatus from './get/v1alpha1/acquireconfigstatus/Page';

registerRoute({
  path: '/maestro/get/v1alpha1/acquireconfigstatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_acquireconfigstatus',
  exact: true,
  component: () => (<GetV1Alpha1Acquireconfigstatus/>)
});

import GetV1Alpha1Adjtimestatus from './get/v1alpha1/adjtimestatus/Page';

registerRoute({
  path: '/maestro/get/v1alpha1/adjtimestatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_adjtimestatus',
  exact: true,
  component: () => (<GetV1Alpha1Adjtimestatus/>)
});

import GetV1Alpha1Svc from './get/v1alpha1/svc/Page';

registerRoute({
  path: '/maestro/get/v1alpha1/svc',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_svc',
  exact: true,
  component: () => (<GetV1Alpha1Svc/>)
});

import GetV1Alpha1Timestatus from './get/v1alpha1/timestatus/Page';

registerRoute({
  path: '/maestro/get/v1alpha1/timestatus',
  sidebar: {item: 'maestro', sidebar: 'myplugin'},
  useClusterURL: false,
  noAuthRequired: true,
  name: 'maestro_get_v1alpha1_timestatus',
  exact: true,
  component: () => (<GetV1Alpha1Timestatus/>)
});

