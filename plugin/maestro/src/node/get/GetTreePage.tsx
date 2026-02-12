import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import resourceTree from './RDTree.json';

function GetTreePage() {
  const location = useLocation();
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);
  const cluster = queryParams.cluster;
  const controlPlane = queryParams.controlplane;
  const node = queryParams.node;
  const nodeType = queryParams.type;


  return (
    <SectionBox title="Talosctl get page tree" textAlign="center" paddingTop={2}>
      <Typography variant="h6"><Link to="/maestro">Clusters</Link
        >&nbsp;/&nbsp;<Link to={`/maestro?cluster=${cluster}`}>{cluster}</Link
        > &nbsp;/&nbsp;<Link to={`/maestro/?cluster=${cluster}&type=${nodeType}`}>{nodeType}</Link
        >&nbsp;/&nbsp;<Link to={`/maestro/node?cluster=${cluster}&type=${nodeType}&node=${node}`}>{node}</Link
        >&nbsp;/&nbsp;get</Typography>
      <ul>
        {Object.entries(resourceTree).map(([commandSet, commandGroup]) => (
          <li key={commandSet}>
            <strong>{commandGroup.name}:</strong>
            <ul>
            {commandGroup.commands.map(command => (
              <li key={command.id}>
                <Link
                  to={`/maestro/node/get/${commandSet}/${command.command}?cluster=${cluster}&controlplane=${controlPlane}&node=${node}&type=${nodeType}`} >
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

export default GetTreePage;
