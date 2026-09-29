# SPDX-FileCopyrightText: 2026 BaseALT LLC
#
# SPDX-License-Identifier: MPL-2.0

# Неизменяемые переменные

# Сеть используемая docker-контейнерами
export DOCKER_NETS=',172.16.0.0/12'

# Сеть используемая podman-контейнерами
export PODMAN_NETS=',10.88.0.0/8'

# Конфигурируемые переменные

# набор доменов с портами для векшнего доступа к frontend
export HTTPS_CORS_ORIGIN=',https://www.maestro.local'

# домен и порт API интерфейса maestro при работе из внешней сети
export MAESTRO_API_URL=https://api.maestro.local:5443

# Список IP-адресов с которых разрешается доступ к frontend, backend headlamp, API-интерфейсу maestro
# Данный список в отличие от вышеприведенных зависит от IP-адресов сети в нотором разворачивается maestro
# и должен конфигурироваться при разворачивании
export INET_API_WHITELIST=',10.150.7.0/24,192.168.100.0/24'


