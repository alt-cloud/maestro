import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { Button } from '@mui/material';
import React, { useState } from 'react';
import { apiClient } from '../../../shared/utils/apiClient';

interface SupportDownloadButtonProps {
  cluster?: string;
  node?: string;
}

const SupportDownloadButton = ({ cluster, node }: SupportDownloadButtonProps) => {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);
  const canDownload = Boolean(cluster && node);

  const handleSupportDownload = async () => {
    if (!cluster || !node) {
      return;
    }

    setIsDownloading(true);
    try {
      const blob = await apiClient.getBlob('/talosctl', {
        queryParams: {
          cluster,
          n: node,
          cmd: 'support',
        },
      });
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
    <Button disabled={isDownloading || !canDownload} onClick={handleSupportDownload} size="small" variant="outlined">
      {isDownloading ? t('support.downloading') : t('support.downloadBundle')}
    </Button>
  );
};

export default SupportDownloadButton;
