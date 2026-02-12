import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Button } from '@mui/material';
import React, { useState } from 'react';
import { buildServerUrl } from '../../../config/server';

interface SupportDownloadButtonProps {
  cluster?: string;
  node?: string;
}

const SupportDownloadButton = ({ cluster, node }: SupportDownloadButtonProps) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleSupportDownload = async () => {
    setIsDownloading(true);
    try {
      const talosUrl = `${buildServerUrl('/talosctl')}?cluster=${cluster}&n=${node}&cmd=support`;
      const response = await fetch(talosUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `support_${(node || 'node').split('.').join('_')}.zip`;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(t('support.downloadFailed'), error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button disabled={isDownloading} onClick={handleSupportDownload} size="small" variant="outlined">
      {isDownloading ? t('support.downloading') : t('support.downloadBundle')}
    </Button>
  );
};

export default SupportDownloadButton;
