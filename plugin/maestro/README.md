# maestro

headlamp-плугин maestro поддерживает UI-интерфейс к команде talosctl и:
- добавляет к headlamp набор WEB-страниц (UI-интерфейсы) для работы с kubetnetes развернутым под ОС ALTOrchestra/Talos;
- модифицирует основной интерфейс headlamp, добавляя на него ссылки на WEB-страницы maestro или дополняя страницы информацией, полученных от команды talosctl.

## Схема работы headlamp-плугина maestro

Так как headlamp-плугин maestro не может напрямую обращаться к talosctl создает [REST-интерфейс](https://altlinux.space/kaf/maestro/src/branch/main/api/flaskAPI.py) для:
- сканирования сети для получения списка узлов, развернутых под ОС ALTOrchestra/Talos;
- обращения к talosctl для получения необходимой информации, подключению узлов к ALTOrchestra/Talos кластерам или создания новых кластеров.

## Главная страница 

![Главная страница](./Images/mainpahe.png)




<!--This is the default template README for [Headlamp Plugins](https://github.com/kubernetes-sigs/headlamp).

- The description of your plugin should go here.
- You should also edit the package.json file meta data (like name and description).

## Developing Headlamp plugins

For more information on developing Headlamp plugins, please refer to:

- [Getting Started](https://headlamp.dev/docs/latest/development/plugins/), How to create a new Headlamp plugin.
- [API Reference](https://headlamp.dev/docs/latest/development/api/), API documentation for what you can do
- [UI Component Storybook](https://headlamp.dev/docs/latest/development/frontend/#storybook), pre-existing components you can use when creating your plugin.
- [Plugin Examples](https://github.com/kubernetes-sigs/headlamp/tree/main/plugins/examples), Example plugins you can look at to see how it's done.
-->