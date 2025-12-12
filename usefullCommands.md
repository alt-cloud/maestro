# Полезные команды talosctl

Описание на странице [Talosctl CLI tool reference](https://docs.siderolabs.com/talos/v1.11/reference/cli).

- [apply-config](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-apply-config)

Уже используется при разворачивании кластера.

- [bootstrap](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-bootstrap)

Уже используется при разворачивании кластера.

- [cgroups](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-cgroups)

> Команда cgroups получает подробные сведения об использовании группы управления v2 (cgroupv2) с машины. Доступно несколько предустановок для фокусировки на конкретных подсистемах cgroup:
cpu, cpuset, io, memory, process, swap


> Вы можете указать предустановленную схему с помощью флага —preset. В качестве альтернативы, пользовательскую схему можно указать с помощью флага —schema-file. Примеры схем см. в соответствующем разделе. https://github.com/siderolabs/talos/tree/main/cmd/talosctl/cmd/talos/cgroupsprinter/schemas.

Надо разбираться.

- [cluster](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-cluster) 

Набор команд для управления локальными кластерами на основе Docker или QEMU.

* [cluster create](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-cluster-create)

>     Создает локальный кластер Kubernetes на основе Docker или QEMU.
      
      
      Надо тестировать.

  * [cluster destroy](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-cluster-destroy)

      Надо тестировать.

  * [cluster show](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-cluster-show)

      Надо тестировать.

- [config](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-config)

Управление файлом конфигурации клиента (talosconfig)

  * [config add](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-config-add)

  Добавить новый кластер (context).

  * [config context](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-config-context)

  Установить текущий кластер (context).

  * [config contexts](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-config-contexts)

  Вывести список текущих кластеров (contexts).

  * [config endpoint](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-config-endpoint)

  Установить текущий(е) endpoint(s).

  * [config info](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-config-info)

  Вывести информацию о текущем кластере (context).

  * [config merge](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-config-merge)

  Добавить описание других кластеров из указанного файла с текущим.

  * [config new](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-config-new)

  Сгенерировать новый фйал конфигурации.

  * [config node](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-config-node)

  Установить узел(лы) для текущего кластера.

  * [config remove](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-config-remove)

  Удалить контекcт(ы).


- [conformance kubernetes](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-conformance-kubernetes)

  Провести тест kubernetes на соответствие стандартам (около 400 тесов из 5000).

  - [containers](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-containers)

    Вывести список контейнеров.

- [copy](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-copy)

  Скопировать данные с узла. Создает архив .tar.gz на узле, начиная с пути к источнику, и передает его обратно клиенту. Если для локального пути указан символ '-', архив выводится в стандартный вывод. В противном случае архив извлекается в локальный путь, который должен быть пустой директорией, или talosctl создает директорию, если локальный путь не существует. Команда не сохраняет права собственности и режим доступа к файлам в режиме извлечения, в то время как при потоковой передаче архива .tar сохраняются права собственности и разрешения.

  - [dashboard](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-dashboard)

    Отображает панель мониторинга указанного узла кластера с обзором узлов, журналами и метриками в реальном времени.

- [dmesg](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-dmesg)

  Отображает логи ядра узла кластера.

- [edit](https://docs.siderolabs.com/talos/v1.11/reference/cli#alosctl-edit)

  Команда `edit` позволяет напрямую редактировать любой API-ресурс, доступный через инструменты командной строки. Она откроет редактор, определенный переменными среды `TALOS_EDITOR` или `EDITOR`

- [etcd alarm](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-etcd-alarm)

  Управление оповещений etcd для данного узла.

- [etcd alarm disarm](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-etcd-alarm-disarm)

  Отключите сигналы тревоги etcd для данного узла.

- [etcd alarm list](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-etcd-alarm-list)

  Вывести список оповещений etcd для данного узла.

- [etcd defrag](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-etcd-defrag)

  Дефрагментирует базу данных etcd на узле. Дефрагментация — это операция обслуживания, которая освобождает неиспользуемое пространство в файле базы данных etcd. Дефрагментация — ресурсоемкая операция, и ее следует выполнять только при необходимости на одном узле за раз.

- [etcd downgrade cancel](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-etcd-downgrade-cancel)

  Отменияет понижение версии системы хранения etcd.
  
- [etcd downgrade enable](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-etcd-downgrade-enable)

  Разрешает понижение версии системы хранения etcd до указанной.

- [etcd downgrade validate](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-etcd-downgrade-validate)

  Проверяет, можно ли понизить версию системы хранения etcd до указанной.

- [etcd downgrade](https://docs.siderolabs.com/talos/v1.11/reference/cli#alosctl-etcd-downgrade)

  Управляет понижением версии системы хранения etcd.

- [etcd forfeit-leadership](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-etcd-forfeit-leadership)

  Сообщить узлу, чтобы он отказался от лидерства в кластере etcd.

- [etcd leave](https://docs.siderolabs.com/talos/v1.11/reference/cli#alosctl-etcd-leave)

  Дать указание узлу покинуть кластер etcd.

- [etcd members](https://docs.siderolabs.com/talos/v1.11/reference/cli#alosctl-etcd-members)

  Получить список участников кластера etcd

- [etcd remove-member](https://docs.siderolabs.com/talos/v1.11/reference/cli#alosctl-etcd-remove-member)

  Удалить узел из кластера etcd. Используйте эту команду только в том случае, если хотите удалить участника, находящегося в нерабочем состоянии. Если к узлу нет доступа или узел не может получить доступ к etcd для вызова команды etcd leave, всегда отдавайте предпочтение команде `etcd leave` перед этой командой.

- [etcd snapshot](https://docs.siderolabs.com/talos/v1.11/reference/cli#alosctl-etcd-snapshot)

  Передать снимок состояния узла etcd в указанный каталог.

- [etcd status](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-etcd-status)

  Получить статус участника кластера etcd. Возвращает статус участника etcd на узле; для получения статуса всех участников используйте несколько узлов.

- [events](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-events)

  Получить текущий поток событий.

- [gen ca](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-gen-ca)

  Сгенерировать самоподписанный центр сертификации X.509.

- [gen config](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-gen-config)

  Сгенерировать набор конфигурационных файлов для кластера Talos. endpoint кластера  (флаг -e) — это URL-адрес API Kubernetes. Если вы решите использовать узел controlplane, что часто встречается в одноузловой конфигурации controlplane, используйте порт 6443, поскольку именно к этому порту привязывается API-сервер на каждом узле controlplane. Для конфигурации высокой доступности, обычно включающей балансировщик нагрузки, используйте IP-адрес и порт балансировщика нагрузки.

- [gen crt](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-gen-crt)

  Сгенерировать сертификат X.509 Ed25519

- [gen csr](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-gen-crt)

  Сгенерировать запрос на подписание сертификата (CSR) с использованием закрытого ключа Ed25519.

- [gen key](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-gen-key)

  Сгенерировать закрытый ключ Ed25519.

- [gen keypair](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-gen-keypair)

  Сгенерировать пару ключей X.509 Ed25519

- [gen secrets](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-gen-secrets)

  Создать файл пакета секретов, который впоследствии можно использовать для генерации конфигурации.

- [gen secureboot database](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-gen-secureboot-database)

  Создать базу данных UEFI для регистрации сертификата подписи.

- [gen secureboot pcr](https://docs.siderolabs.com/talos/v1.11/reference/cli#alosctl-gen-secureboot-pcr)

  Сгенерировать ключ, используемый для подписи значений TPM PCR.

- [gen secureboot uki]((https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-gen-secureboot-uki)

  Сгенерировать сертификат, используемый для подписи загрузочных ресурсов (UKI).

- [gen secureboot](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-gen-secureboot)  

  Сгенерировать секреты для процесса SecureBoot.

- [get](https://docs.siderolabs.com/talos/v1.11/reference/cli#talosctl-get)

  Получить конкретный ресурс или список ресурсов (используйте команду `talosctl get rd`, чтобы увидеть все доступные типы ресурсов). 
  Текуший список ресурсов для controlplane приведен в файле [talos_get_rd.log](./talos_get_rd.log).
  Дерево ресурсов приведено в файле [RDTree.yaml](./RDTree.yaml).
  Список полезных команд с примерныс вариантом вывода - в файле [usefullSubcommands.md](./usefullSubcommands.md).