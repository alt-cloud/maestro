import React, { useState, useEffect } from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel
} from '@mui/material';
import { Link } from 'react-router-dom';

import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

import datasRows from './Data.json';
import columnsList from './Columns.json';

interface Cluster {
  id: number;
  name: string;
}

interface Column {
  id: keyof Cluster;
  label: string;
  sortable?: boolean;
}

// Create columns list from file Columns.json
// First spec fields
// After meta fields
function createColumns(): Column[] {
  const columns: Column[] = [];
  for (const field of columnsList['spec']) {
    const column: Column = {id: 'spec_'+field, label: 'spec.'+field, sortable: true };
    columns.push(column);
  }
  for (const field of columnsList['meta']) {
    const column: Column = {id: 'meta_'+field, label: 'meta.'+field, sortable: true };
    columns.push(column);
  }

  return columns;
}

const columns = createColumns();
// alert(JSON.stringify(columns));

function createRows(dataRows) {
//   alert(JSON.stringify(dataRows));
  const rows = [];
  for (const dataRow of dataRows) {
//   alert(JSON.stringify(dataRow));
    const row = {};
    for (const field of columnsList['spec']) {
      if (field in dataRow['spec']) {
        row['spec_'+field] = dataRow['spec'][field];
      } else {
        row['spec_'+field] = '';
      }
    }
    for (const field of columnsList['meta']) {
      if (field in dataRow['metadata']) {
        row['meta_'+field] = dataRow['metadata'][field];
      } else {
        row['meta_'+field] = '';
      }
    }
    rows.push(row);
  }
//   alert(JSON.stringify(rows));
  return rows;
}

const GetBlockBlockDevice: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const location = useLocation();
  // Парсим query параметры
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

//   alert(JSON.stringify(data['192.168.122.33'], null, 2));
//   alert(JSON.stringify(queryParams));
  const dataRows = datasRows['192.168.122.33'];
  const Rows = createRows(dataRows);
//   alert(JSON.stringify(Rows));
  const [rows, setRows] = useState<Cluster[]>(Rows);
//   alert(JSON.stringify(rows));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState<keyof Cluster>('id');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleSort = (property: keyof Cluster) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1;
    if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);


  return (
  <SectionBox title="Talosctl get/block/blockdevice" textAlign="center" paddingTop={2}>
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map(column => (
                <TableCell key={column.id}>
                  {column.sortable ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map(row => (
              <TableRow key={row.id}>                <TableCell>{row.spec_devicePath}</TableCell>
                <TableCell>{row.spec_generation}</TableCell>
                <TableCell>{row.spec_major}</TableCell>
                <TableCell>{row.spec_minor}</TableCell>
                <TableCell>{row.spec_type}</TableCell>
                <TableCell>{row.spec_parent}</TableCell>
                <TableCell>{row.spec_partitionName}</TableCell>
                <TableCell>{row.spec_partitionNumber}</TableCell>

                <TableCell>{row.meta_created}</TableCell>
                <TableCell>{row.meta_id}</TableCell>
                <TableCell>{row.meta_namespace}</TableCell>
                <TableCell>{row.meta_owner}</TableCell>
                <TableCell>{row.meta_phase}</TableCell>
                <TableCell>{row.meta_type}</TableCell>
                <TableCell>{row.meta_updated}</TableCell>
                <TableCell>{row.meta_version}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  </SectionBox>
  );
}

export default GetBlockBlockDevice;
