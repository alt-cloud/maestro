import React, { useState, useEffect } from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { Box } from '@mui/material';
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
  const isControlPlane = (nodeType == 'controlplane');
//   alert('isControlPlane=' + isControlPlane);

  return (
<SectionBox title="Node Page" textAlign="left" paddingTop={2}>
  <Typography><Link to="/maestro">Clusters</Link
      >&nbsp;/&nbsp;<Link to={`/maestro?cluster=${cluster}`}>{cluster}</Link
      > &nbsp;/&nbsp;<Link to={`/maestro/?cluster=${cluster}&type=${nodeType}`}>{nodeType}</Link
      >&nbsp;/&nbsp;{node}
  </Typography>
  <Box sx={{ maxHeight: 'calc(100vh - 120px)', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
    <ul>
      <li>
        <Link to={`/maestro/node/get?cluster=${cluster}&type=${nodeType}&node=${node}`}>get</Link>
      </li>
      <li>
        <Link to={`/maestro/node/containers?cluster=${cluster}&type=${nodeType}&node=${node}`}>containers</Link>
      </li>
      <li>
        dashboard
      </li>
      <li>
        <Link to={`/maestro/node/dmesg?cluster=${cluster}&type=${nodeType}&node=${node}`}>dmesg</Link>
      </li>
      <li>
        edit
      </li>
      {isControlPlane ?
      <li>
        etcd
        <ul>
          <li>
            alarm
            <ul>
              <li>
                disarm
              </li>
              <li>
                list
              </li>
            </ul>
          </li>
          <li>
            downgrade
            <ul>
              <li>
                cancel
              </li>
              <li>
                enable
              </li>
              <li>
                validate
              </li>
            </ul>
          </li>
          <li>
            leave
          </li>
          <li>
            <Link to={`/maestro/node/etcd/members?cluster=${cluster}&type=${nodeType}&node=${node}`}>members</Link>
          </li>
          <li>
            remove-member
          </li>
          <li>
            snapshot
          </li>
          <li>
            <Link to={`/maestro/node/etcd/status?cluster=${cluster}&type=${nodeType}&node=${node}`}>status</Link>
          </li>
        </ul>
      </li>
      : <span/>}
      <li>
        events
      </li>
      <li>
        gen
        <ul>
          <li>
            ca
          </li>
          <li>
            config
          </li>
          <li>
            crt
          </li>
          <li>
            csr
          </li>
          <li>
            key
          </li>
          <li>
            keypair
          </li>
          <li>
            secrets
          </li>
          <li>
            secureboot
            <ul>
              <li>
                database
              </li>
              <li>
                pcr
              </li>
              <li>
                uki
              </li>
            </ul>
          </li>
        </ul>
      </li>
      <li>
        health
      </li>
      <li>
        image
        <ul>
          <li>
            cache-create
          </li>
          <li>
            <Link to={`/maestro/node/image/default?cluster=${cluster}&type=${nodeType}&node=${node}`}>default</Link>
          </li>
          <li>
            <Link to={`/maestro/node/image/list?cluster=${cluster}&type=${nodeType}&node=${node}`}>list</Link>
          </li>
          <li>
            pull
          </li>
        </ul>
      </li>
      <li>
        inject
          <ul>
            <li>
            serviceaccount
            </li>
          </ul>
      </li>
      <li>
        inspect
        <ul>
          <li>
            <Link to={`/maestro/node/inspect/dependencies?cluster=${cluster}&type=${nodeType}&node=${node}`}>dependencies</Link>
          </li>
        </ul>
      </li>
      <li>
        kubeconfig
      </li>
      <li>
        list
      </li>
{/*}
      <li>
        logs
      </li>
      <li>
        machineconfig
        <ul>
          <li>
            gen
          </li>
          <li>
            patch
          </li>
        </ul>
      </li>
{*/}
      <li>
        <Link to={`/maestro/node/memory?cluster=${cluster}&type=${nodeType}&node=${node}`}>memory</Link>
      </li>
      <li>
       meta
       <ul>
        <li>
          delete
        </li>
        <li>
          write
        </li>
       </ul>
      </li>
      <li>
        <Link to={`/maestro/node/mounts?cluster=${cluster}&type=${nodeType}&node=${node}`}>mounts</Link>
      </li>
      <li>
        <Link to={`/maestro/node/netstat?cluster=${cluster}&type=${nodeType}&node=${node}`}>netstat</Link>
      </li>
      <li>
        patch
      </li>
      <li>
        pcap
      </li>
      <li>
        <Link to={`/maestro/node/processes?cluster=${cluster}&type=${nodeType}&node=${node}`}>processes</Link>
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
        <Link to={`/maestro/node/service?cluster=${cluster}&type=${nodeType}&node=${node}`}>service</Link>
      </li>
      <li>
        shutdown
      </li>
      <li>
        <Link to={`/maestro/node/stats?cluster=${cluster}&type=${nodeType}&node=${node}`}>stats</Link>
      </li>
      <li>
        <DownloadZipButton cluster={cluster} node={node} />
      </li>
      <li>
        <Link to={`/maestro/node/time?cluster=${cluster}&type=${nodeType}&node=${node}`}>time</Link>
      </li>
      {/* */}
      <li>
        upgrade
      </li>
      <li>
        upgrade-k8s
      </li>
      <li>
        <Link to={`/maestro/node/usage?cluster=${cluster}&type=${nodeType}&node=${node}`}>usage</Link>
      </li>
      <li>
        validate
      </li>
      <li>
        <Link to={`/maestro/node/version?cluster=${cluster}&type=${nodeType}&node=${node}`}>version</Link>
      </li>
      <li>
        wipe
        <ul>
          <li>
            disk
          </li>
        </ul>
      </li>
    </ul>
  </Box>
  </SectionBox>
  );
}

export default MaestroNodePage;
