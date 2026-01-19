import React from 'react';

const DownloadZipButton = ({controlplane, node}) => {
  const handleDownload = async () => {
    try {
      // Делаем запрос к REST API
      const talosURL = "http://localhost:5000/talosctl?e="+controlplane+"&n="+node+"&cmd=support";
//       alert(talosURL);
      const response = await fetch(talosURL, {
        method: 'GET',
        // headers: { /* например, Authorization: 'Bearer ...' */ }
      });

      if (!response.ok) {
        throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
      }

      // Получаем ответ как Blob (бинарные данные)
      const blob = await response.blob();

      // Создаём URL для скачивания
      const url = window.URL.createObjectURL(blob);

      // Создаём временный элемент <a>
      const a = document.createElement('a');
      a.href = url;
      a.download = 'support_' + node.replaceAll('.', '_') + '.zip'

      // Добавляем в DOM, кликаем, удаляем
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Освобождаем память
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Не удалось скачать ZIP-файл:', error);
      // Можно показать уведомление пользователю
    }
  };

  return (
    <button onClick={() => handleDownload()}>
      support
    </button>
  );
};

export default DownloadZipButton;
