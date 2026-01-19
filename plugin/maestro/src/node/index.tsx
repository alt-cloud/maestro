import React, { useState, useEffect } from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

import DownloadZipButton from './support/button';

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
      <li>
        containers
      </li>
      <li>
        dashboard
      </li>
      <li>
        dmesg
      </li>
      <li>
        edit
      </li>
      <li>
        etcd
      </li>
      <li>
        events
      </li>
      <li>
        gen
      </li>
      <li>
        health
      </li>
      <li>
        image
      </li>
      <li>
        inspect dependencies
      </li>
      <li>
        kubeconfig
      </li>
      <li>
        list
      </li>
      <li>
        logs
      </li>
      <li>
        memory
      </li>
      <li>
       meta
      </li>
      <li>
        mounts
      </li>
      <li>
        netstat
      </li>
      <li>
        patch
      </li>
      <li>
        pcap
      </li>
      <li>
        processes
      </li>
      <li>
        read
      </li>
      <li>
        reboot
      </li>
      <li>
        reset
      </li>
      <li>
        restart
      </li>
      <li>
        rollback
      </li>
      <li>
        rotate-ca
      </li>
      <li>
        service
      </li>
      <li>
        shutdown
      </li>
      <li>
        stats
      </li>
      <li>
        <DownloadZipButton controlplane={controlplane} node={node} />
      </li>
      <li>
        time
      </li>
      <li>
        upgrade
      </li>
      <li>
        upgrade-k8s
      </li>
      <li>
        usage
      </li>
      <li>
        validate
      </li>
      <li>
        version
      </li>
      <li>
        wipe
      </li>
    </ul>
  </SectionBox>
  );
}

export default MaestroNodePage;
