import React, { useState, useEffect } from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

import RDTree from './RDTree.json';
function showRDTree() {
  const location = useLocation();
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);
//   alert(JSON.stringify(queryParams));
  const cluster = queryParams.cluster;
//   alert('CLUSTER=' + cluster);
  const controlplane = queryParams.controlplane;
  const node = queryParams.node;
  const nodeType = queryParams.type;
//   alert('CLUSTER=' + cluster + ' controlplane=' + controlplane + ' node=' + node + ' nodeType=' + nodeType);


  return (
    <SectionBox title="Talosctl get page tree" textAligvaluen="center" paddingTop={2}>
      <Typography><strong>Cluster:</strong> {cluster} <strong>Endpoint:</strong> {controlplane} <strong>Node:</strong> {node} <strong>Type:</strong> {nodeType}</Typography>
      <ul>
        {Object.entries(RDTree).map(([key, value]) => (
          <li key={key}>
            <strong>{value.name}:</strong>
            <ul>
            {value.commands.map(command => (
              <li>
                <Link key={command.id}
                  to={`/maestro/get/${key}/${command.command}?cluster=${cluster}&controlplane=${controlplane}&node=${node}&type=${nodeType}`} >
                {command.name}
                </Link>
              </li>
            ))}
            </ul>
          </li>
        ))}
      </ul>
    </SectionBox>
    );
}

export default showRDTree;
