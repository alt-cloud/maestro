# Описание вариантов развёртывания образа разработчика altlinux.space/alt-orchestra-dev/maestro-dev 

## Структура каталогов

В данном документе описаны следующие варианты развёртывания образа: 
```
├── docker
│   ├── inet
│   └── localhost
├── docker_compose
│   ├── inet
│   └── localhost
└── podman
    ├── inet
    └── localhost
```
Для каждого варианта (`docker`. `docker-compose`, `podman`) реализованы подварианты:
- `localhost` - вариант разворачивания на компьютере администратора с доступом только как администратора, так и других возможных пользователей по протоколу `http` через локальный интерфейс `lo` (наиболее защищенный вариант).
- `inet` - вариант разворачивания на компьютере администратора или на сервере в локальной сети с доступом как администратора, так и других возможных пользователей по протоколу `https` через сетевой интерфейс.

## Reverse Proxy caddy для обеспечения доступа по протоколу https и локальной и внешней сети

Для доступа по протоколу `https` на компьютере устанавливается reverse proxy `caddy`:
```sh
apt-get install caddy
systemctl enable --now caddy
```
`Caddy` выполняет две функции:
- обеспечение доступа `web` и `backend` -интерфейсу по адресу `127.0.0.1:4466` `headlamp`, `API` интерфейсу maestro по адресу `127.0.0.1:5000`;
- ограничение  доступа к этим интерфейсам  только по указанным IP-адресам.

Файл конфигурации `/etc/caddy/Caddyfile` настраивается скриптом [tuneCaddy.sh](./tuneCaddy.sh).
Первым параметром ему передаётся имя файла-шаблона [Caddyfile.template](./Caddyfile.template).
Остальные параметры - список IP-адресов с которых возможен доступ.
На данный момент предполагается, что доступ по протоколу `https` осуществляется по доменам и портам:
- `https://www.maestro.local(:443)` - `WEB`-интерфейс `headlamp`/`maestro`;
- `https://api.maestro.local:5443` - `API`- интерфейс `maestro`.

При необходимости можно их поменять на другие значения.

## Описание общих переменных

Общие переменные описываются в файле [envVars.sh](./envVars.sh).

Переменные `DOCKER_NETS`, `PODMAN_NETS` описывают стандартные сети для `docker` и `podman` контейнеров.
Если Вы их переопределили и используете нестандартные значения - измените их в указанных переменных.
Содержимое переменных должно начинаться с запятой (`,`), так как этот список дополняется к существующему.

Переменные `HTTPS_CORS_ORIGIN`, `MAESTRO_API_URL` содержат домены с портами доступа к `frontend` (адрес, указываемый в браузере) и `API`- интерфейсу `maestro`. Так как оба интерфейса должны иметь один и то же IP-адрес, домены могут совпадать.
Порты должны совпадать с портами, указанными в файле `Caddyfile.template` конфигурации `caddy`.
Содержимое переменных должно начинаться с запятой (`,`), так как этот список дополняется к существующему.

В переменной `MAESTRO_API_KEYS` необходимо при развертывании указать свои ключи. Если ключ имеет поле `expires_at` необходимо по истечении указанного времени  обновлять значение ключа и поле `expires_at`.

Переменная `INET_API_WHITELIST` содержит список адресов сетей с которых возможен доступ.
Содержимое переменной должно начинаться с запятой (`,`), так как этот список дополняется к существующему.

## Описание типов развёртывания 

### 1. Docker (классический запуск через скрипт)
**Расположение:** `deployments/docker/` (с подвариантами `localhost/` и `inet/`)  
**Основной файл:** `maestro-docker.sh`

**Как использовать:**
```bash
cd deployments/docker/localhost  # или inet
./maestro-docker.sh up   # запуск контейнера
./maestro-docker.sh down # остановка и удаление контейнера
```

**Особенности:**
- Скрипт автоматически определяет имя проекта с помощью утилиты `getProjectName.sh` (на основе имени текущей директории).
- Контейнер запускается от имени текущего пользователя: переменные `MAESTRO_API_USER`, `MAESTRO_API_UID` и `MAESTRO_API_GID` вычисляются динамически через `id -u` и `id -g`.
- **Порты:** пробрасываются только на локальный интерфейс (`127.0.0.1:4466:4466` и `127.0.0.1:5000:5000`) в целях безопасности.
- **Тома (volumes):** монтируются директории `~/.maestro`, `~/.kube` .
- Перед запуском вызывается скрипт `tuneCaddy.sh`, который обновляет конфигурацию обратного прокси Caddy (`/etc/caddy/Caddyfile`), добавляя разрешённые подсети в правило `@blocked not remote_ip`, и перезапускает службу `caddy`.
- В поддиректориях `localhost` и `inet` хранятся файлы `.env`, которые уточняют значения `MAESTRO_CORS_ORIGINS` и `MAESTRO_API_WHITELIST` (с использованием переменной `DOCKER_NETS=172.16.0.0/12`).

### 2. Docker Compose
**Расположение:** `deployments/docker_compose/` (с подвариантами `localhost/` и `inet/`)  
**Основные файлы:** `docker-compose.yml`, `maestro-docker-compose.sh`

**Как использовать:**
```bash
cd deployments/docker_compose/localhost  # или inet
./maestro-docker-compose.sh up   # запуск (выполняет docker compose up -d)
./maestro-docker-compose.sh down # остановка
```

**Особенности:**
- Скрипт **запрещает** запуск от пользователя root (`UID=0`), требуя запуска от обычного пользователя.
- Подгружает глобальные переменные из `../../envVars.sh` и локальные из `.env`.
- Имя проекта передаётся в `docker compose` через флаг `-p $projectName`.
- Файл `docker-compose.yml` декларативно описывает сервис `maestro`:
  - Использует образ `altlinux.space/alt-orchestra-dev/maestro-dev:latest`.
  - Принимает переменные окружения (`MAESTRO_API_USER`, `MAESTRO_API_UID`, `MAESTRO_FRONTEBD_HOST`, `MAESTRO_API_HOST`, `MAESTRO_API_KEYS`, `MAESTRO_CORS_ORIGINS`, `MAESTRO_API_WHITELIST`).
  - Монтирует те же тома `~/.maestro` и `~/.kube`.
- Как и в первом варианте, перед запуском настраивается Caddy через `tuneCaddy.sh`.

### 3. Podman
**Расположение:** `deployments/podman/` (с подвариантами `localhost/` и `inet/`)  
**Основной файл:** `maestro-podman.sh`

**Как использовать:**
```bash
cd deployments/podman/localhost  # или inet
./maestro-podman.sh up   # запуск контейнера
./maestro-podman.sh down # остановка и удаление
```

**Особенности:**
- Полностью аналогичен логике Docker-скрипта, но использует команду `podman run` вместо `docker run`.
- **Специфичные возможности Podman:**
  - Добавлены дополнительные привилегии: `--cap-add CAP_NET_RAW` и `--cap-add CAP_NET_ADMIN`, необходимые для сетевых операций внутри контейнера.
  - Контейнер `podman` (в отличие от `docker`-контейнеров) запускается в `rootless`- режиме.
- В файлах `.env` для Podman (например, в `podman/inet/.env`) переменная `MAESTRO_API_WHITELIST` формируется с использованием `PODMAN_NETS=10.88.0.0/8` (стандартная подсеть Podman), в отличие от `DOCKER_NETS` (`172.16.0.0/12`).

---

### Общие вспомогательные механизмы (для всех вариантов)

1. **`envVars.sh`**: Центральный файл с глобальными настройками по умолчанию. Определяет:
   - `MAESTRO_API_KEYS`: JSON-массив с тестовыми API-ключами и правами (read, write, admin).
   - `DOCKER_NETS` и `PODMAN_NETS`: подсети по умолчанию для соответствующих движков.
   - `HTTPS_CORS_ORIGIN` и `MAESTRO_API_URL`: базовые URL для CORS и API.
2. **`getProjectName.sh`**: Функция, которая извлекает два последних компонента текущего пути (например, `docker-localhost` или `podman-inet`) и использует их как уникальное имя проекта/контейнера.
3. **`tuneCaddy.sh`**: Скрипт, который берет шаблон `Caddyfile.template`, добавляет в него разрешенные IP-адреса (из `$MAESTRO_API_WHITELIST`) и применяет конфигурацию через `systemctl reload-or-restart caddy`.

### Рекомендация по выбору
- Используйте **Docker Compose**, если вам нужна декларативность, простота управления зависимостями и стандартный подход для CI/CD или локальной разработки.
- Используйте **Docker (скрипт)** или **Podman**, если требуется максимальный контроль над параметрами запуска `run`, специфичные сетевые привилегии (CAP_NET_ADMIN) или если в вашей среде предпочтителен daemonless-подход (Podman).

## Использование образа при отладке с примонтированным из HOST системы отлаживамым исходным кодом

Образ включает в себя исходные коды `frontend` и `api-server` `meastro`.
В то же время Вы можете примонтировать собственный исходные коды из HOST-системы и использовать их для отладки кода.

### Монтироваение каталога исходных кодов api-server maestro

При развёртывании в режиме `docker compose` в секцию `volumes` файла `docker-compose.yml` добавьте строку монтирования:
```yaml
services:
  maestro:
    ...
    volumes:
    ...
    - <тропа_до_каталога_исходные_кодов_maestro>/maestro_api/src:/home/maestro/maestro_api/src 
```
При развертывании в режиме `docker` или `podman` в скрипт `maestro-docker.sh` или `maestro-podman.sh` строку:
```yaml
    -v <тропа_до_каталога_исходные_кодов_maestro>/maestro_api/src:/home/maestro/maestro_api/src \
```

После изменений исходного кода в терминале HOST-системы перегрузите api-сервис в контейнере командой:
```sh
docker exec <имя_контейнера> killall maestro-api
```
для docker-развертывания или командой
```sh
podman exec <имя_контейнера> killall maestro-api
```
для podman-развертывания.

Для отображения изменений перегрузите WEB-страницу.


### Монтироваение каталога исходных кодов frontend headlamp плагина maestro

В каталоге `<тропа_до_каталога_исходные_кодов_maestro>/plugin/maestro` запустите скрипт
```sh
./start.sh
```
```
...
computing gzip size (0)...[vite-plugin-static-copy] Copied 4 items.
dist/main.js  ... kB │ gzip:... │ map: ...
built in ....
```

При развёртывании в режиме `docker compose` в секцию `volumes` файла `docker-compose.yml` добавьте строки монтирования:
```yaml
services:
  maestro:
    ...
    volumes:
    ...
    - <тропа_до_каталога_исходные_кодов_maestro>/plugin/maestro/dist:/usr/share/headlamp/plugins/maestro/ 
    - <тропа_до_каталога_исходные_кодов_maestro>/plugin/maestro/package.json:/usr/share/headlamp/plugins/maestro/package.json
```
При развертывании в режиме `docker` или `podman` в скрипт `maestro-docker.sh` или `maestro-podman.sh` строку:
```yaml
    -v <тропа_до_каталога_исходные_кодов_maestro>/plugin/maestro/dist:/usr/share/headlamp/plugins/maestro/ \
    -v <тропа_до_каталога_исходные_кодов_maestro>/plugin/maestro/package.json:/usr/share/headlamp/plugins/maestro/package.json
```

После изменений исходного кода 
на терминале, где запущен скрипт `start.sh` произойдет перекомпиляция файла `dist/main.js`.
Для отображения изменений перегрузите WEB-страницу.




