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

- cluster 

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

  Удалить контект(ы).



