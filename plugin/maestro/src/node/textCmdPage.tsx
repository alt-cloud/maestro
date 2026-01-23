import React, { useState, useEffect } from 'react';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { Box } from '@mui/material';
import {
  Paper
} from '@mui/material';


import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

// test than module loads
interface Cluster {
  id: number;
  name: string;
}

const TalosTextCmdInfo: React.FC<{ }> = ({  }) => {
  const [page, setPage] = useState(0);
  const [content, setContent] = useState<Cluster[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  // Парсим query параметры
  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(params.entries());
  }, [location.search]);

  const path = location.pathname.split('/');
  const indexNode = path.indexOf('node')
  const commands = path.slice(indexNode+1)
  const commandPath = commands.join('/')
  const fullCommand = commands.join(' ')
  // alert('PATH='+path+' fullCommand='+fullCommand);

  const cluster = queryParams.cluster;
  const controlplane = queryParams.controlplane;
  const node = queryParams.node;
  const nodeType = queryParams.type;

  useEffect(() => {
    // Если фича отключена — ничего не делаем

    // Создаём контроллер отмены
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const talosURL = "http://localhost:5000/talosctl?e="+controlplane+"&n="+node+"&cmd=" + commandPath;
//         alert(talosURL);
        const response = await fetch(talosURL, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal, // ← привязываем сигнал отмены
        });

        // Если запрос был отменён, response.json() не вызовется
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const restReply: ApiResponse = await response.json();
//         alert(JSON.stringify(restReply['content']));
        setContent(restReply['content'])
      } catch (err: any) {
        // Игнорируем ошибку отмены
        if (err.name === 'AbortError') {
//           alert('Fetch aborted');
          console.debug('Fetch aborted');
          return;
        }
        setError(err.message || 'Failed to load data');
      } finally {
        // Убираем состояние загрузки, даже если запрос отменили или упал
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup: отменяем запрос при размонтировании или повторном запуске эффекта
    return () => {
      controller.abort();
    };
  }, []);

  if (loading) return <div>Loading cluster map...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!content) return <div>No data received</div>;
//   alert('CONTENT='+content);
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

//   const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setRowsPerPage(+event.target.value);
//     setPage(0);
//   };
//
//   const handleSort = (property: keyof Cluster) => {
//     const isAsc = orderBy === property && order === 'asc';
//     setOrder(isAsc ? 'desc' : 'asc');
//     setOrderBy(property);
//   };
//
//   const sortedRows = [...rows].sort((a, b) => {
//     if (a[orderBy] < b[orderBy]) return order === 'asc' ? -1 : 1;
//     if (a[orderBy] > b[orderBy]) return order === 'asc' ? 1 : -1;
//     return 0;
//   });

//   const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

//   alert('paginatedRows='+JSON.stringify(paginatedRows, null, 2));
//   alert('columns='+JSON.stringify(columns, null, 2));

  return (
  <SectionBox>
  <Typography><Link to="/maestro">Clusters</Link
  >&nbsp;/&nbsp;<Link to={`/maestro?cluster=${cluster}`}>{cluster}</Link
  > &nbsp;/&nbsp;<Link to={`/maestro/?cluster=${cluster}&type=${nodeType}`}>{nodeType}</Link
  >&nbsp;/&nbsp;<Link to={`/maestro/node?cluster=${cluster}&type=${nodeType}&controlplane=${controlplane}&node=${node}`}>{node}</Link
  >&nbsp;/&nbsp;{fullCommand}</Typography>
    <Paper>
      <Box sx={{ maxHeight: 'calc(100vh - 120px)', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
        {content}
      </Box>
    </Paper>
  </SectionBox>
  );
}

export default TalosTextCmdInfo;
