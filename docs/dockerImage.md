# Docker образ maestro-dev

Имя образа `altlinux.space/alt-orchestra-dev/maestro-dev`.

Образ содержит пакет `headlamp`, `frontend` и `backend` `maestro`.

## Dockerfile

URL: [Dockerfile](../Dockerfile)


## Переменные окружения

- `MAESTRO_API_HOST` - имя хоста или IP-адрес  на котором доступен REST API порт 5000. 
- `MAESTRO_API_KEYS` - JSON-строка описания API-ключей. Структура описана в документе [Secutity.md](Secutity.md) в разделе *Авторизация*.
- `MAESTRO_CORS_ORIGINS` - список `URL`'s (включая порты) которых возможен доступ к API-интерфейсу (URL содержащийся в строке адреса интерфейса браузера).
- `MAESTRO_API_WHITELIST` - список IP-адресов которых возможен доступ к API-интерфейсу (без указания портов).

## Контекст разворачивания

Docker образ вызывается от обычного пользователя. Вызов от суперпользователь (пока) не поддерживается.
Пользователь должен входить в группу `docker`.
Для вхождения в группу `docker` наберите команду
```sh
# usermod -aG docker <user>
```
и перевойдите в пользователя.

В данном документе описывается запуск образа через  `docker compose`. Запуск через `podman compose` (пока) не тестировалcя.
При вызове из `docker` должен быть установлен контекст `default`:
```sh
docker context use default
```
Пооверить состояние контекста можно командой:
```sh
docker context ls
```
``` 
NAME        DESCRIPTION                               DOCKER ENDPOINT                                ERROR
colima      colima                                    unix:///home/<user>/.colima/default/docker.sock   
default *   Current DOCKER_HOST based configuration   unix:///var/run/docker.sock ```
```

## Варианты разворачивания

Образ включает в себя оба компонента `maestro`:
- `maestro frontend` - плагин maestro, поддерживаюший в интерфейсе headlamp страницы для работы с kubernetes клстером и узлами Альт Орнестрации;
- `maestro API`- REST/API интерфейс, принимающий запросы от `maestro frontend`, выполняющий переданный запрос и возвращающий ему результат.  

В зависимости от места запуска компонента `maestro API` варианты разворачивания могут быть следующие:
- `maestro API` разворачивается на компьютере администратора на локальном интерейсе `lo` (localhost=127.0.0.1) с доступом из `maestro frontend` только по локальному интерфейсу (максимально защищенный режим);
- `maestro API` разворачивается на компьютере администратора на одном или нескольких интерфейсов локальной сети с доступом из `maestro frontend` из локальной или внешней сети;
- `maestro API` разворачивается на сервере локальной сети с удаленным доступом из `maestro frontend` как админстратора так и остальных клиентов. 

Кроме этого при запуске на компьютере администратора на локальном интерейсе (первые два варианта)
бывают ситуации, когда доступ из doicker-контейнера `maestro API` к узлам кластера Аль Оркестра закрыт файерволами.
Например при разворачивании на компьютере виртуальных машин в рамках `virt manager`. В этом случае контейне должен разворачиваться в режиме host - использование локальной сети HOST-системы (по умолчанию контейнеры равзорачиваются в режиме bridge - создание собстванной overlay-сети).  

Таким образм ниже рассматриывются следующее дерево вариантов разворачивания:
<pre>
├── localonly  
│   ├── bridge
│   └── host
├── localext
│   ├── bridge
│   └── host
└── ext
</pre>
В рамках каждого варианта при необходимости рассматриваются возможные среды разворичивания: `docker`, `podman`, `kubernetes`.


Пользователи, работающие из браузера через `maestro frontend` могут иметь различные права доступа: только на чтение, на чтение и запись. Это достигается раздачей им ключей с разрвчнами правами, сроком действия ключей и числу запросов в минуту к `maestro API`.

Все нижеприведенные варманты разворачивания располагаются в каталоге [/Docker/docker-composes/](../Docker/docker-composes/).
В режиме docker docker-сервисы поднимаются скриптом
[/Docker/docker-composes/maestro-docker-compose.sh](../Docker/docker-composes/maestro-docker-compose.sh):
<pre>
#!/bin/sh

function getProjectName() {
  ifs=$IFS;   IFS=/;set -- $(pwd);IFS=$ifs
  while [ $# -gt 0 -a "$1" != 'docker-composes' ]; do shift; done; shift
  ret=$1
  while [ $# -gt 1 ];  do shift; ret+="-$1";  done
  echo $ret
}

if [ $UID -eq 0 ]
then
  echo "Скрипт не может вызываться в пользователем с UID=0" >&2
  exit 1
fi
action=$1
case "$action" in
'up') action='up -d';break;;
'down') break;;
*) echo "Формат $0 up|down" >&2; exit 1
esac

export MAESTRO_API_USER=$USER
export MAESTRO_API_UID=$(id -u $MAESTRO_API_USER)
export MAESTRO_API_GID=$(id -g $MAESTRO_API_USER)
projectName=$(getProjectName)
docker compose -p $projectName $action
</pre>
Скрипт в каждом каталоге варианта имеет алиас на указанный скрипт.
Первым параметром передаются действия:
- `up` - поднять стек сервисов.
- `down` - опустить стек сервисов.

Скрипт:
- определяет имя запускающего пользователя, его `uid` и `git` и экпортирует их в переменных `MAESTRO_API_USER`, `MAESTRO_API_UID`, `MAESTRO_API_GID`;
- по катаалогу запуска хадает имя проекта;
- в зависимости от первого парамерта поднимает или опускает стек сервисов.

### Разворачивание Мaestro API и Мaestro frontend на компьютере администратора на локальном интерфейсе lo

#### Стандартный вариант разворачивания с overlay сетью

##### Файл .env

Файл [.env](../Docker/docker-composes/localonly/bridge/docker/.env):
```yaml
MAESTRO_API_KEYS='[
  {
    "key": "scope-read-write",
    "scopes": ["read", "write"],
    "rate_limit_per_minute": 60
  },
  {
    "key": "scope-read-expired",
    "scopes": ["read"],
    "rate_limit_per_minute": 10,
    "expires_at": "2026-07-01T00:00:00Z"
  },
  {
    "key": "scope-superadmin-key",
    "scopes": ["admin"],
    "rate_limit_per_minute": 1000
  }
]'
MAESTRO_CORS_ORIGINS=http://127.0.0.1:4466,http://localhost:4466,http://172.18.0.1:4466,http://172.19.0.1:4466,http://172.20.0.1:4466,http://172.21.0.1:4466,http://172.22.0.1:4466,http://172.23.0.1:4466
MAESTRO_API_WHITELIST=127.0.0.1,172.0.0.0/8
```
Переменная `MAESTRO_API_KEYS` содержит пример описания трех `API-ключей` с различными правами доступа, временем действия и ограничениями 
числа обращений в минуту.

Переменная `MAESTRO_CORS_ORIGINS` содержит список `URL`'s с которых возможен доступ к API-интерфейсу из браузера.
Значения `http://127.0.0.1:4466`,`http://localhost:4466` определяют список URL по которым доступен `frontend` из браузера.
Значения `http://172.18.0.1:4466, `...` определяют список overlay IP-адресов с которых разрешён доступ к API инткрфейсу.

Переменная `MAESTRO_API_WHITELIST` определяет список IP-адресов с которых возможен доступ к API-интерфейсу из браузера и других сетевых приложений (`curl`, `podman`, ...).

##### Файл docker-compose.yml

Файл [docker-compose.yml](../Docker/docker-composes/net_overlay/docker-compose.yml):
```yaml
services:
  maestro:
    image: altlinux.space/alt-orchestra-dev/maestro-dev:latest
    ports:
      - 127.0.0.1:4466:4466
      - 127.0.0.1:5000:5000
    environment:
      MAESTRO_API_USER: $MAESTRO_API_USER
      MAESTRO_API_UID: $MAESTRO_API_UID
      MAESTRO_FRONTEBD_HOST: 0.0.0.0
      MAESTRO_API_HOST: 0.0.0.0
      MAESTRO_API_KEYS: $MAESTRO_API_KEYS
      MAESTRO_CORS_ORIGINS: $MAESTRO_CORS_ORIGINS
      MAESTRO_API_WHITELIST: $MAESTRO_API_WHITELIST
    volumes:
      - /home/$MAESTRO_API_USER/.maestro:/home/maestro/.maestro
      - /home/$MAESTRO_API_USER/.kube:/home/maestro/.kube
```
Внутренние порты `4466`(`frontend`) и `5000` (`REST/API`) контейнера пробрасываются на интерфейс `localhost` (`127.0.0.1`) `HOST`-компьютера.
Это позволяет закрыть доступ к этим интерфейсам из локальной и внешней сети.

Так как IP-адрес интерфейса контейнера может быть любым, то переменные `MAESTRO_FRONTEBD_HOST`, `MAESTRO_API_HOST` имеет значение `0.0.0.0`.

Значения переменных `MAESTRO_API_KEYS`, `MAESTRO_CORS_ORIGINS`, `MAESTRO_API_WHITELIST` импортируются из файла `.env

Значения переменных `MAESTRO_API_USER`, `MAESTRO_API_UID` формируются из переменных среды скриптом `maestro-docker-compose.sh`, описанном выше.

Каталоги: 
- `/home/maestro/.maestro` - каталог конфигурации для `Maestro`; 
- `/home/maestro/.kube` - каталог конфигурации для `kubernetes`
монтируются на каталоги 
- `/home/$MAESTRO_API_USER/.maestro`
- `/home/$MAESTRO_API_USER/.kube`
контейнера.

Так как API интерфейс в контейнере запускается с `uid=$MAESTRO_API_UID`, `gid=$MAESTRO_API_GID пользователя`, запустившего контейнер он имеет права на запись и чтение указанных аталогов.

#### Стандартный вариант разворачивания с host сетью HOST системы

В ряде случаев (например при разворачивании на том же компьютере виртуальных машин в virt-manager) доступ из docker-контейнера из overlay-сети к виртуальным машинам закрыт. В этом случае необходимо запускать контейнеры в сетевом окружении HOST-машины. 

##### Файл .env

Файл [.env](../Docker/docker-composes/localonly/bridge/docker/.env):
```yaml
MAESTRO_API_KEYS='[
  {
    "key": "scope-read-write",
    "scopes": ["read", "write"],
    "rate_limit_per_minute": 60
  },
  {
    "key": "scope-read-expired",
    "scopes": ["read"],
    "rate_limit_per_minute": 10,
    "expires_at": "2026-07-01T00:00:00Z"
  },
  {
    "key": "scope-superadmin-key",
    "scopes": ["admin"],
    "rate_limit_per_minute": 1000
  }
]'
MAESTRO_CORS_ORIGINS=http://127.0.0.1:4466,http://localhost:4466
MAESTRO_API_WHITELIST=127.0.0.1
```
Так в этом варианте используется сетевой стек HOST-компьютера в переменных `MAESTRO_CORS_ORIGINS`, `MAESTRO_API_WHITELIST` адреса в подсети `172.0.0.0/8` отсутствуют.

##### Файл docker-compose.yml

Файл [docker-compose.yml](../Docker/docker-composes/net_host/docker-compose.yml):
```
services:
  maestro:
    image: altlinux.space/alt-orchestra-dev/maestro-dev:latest
    network_mode: host
    environment:
      MAESTRO_API_USER: $MAESTRO_API_USER
      MAESTRO_API_UID: $MAESTRO_API_UID
      MAESTRO_FRONTEBD_HOST: 127.0.0.1
      MAESTRO_API_HOST: 127.0.0.1
      MAESTRO_API_KEYS: $MAESTRO_API_KEYS
      MAESTRO_CORS_ORIGINS: $MAESTRO_CORS_ORIGINS
      MAESTRO_API_WHITELIST: $MAESTRO_API_WHITELIST
    volumes:
      - /home/$MAESTRO_API_USER/.maestro:/home/maestro/.maestro
      - /home/$MAESTRO_API_USER/.kube:/home/maestro/.kube
```

Элемент `network_mode: host` выносит внутренние порты контейнера в сетевой стек HOST-системы.
Локальный интерфейс HOST-системы совпадает с локальным интерфейсом контейнера. Так что переменнык `MAESTRO_API_HOST`, `MAESTRO_FRONTEBD_HOST`
устанавливается в значение `127.0.0.1`.

> Ситуация отсутствия доступа из docker-контейнеров к узлам кластера возникает в ситуации, когда узлы кластера развернуты в virt-manager и docker контейнеры запускаются на этом же хосте. Возникает она в блокировке трафика с узлов кластера по интерфейсу virbr0 другим сетям (включая docker0) HOST-системы. Данная проблема решается удалением nft-правила в цепочке guest_input сети libvirt_network.  
> Определите командой   
<pre> 
# nft -a list chain ip libvirt_network guest_input
</pre>  
> номер правила в цепочке guest_input и удалите её командрй
<pre> 
# nft delete rule ip libvirt_network guest_input handle <номмер правила>
</pre>

### Разворачивание Мaestro API и Мaestro frontend на компьютере администратора на интерфейах локальной сети

### Разворачивание maestro API на сервере локальной сети с удаленным доступом из maestro frontend






