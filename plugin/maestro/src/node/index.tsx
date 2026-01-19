import React, { useState, useEffect } from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

const MaestroNodePage: React.FC<{ }> = ({  }) => {
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

  return (
  <SectionBox title="Node Page" textAlign="left" paddingTop={2}>
    <Typography><Link to="/maestro">Clusters</Link
      >&nbsp;/&nbsp;<Link to={`/maestro?cluster=${cluster}`}>{cluster}</Link
      > &nbsp;/&nbsp;<Link to={`/maestro/?cluster=${cluster}&type=${nodeType}`}>{nodeType}</Link
      >&nbsp;/&nbsp;{node}</Typography>
    <ul>
      <li>
        <Link to={`/maestro/node/get?cluster=${cluster}&type=${nodeType}&controlplane=${controlplane}&node=${node}`}>get</Link>
      </li>
    </ul>
  </SectionBox>
  );
}

export default MaestroNodePage;
