import React from 'react';

const DownloadZipButton = () => {
  const handleDownload = async () => {
    try {
      // Делаем запрос к REST API
      const response = await fetch('/api/export-data', {
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
      a.download = 'export.zip'; // имя файла при скачивании

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
    <button onClick={handleDownload}>
      Скачать ZIP
    </button>
  );
};

export default DownloadZipButton;
