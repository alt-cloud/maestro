import parseSizeToBytes from './parseSizeToBytes';

export type TableRowData = Record<string, string>;

export interface Column {
  id: string;
  label: string;
  sortable?: boolean;
}

export function normalizeRowValue(value: unknown): string {
  if (value === null || typeof value === 'undefined') {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(item => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export function createFlatRows(dataRows: any[]): [Column[], TableRowData[]] {
  if (dataRows.length === 0) {
    return [[], []];
  }

  const columnNames = Object.keys(dataRows[0]);
  const columns: Column[] = columnNames.map(columnName => ({
    id: columnName,
    label: columnName,
    sortable: true,
  }));

  const rows = dataRows.map(row => {
    const normalizedRow: TableRowData = {};
    columnNames.forEach(columnName => {
      normalizedRow[columnName] = normalizeRowValue(row[columnName]);
    });
    return normalizedRow;
  });

  return [columns, rows];
}

export function sortTableRows(
  rows: TableRowData[],
  orderBy: string,
  order: 'asc' | 'desc'
): TableRowData[] {
  return [...rows].sort((a, b) => {
    const left = String(a[orderBy] ?? '');
    const right = String(b[orderBy] ?? '');
    const leftNumericValue = parseSizeToBytes(left);
    const rightNumericValue = parseSizeToBytes(right);

    let comparison = 0;

    if (leftNumericValue !== null && rightNumericValue !== null) {
      comparison = leftNumericValue - rightNumericValue;
      if (comparison === 0) {
        comparison = left.localeCompare(right);
      }
    } else if (leftNumericValue !== null) {
      comparison = -1;
    } else if (rightNumericValue !== null) {
      comparison = 1;
    } else {
      comparison = left.localeCompare(right);
    }

    return order === 'asc' ? comparison : -comparison;
  });
}
