import React from 'react';

const DownloadZipButton = ({cluster, node}) => {
  const handleDownload = async () => {
    try {
      // Send request to REST API
      const talosURL = "http://localhost:5000/talosctl?cluster="+cluster+"&n="+node+"&cmd=support";
//       alert(talosURL);
      const response = await fetch(talosURL, {
        method: 'GET',
        // headers: { /* e.g., Authorization: 'Bearer ...' */ }
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
      }

      // Read response as Blob (binary data)
      const blob = await response.blob();

      // Create object URL for download
      const url = window.URL.createObjectURL(blob);

      // Create temporary <a> element
      const a = document.createElement('a');
      a.href = url;
      a.download = 'support_' + node.replaceAll('.', '_') + '.zip'

      // Append to DOM, click, then remove
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Release memory
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Не удалось скачать ZIP-файл:', error);
      // Optionally show user-facing notification
    }
  };

  return (
    <button onClick={() => handleDownload()}>
      support
    </button>
  );
};

export default DownloadZipButton;
