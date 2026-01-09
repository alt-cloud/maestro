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
  name: 'backtoclusters',
  label: 'Back to Clusters',
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

