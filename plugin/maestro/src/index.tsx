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
import GetBlockBlockDevice from './get/block/blockdevice/Page';
import GetHardwareDevices from './get/hardware/devices/Page';

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
  label: 'Back to /',
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
  component: () => (
    <SectionBox title="Talosctl get page" textAlign="center" paddingTop={2}>
      <Typography>TALOSCTL GET PAGE</Typography>
    </SectionBox>
  ),
});
registerSidebarEntry({
  parent: null,
  name: 'get',
  label: 'GET',
  url: '/maestro/get',
  icon: 'MaestroIcon',
  sidebar: 'myplugin',
});


// GET/BLOCK Tree
registerRoute({
  path: '/maestro/get/block',
  sidebar: {
    item: 'maestro',
    sidebar: 'myplugin',
  },
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_get_block',
  exact: true,
  component: () => (
    <SectionBox title="Talosctl get/block page" textAlign="center" paddingTop={2}>
      <Typography>TALOSCTL GET/BLOCK PAGE</Typography>
    </SectionBox>
  ),
});
registerSidebarEntry({
//   parent: '/maestro/get',
  name: 'block',
  label: 'BLOCK',
  url: '/maestro/get/block',
  icon: 'MaestroIcon',
  sidebar: 'myplugin',
});

// GET/BLOCK/BLOCKDEVICE Tree
registerRoute({
  path: '/maestro/get/block/blockdevice',
  sidebar: {
    item: 'maestro',
    sidebar: 'myplugin',
  },
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_get_block_blockdevice',
  exact: true,
  component: () => (
    <GetBlockBlockDevice/>
  ),
});
registerSidebarEntry({
//   parent: '/maestro/get',
  name: 'blockdevice',
  label: 'BLOCKDEVICE',
  url: '/maestro/get/block/blockdevice',
  icon: 'MaestroIcon',
  sidebar: 'myplugin',
});

// GET/hardware/device Tree
registerRoute({
  path: '/maestro/get/hardware/devices',
  sidebar: {
    item: 'maestro',
    sidebar: 'myplugin',
  },
  useClusterURL: false,
  noAuthRequired: true, // No authentication is required to see the view
  name: 'maestro_get_hardware_devices',
  exact: true,
  component: () => (
    <GetHardwareDevices/>
  ),
});
registerSidebarEntry({
//   parent: '/maestro/get',
  name: 'hardwaredevices',
  label: 'HARDWAREDEVICES',
  url: '/maestro/get/hardware/devices',
  icon: 'MaestroIcon',
  sidebar: 'myplugin',
});
