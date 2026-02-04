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
  const controlplane = queryParams.controlplane;
  const node = queryParams.node;
  const nodeType = queryParams.type;
//   alert('CLUSTER=' + cluster + ' controlplane=' + controlplane + ' node=' + node + ' nodeType=' + nodeType);


  return (
    <SectionBox title="Talosctl get page tree" textAligvaluen="center" paddingTop={2}>
      <Typography variant="h6"><Link to="/maestro">Clusters</Link
        >&nbsp;/&nbsp;<Link to={`/maestro?cluster=${cluster}`}>{cluster}</Link
        > &nbsp;/&nbsp;<Link to={`/maestro/?cluster=${cluster}&type=${nodeType}`}>{nodeType}</Link
        >&nbsp;/&nbsp;<Link to={`/maestro/node?cluster=${cluster}&type=${nodeType}&node=${node}`}>{node}</Link
        >&nbsp;/&nbsp;get</Typography>
      <ul>
        {Object.entries(RDTree).map(([key, value]) => (
          <li key={key}>
            <strong>{value.name}:</strong>
            <ul>
            {value.commands.map(command => (
              <li>
                <Link key={command.id}
                  to={`/maestro/node/get/${key}/${command.command}?cluster=${cluster}&controlplane=${controlplane}&node=${node}&type=${nodeType}`} >
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
