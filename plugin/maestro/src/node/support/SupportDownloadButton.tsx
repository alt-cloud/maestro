import React from 'react';

interface SupportDownloadButtonProps {
  cluster?: string;
  node?: string;
}

const SupportDownloadButton = ({ cluster, node }: SupportDownloadButtonProps) => {
  const handleSupportDownload = async () => {
    try {
      const talosUrl = `http://localhost:5000/talosctl?cluster=${cluster}&n=${node}&cmd=support`;
      const response = await fetch(talosUrl, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `support_${(node || 'node').split('.').join('_')}.zip`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download ZIP file:', error);
    }
  };

  return (
    <button onClick={() => handleSupportDownload()}>
      support
    </button>
  );
};

export default SupportDownloadButton;
