import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import React from 'react';

export interface IntervalOption {
  label: string;
  value: number | null;
}

interface RefreshIntervalControlProps {
  label?: string;
  value: number | null;
  options: readonly IntervalOption[];
  onChange: (value: number | null) => void;
}

function RefreshIntervalControl({
  label,
  value,
  options,
  onChange,
}: RefreshIntervalControlProps) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t('common.autoRefresh');

  const handleChange = (event: SelectChangeEvent<string>) => {
    const nextValue = event.target.value === 'null' ? null : Number(event.target.value);
    onChange(nextValue);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 180 }} variant="outlined">
      <InputLabel id="refresh-interval-label">{resolvedLabel}</InputLabel>
      <Select
        id="refresh-interval-select"
        label={resolvedLabel}
        labelId="refresh-interval-label"
        onChange={handleChange}
        value={value === null ? 'null' : String(value)}
      >
        {options.map(option => (
          <MenuItem key={option.value === null ? 'null' : String(option.value)} value={option.value === null ? 'null' : String(option.value)}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default RefreshIntervalControl;
