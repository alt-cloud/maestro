import React, { useState, useEffect } from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import RDTree from './RDTree.json';

function showRDTree() {
//   alert(JSON.stringify(Object.entries(RDTree), null, 2));
  return (
    <SectionBox title="Talosctl get page" textAligvaluen="center" paddingTop={2}>
      <Typography>TALOSCTL GET CMD TREE</Typography>
    <ul>
      {Object.entries(RDTree).map(([key, value]) => (
        <li key={key}>
          <strong>{value.name}:</strong>
          <ul>
          {value.commands.map(command => (
            <li>
              <Link key={command.id} to={`/maestro/get/${key}/${command.command}`} >{command.name}</Link>
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
