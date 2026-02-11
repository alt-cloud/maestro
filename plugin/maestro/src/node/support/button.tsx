import React from 'react';

const DownloadZipButton = ({cluster, node}) => {
  const handleDownload = async () => {
    try {
      const talosURL = "http://localhost:5000/talosctl?cluster="+cluster+"&n="+node+"&cmd=support";
      const response = await fetch(talosURL, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'support_' + node.replaceAll('.', '_') + '.zip'

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Не удалось скачать ZIP-файл:', error);
    }
  };

  return (
    <button onClick={() => handleDownload()}>
      support
    </button>
  );
};

export default DownloadZipButton;
