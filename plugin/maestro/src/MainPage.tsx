import { useState } from 'react';
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

interface Cluster {
  id: number;
  name: string;
}

interface Column {
  id: keyof Cluster;
  label: string;
  sortable?: boolean;
}

const columns: Column[] = [
  { id: 'currentContext', label: 'Current', sortable: true },
  { id: 'clusterName', label: 'ClusterName', sortable: true },
  { id: 'controlplanes', label: 'Controlplanes', sortable: false },
  { id: 'workers', label: 'Workers', sortable: false }
];

function NodesLinks(pars) {
//   alert(JSON.stringify(pars))
  return (
    <TableCell sx={{ verticalAlign: 'top', whiteSpace: 'pre-line' }}>
      {pars.nodes.map((node, index) => (
        <><Link key={node} to="/maestro/node?cluster={pars.clusterName}&node={node}&type={pars.type}" >{node}</Link><br /></>
      ))}
    </TableCell>
  );
}

function MainPage() {
  const [rows, setRows] = useState<Cluster[]>([
    {
      id: "Maestro",
      currentContext: '*',
      clusterName: 'Maestro',
      controlplanes: ["192.168.122.33"],
      workers: ["192.168.122.33", "192.168.122.87"]
    },
    { id: "Cluster1", currentContext: '', clusterName: 'Cluster1',  'controlplanes': [], 'workers': []},
    { id: "NULL", currentContext: '', clusterName: 'NULL',  'controlplanes': [], 'workers': ["192.168.122.1"]},
  ]);
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
  <SectionBox title="MAESTRO" textAlign="left" paddingTop={2}>
    <Typography fontSize="24px" fontWeight="bold">Maestro section</Typography>
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
              <TableRow key={row.id}>
                <TableCell sx={{ verticalAlign: 'top' }}>{row.currentContext}</TableCell>
                <TableCell sx={{ verticalAlign: 'top' }}>{row.clusterName}</TableCell>
                <NodesLinks clusterName={row.clusterName} nodes={row.controlplanes} type='controlplane'/>
                <NodesLinks clusterName={row.clusterName} nodes={row.workers} type='worker'/>
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

export default MainPage;
