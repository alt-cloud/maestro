# Запрос ресурсов talosctl get

В данном документе приведены выводы подкоманд `talosctl get`.
Пропущены команды, связанные с токенами и сертификатами.

В основом приведён основной неформатированный вывод. Для получения полного вывода необходимо добавить флаг `-o json` или `-o yaml`.

-  disk
```
NODE              NAMESPACE   TYPE   ID      VERSION   SIZE     READ ONLY   TRANSPORT   ROTATIONAL   WWID   MODEL          SERIAL
192.168.122.188   runtime     Disk   loop0   2         4.1 kB   true                                                       
192.168.122.188   runtime     Disk   loop1   2         96 MB    true                                                       
192.168.122.188   runtime     Disk   sr0     2         0 B      false       sata                            QEMU DVD-ROM   
192.168.122.188   runtime     Disk   vda     2         22 GB    false       virtio      true               
```

- endpoint
```
NODE              NAMESPACE      TYPE       ID               VERSION   ADDRESSES
192.168.122.188   controlplane   Endpoint   controlplane     1         ["192.168.122.188"]
192.168.122.188   controlplane   Endpoint   discovery        2         ["192.168.122.188"]
192.168.122.188   controlplane   Endpoint   kube-apiserver   1         ["192.168.122.188"]
```

- etcdmember
```
NODE              NAMESPACE   TYPE         ID      VERSION   MEMBER ID
192.168.122.188   etcd        EtcdMember   local   1         588974eda88e6841
```

- hardwareaddress
```
NODE              NAMESPACE   TYPE              ID      VERSION
192.168.122.188   network     HardwareAddress   first   1
```

- hostname
```
NODE              NAMESPACE   TYPE             ID         VERSION   HOSTNAME                DOMAINNAME
192.168.122.188   network     HostnameStatus   hostname   1         alt-orchestra-dbo-s97
```

- kernelparams
```
NODE              NAMESPACE   TYPE                ID                                             VERSION   CURRENT   DEFAULT   UNSUPPORTED
192.168.122.188   runtime     KernelParamStatus   proc.sys.fs.aio-max-nr                         1         1048576   65536     false
192.168.122.188   runtime     KernelParamStatus   proc.sys.fs.inotify.max_user_instances         1         8192      128       false
192.168.122.188   runtime     KernelParamStatus   proc.sys.kernel.dmesg_restrict                 1         1         1         false
192.168.122.188   runtime     KernelParamStatus   proc.sys.kernel.kptr_restrict                  1         1         0         false
192.168.122.188   runtime     KernelParamStatus   proc.sys.kernel.panic                          1         10        -1        false
192.168.122.188   runtime     KernelParamStatus   proc.sys.kernel.perf_event_paranoid            1         3         4         false
192.168.122.188   runtime     KernelParamStatus   proc.sys.kernel.pid_max                        1         262144    32768     false
192.168.122.188   runtime     KernelParamStatus   proc.sys.kernel.unprivileged_bpf_disabled      1         1         2         false
192.168.122.188   runtime     KernelParamStatus   proc.sys.kernel.yama.ptrace_scope              1         1         1         false
192.168.122.188   runtime     KernelParamStatus   proc.sys.net.bridge.bridge-nf-call-ip6tables   1         1         1         false
192.168.122.188   runtime     KernelParamStatus   proc.sys.net.bridge.bridge-nf-call-iptables    1         1         1         false
192.168.122.188   runtime     KernelParamStatus   proc.sys.net.core.bpf_jit_harden               1         2         0         false
192.168.122.188   runtime     KernelParamStatus   proc.sys.net.ipv4.ip_forward                   1         1         0         false
192.168.122.188   runtime     KernelParamStatus   proc.sys.net.ipv4.tcp_keepalive_intvl          1         60        75        false
192.168.122.188   runtime     KernelParamStatus   proc.sys.net.ipv4.tcp_keepalive_time           1         600       7200      false
192.168.122.188   runtime     KernelParamStatus   proc.sys.net.ipv6.conf.default.accept_ra       1         2         1         false
192.168.122.188   runtime     KernelParamStatus   proc.sys.net.ipv6.conf.default.forwarding      1         1         0         false
192.168.122.188   runtime     KernelParamStatus   proc.sys.user.max_user_namespaces              1         0         7393      false
192.168.122.188   runtime     KernelParamStatus   proc.sys.vm.overcommit_memory                  1         1         0         false
```

- linkspec
```
NODE              NAMESPACE   TYPE       ID       VERSION
192.168.122.188   network     LinkSpec   enp1s0   2
192.168.122.188   network     LinkSpec   lo       2
```

- links 
```
NODE              NAMESPACE   TYPE         ID             VERSION   TYPE       KIND     HW ADDR                                           OPER STATE   LINK STATE
192.168.122.188   network     LinkStatus   bond0          1         ether      bond     f2:45:b1:1e:2e:18                                 down         false
192.168.122.188   network     LinkStatus   cni0           3         ether      bridge   7a:db:22:48:e4:9f                                 up           true
192.168.122.188   network     LinkStatus   dummy0         1         ether      dummy    16:ed:c0:c3:b1:a2                                 down         false
192.168.122.188   network     LinkStatus   enp1s0         3         ether               52:54:00:cd:14:1b                                 up           true
192.168.122.188   network     LinkStatus   flannel.1      2         ether      vxlan    ee:13:cd:c5:ab:6c                                 unknown      true
192.168.122.188   network     LinkStatus   ip6tnl0        1         tunnel6    ip6tnl   00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00   down         false
192.168.122.188   network     LinkStatus   lo             1         loopback            00:00:00:00:00:00                                 unknown      true
192.168.122.188   network     LinkStatus   sit0           1         sit        sit      00:00:00:00                                       down         false
192.168.122.188   network     LinkStatus   teql0          1         void                                                                  down         false
192.168.122.188   network     LinkStatus   tunl0          1         ipip       ipip     00:00:00:00                                       down         false
192.168.122.188   network     LinkStatus   veth1b39582a   2         ether      veth     f6:c0:c2:10:50:e3                                 up           true
192.168.122.188   network     LinkStatus   veth52c29c28   3         ether      veth     4e:f5:18:d3:5f:2d                                 up           true
```
- machineconfig -o yaml 
```
node: 192.168.122.188
metadata:
    namespace: config
    type: MachineConfigs.config.talos.dev
    id: v1alpha1
    version: 1
    owner:
    phase: running
    created: 2025-12-10T04:21:33Z
    updated: 2025-12-10T04:21:33Z
spec: |
    version: v1alpha1
    debug: false
    persist: true
    machine:
      type: controlplane
      token: wefs90.xnesf27rt7co682e
      ca:
        crt: 
        key: 
      certSANs: []
      kubelet:
        image: registry.altlinux.org/p11/kubelet:v1.33.4
        defaultRuntimeSeccompProfileEnabled: true
        disableManifestsDirectory: true
      network: {}
      install:
        disk: /dev/vda
        image: factory.altlinux.space/metal-installer/376567988ad370138ad8b2698212367b8edcb69b5fd68c80be1f2ec7d603b4ba:v1.10.7.0
        wipe: false
      registries: {}
      features:
        rbac: true
        stableHostname: true
        apidCheckExtKeyUsage: true
        diskQuotaSupport: true
        kubePrism:
          enabled: true
          port: 7445
        hostDNS:
          enabled: true
          forwardKubeDNSToHost: true
      nodeLabels:
        node.kubernetes.io/exclude-from-external-load-balancers: ''
    cluster:
      id: UJmEom4oFVDUCLEuBh1MnP8nx8oER_eO5a74iwq2EgA=
      secret: QmCh9FrKPDAEyMS88rY+Iv7ccp6poKkyjenWcpl0XCk=
      controlPlane:
        endpoint: https://192.168.122.188:6443
      clusterName: orchestra_1.10.7
      network:
        dnsDomain: cluster.local
        podSubnets:
          - 10.244.0.0/16
        serviceSubnets:
          - 10.96.0.0/12
      token: 2x7fgm.cjqp5vjuptkbnk4h
      secretboxEncryptionSecret: jO9qVacKV5ifNdt4PZY8cz0jMxAqOiVPwWQbMW2xAY4=
      ca:
        crt: 
        key: 
      aggregatorCA:
        crt: 
        key: 
      serviceAccount:
        key: 
      apiServer:
        image: registry.altlinux.org/p11/kube-apiserver:v1.33.4
        certSANs:
          - 192.168.122.188
        disablePodSecurityPolicy: true
        admissionControl:
          - name: PodSecurity
            configuration:
              apiVersion: pod-security.admission.config.k8s.io/v1alpha1
              defaults:
                audit: restricted
                audit-version: latest
                enforce: baseline
                enforce-version: latest
                warn: restricted
                warn-version: latest
              exemptions:
                namespaces:
                  - kube-system
                runtimeClasses: []
                usernames: []
              kind: PodSecurityConfiguration
        auditPolicy:
          apiVersion: audit.k8s.io/v1
          kind: Policy
          rules:
            - level: Metadata
      controllerManager:
        image: registry.altlinux.org/p11/kube-controller-manager:v1.33.4
      proxy:
        image: registry.altlinux.org/p11/kube-proxy:v1.33.4
      scheduler:
        image: registry.altlinux.org/p11/kube-scheduler:v1.33.4
      discovery:
        enabled: true
        registries:
          kubernetes:
            disabled: true
          service: {}
      etcd:
        ca:
          crt: 
          key: 
        image: registry.altlinux.org/p11/etcd:v3.5.21
      extraManifests: []
      inlineManifests: []
      coreDNS:
        image: registry.altlinux.org/p11/coredns:v1.12.0
```

- machinestatus
```
NODE              NAMESPACE   TYPE            ID        VERSION   STAGE     READY
192.168.122.188   runtime     MachineStatus   machine   16        running   true
```

- machinetype
```
NODE              NAMESPACE   TYPE          ID             VERSION   TYPE
192.168.122.188   config      MachineType   machine-type   2         controlplane
```

- maintenanceserviceconfig -o yaml
```
node: 192.168.122.188
metadata:
    namespace: runtime
    type: MaintenanceServiceConfigs.runtime.talos.dev
    id: maintenance
    version: 5
    owner: runtime.MaintenanceConfigController
    phase: running
    created: 2025-12-10T04:21:31Z
    updated: 2025-12-10T04:24:17Z
spec:
    listenAddress: :50000
    reachableAddresses:
        - 10.244.0.0
        - 10.244.0.1
        - 192.168.122.188
```

- manifest 
```
NODE              NAMESPACE      TYPE       ID                               VERSION
192.168.122.188   controlplane   Manifest   00-kubelet-bootstrapping-token   1
192.168.122.188   controlplane   Manifest   01-csr-approver-role-binding     1
192.168.122.188   controlplane   Manifest   01-csr-node-bootstrap            1
192.168.122.188   controlplane   Manifest   01-csr-renewal-role-binding      1
192.168.122.188   controlplane   Manifest   05-flannel                       1
192.168.122.188   controlplane   Manifest   10-kube-proxy                    1
192.168.122.188   controlplane   Manifest   11-core-dns                      1
192.168.122.188   controlplane   Manifest   11-core-dns-svc                  1
192.168.122.188   controlplane   Manifest   11-kube-config-in-cluster        1
```

- manifeststatus -o yaml
```
node: 192.168.122.188
metadata:
    namespace: controlplane
    type: ManifestStatuses.kubernetes.talos.dev
    id: manifests
    version: 1
    owner: k8s.ManifestApplyController
    phase: running
    created: 2025-12-10T04:23:16Z
    updated: 2025-12-10T04:23:16Z
spec:
    manifestsApplied:
        - 00-kubelet-bootstrapping-token
        - 01-csr-approver-role-binding
        - 01-csr-node-bootstrap
        - 01-csr-renewal-role-binding
        - 05-flannel
        - 10-kube-proxy
        - 11-core-dns
        - 11-core-dns-svc
        - 11-kube-config-in-cluster
```

- member
```
NODE              NAMESPACE   TYPE     ID                      VERSION   HOSTNAME                MACHINE TYPE   OS                        ADDRESSES
192.168.122.188   cluster     Member   alt-orchestra-dbo-s97   2         alt-orchestra-dbo-s97   controlplane   ALT Orchestra (v1.10.7)   ["192.168.122.188"]
```

- memorymodules
```
NODE              NAMESPACE   TYPE           ID       VERSION   MANUFACTURER   MODEL   SIZEMIB
192.168.122.188   hardware    MemoryModule   DIMM-0   1         QEMU                   2048
```

- memorystat 
```
NODE              NAMESPACE   TYPE         ID       VERSION   USED      TOTAL
192.168.122.188   perf        MemoryStat   latest   358       1830824   1998256
```

- mountrequest
```
NODE              NAMESPACE   TYPE           ID                                  VERSION   VOLUME                              PARENT   REQUESTERS
192.168.122.188   runtime     MountRequest   /etc/cni                            2         /etc/cni                                     ["service/cri"]
192.168.122.188   runtime     MountRequest   /etc/kubernetes                     2         /etc/kubernetes                              ["service/cri"]
192.168.122.188   runtime     MountRequest   /opt                                2         /opt                                         ["service/cri"]
192.168.122.188   runtime     MountRequest   /usr/libexec/kubernetes             2         /usr/libexec/kubernetes                      ["service/cri"]
192.168.122.188   runtime     MountRequest   /var/lib                            3         /var/lib                                     ["service/cri","service/etcd","service/kubelet"]
192.168.122.188   runtime     MountRequest   /var/lib/cni                        2         /var/lib/cni                                 ["service/cri"]
192.168.122.188   runtime     MountRequest   /var/lib/containerd                 2         /var/lib/containerd                          ["service/cri"]
192.168.122.188   runtime     MountRequest   /var/lib/kubelet                    2         /var/lib/kubelet                             ["service/kubelet"]
192.168.122.188   runtime     MountRequest   /var/lib/kubelet/seccomp            2         /var/lib/kubelet/seccomp                     ["service/kubelet"]
192.168.122.188   runtime     MountRequest   /var/lib/kubelet/seccomp/profiles   2         /var/lib/kubelet/seccomp/profiles            ["service/kubelet"]
192.168.122.188   runtime     MountRequest   /var/log                            2         /var/log                                     ["service/kubelet"]
192.168.122.188   runtime     MountRequest   /var/log/audit                      2         /var/log/audit                               ["service/kubelet"]
192.168.122.188   runtime     MountRequest   /var/log/audit/kube                 2         /var/log/audit/kube                          ["service/kubelet"]
192.168.122.188   runtime     MountRequest   /var/log/containers                 2         /var/log/containers                          ["service/kubelet"]
192.168.122.188   runtime     MountRequest   /var/log/pods                       2         /var/log/pods                                ["service/kubelet"]
192.168.122.188   runtime     MountRequest   /var/mnt                            3         /var/mnt                                     ["block.UserVolumeConfigController","service/kubelet"]
192.168.122.188   runtime     MountRequest   /var/run                            2         /var/run                                     ["service/cri"]
192.168.122.188   runtime     MountRequest   /var/run/lock                       2         /var/run/lock                                ["service/cri"]
192.168.122.188   runtime     MountRequest   EPHEMERAL                           2         EPHEMERAL                                    ["sequencer"]
192.168.122.188   runtime     MountRequest   ETCD                                2         ETCD                                         ["service/etcd"]
```

- mountstatus
```
NODE              NAMESPACE   TYPE          ID                                  VERSION   SOURCE      TARGET                              FILESYSTEM   VOLUME
192.168.122.188   runtime     MountStatus   /etc/cni                            2                     /etc/cni                            none         /etc/cni
192.168.122.188   runtime     MountStatus   /etc/kubernetes                     2                     /etc/kubernetes                     none         /etc/kubernetes
192.168.122.188   runtime     MountStatus   /opt                                2                     /opt                                none         /opt
192.168.122.188   runtime     MountStatus   /usr/libexec/kubernetes             2                     /usr/libexec/kubernetes             none         /usr/libexec/kubernetes
192.168.122.188   runtime     MountStatus   /var/lib                            7                     /var/lib                            none         /var/lib
192.168.122.188   runtime     MountStatus   /var/lib/cni                        2                     /var/lib/cni                        none         /var/lib/cni
192.168.122.188   runtime     MountStatus   /var/lib/containerd                 2                     /var/lib/containerd                 none         /var/lib/containerd
192.168.122.188   runtime     MountStatus   /var/lib/kubelet                    3                     /var/lib/kubelet                    none         /var/lib/kubelet
192.168.122.188   runtime     MountStatus   /var/lib/kubelet/seccomp            3                     /var/lib/kubelet/seccomp            none         /var/lib/kubelet/seccomp
192.168.122.188   runtime     MountStatus   /var/lib/kubelet/seccomp/profiles   2                     /var/lib/kubelet/seccomp/profiles   none         /var/lib/kubelet/seccomp/profiles
192.168.122.188   runtime     MountStatus   /var/log                            5                     /var/log                            none         /var/log
192.168.122.188   runtime     MountStatus   /var/log/audit                      3                     /var/log/audit                      none         /var/log/audit
192.168.122.188   runtime     MountStatus   /var/log/audit/kube                 2                     /var/log/audit/kube                 none         /var/log/audit/kube
192.168.122.188   runtime     MountStatus   /var/log/containers                 2                     /var/log/containers                 none         /var/log/containers
192.168.122.188   runtime     MountStatus   /var/log/pods                       2                     /var/log/pods                       none         /var/log/pods
192.168.122.188   runtime     MountStatus   /var/mnt                            3                     /var/mnt                            none         /var/mnt
192.168.122.188   runtime     MountStatus   /var/run                            3                     /var/run                            none         /var/run
192.168.122.188   runtime     MountStatus   /var/run/lock                       2                     /var/run/lock                       none         /var/run/lock
192.168.122.188   runtime     MountStatus   EPHEMERAL                           5         /dev/vda6   /var                                xfs          EPHEMERAL
192.168.122.188   runtime     MountStatus   ETCD                                2                     /var/lib/etcd                       none         ETCD
```

- mounts
```
NODE              NAMESPACE   TYPE          ID          VERSION   SOURCE      TARGET   FILESYSTEM TYPE
192.168.122.188   runtime     MountStatus   EPHEMERAL   1         /dev/vda6   /var     xfs
```

- namespace
```
NODE              NAMESPACE   TYPE        ID               VERSION
192.168.122.188   meta        Namespace   cluster          1
192.168.122.188   meta        Namespace   cluster-raw      1
192.168.122.188   meta        Namespace   config           1
192.168.122.188   meta        Namespace   controlplane     1
192.168.122.188   meta        Namespace   cri              1
192.168.122.188   meta        Namespace   etcd             1
192.168.122.188   meta        Namespace   files            1
192.168.122.188   meta        Namespace   hardware         1
192.168.122.188   meta        Namespace   k8s              1
192.168.122.188   meta        Namespace   kubespan         1
192.168.122.188   meta        Namespace   meta             1
192.168.122.188   meta        Namespace   network          1
192.168.122.188   meta        Namespace   network-config   1
192.168.122.188   meta        Namespace   perf             1
192.168.122.188   meta        Namespace   runtime          1
192.168.122.188   meta        Namespace   secrets          1
```

- networkstatus
```
NODE              NAMESPACE   TYPE            ID       VERSION   ADDRESS   CONNECTIVITY   HOSTNAME   ETC
192.168.122.188   network     NetworkStatus   status   4         true      true           true       true
```

- nftableschain
```
NODE   NAMESPACE   TYPE   ID   VERSION   TYPE   HOOK   PRIORITY   POLICY
```

- nodeaddress
```
NODE              NAMESPACE   TYPE          ID                      VERSION   ADDRESSES                                                SORTALGORITHM
192.168.122.188   network     NodeAddress   accumulative            4         ["10.244.0.0/32","10.244.0.1/24","192.168.122.188/24"]   v1
192.168.122.188   network     NodeAddress   accumulative-no-k8s     2         ["192.168.122.188/24"]                                   v1
192.168.122.188   network     NodeAddress   accumulative-only-k8s   3         ["10.244.0.0/32","10.244.0.1/24"]                        v1
192.168.122.188   network     NodeAddress   current                 4         ["10.244.0.0/32","10.244.0.1/24","192.168.122.188/24"]   v1
192.168.122.188   network     NodeAddress   current-no-k8s          2         ["192.168.122.188/24"]                                   v1
192.168.122.188   network     NodeAddress   current-only-k8s        3         ["10.244.0.0/32","10.244.0.1/24"]                        v1
192.168.122.188   network     NodeAddress   default                 1         ["192.168.122.188/24"]                                   v1
192.168.122.188   network     NodeAddress   routed                  4         ["10.244.0.0/32","10.244.0.1/24","192.168.122.188/24"]   v1
192.168.122.188   network     NodeAddress   routed-no-k8s           2         ["192.168.122.188/24"]                                   v1
192.168.122.188   network     NodeAddress   routed-only-k8s         3         ["10.244.0.0/32","10.244.0.1/24"]                        v1
```

- nodeaddressfilter
```
NODE              NAMESPACE   TYPE                ID         VERSION   INCLUDE SUBNETS                    EXCLUDE SUBNETS
192.168.122.188   network     NodeAddressFilter   no-k8s     1         []                                 ["10.244.0.0/16","10.96.0.0/12"]
192.168.122.188   network     NodeAddressFilter   only-k8s   1         ["10.244.0.0/16","10.96.0.0/12"]   []
```

- nodeaddresssortalgorithm
```
NODE              NAMESPACE   TYPE                       ID        VERSION   ALGORITHM
192.168.122.188   network     NodeAddressSortAlgorithm   default   1         v1
```

- nodeannotationspec
```
NODE              NAMESPACE   TYPE                 ID                               VERSION   VALUE
192.168.122.188   k8s         NodeAnnotationSpec   extensions.talos.dev/schematic   1         376567988ad370138ad8b2698212367b8edcb69b5fd68c80be1f2ec7d603b4ba
```

- nodecordonedspec
```
NODE   NAMESPACE   TYPE   ID   VERSION
```

- nodeipconfig
```
NODE              NAMESPACE   TYPE           ID        VERSION
192.168.122.188   k8s         NodeIPConfig   kubelet   1
```

- nodeip
```
NODE              NAMESPACE   TYPE     ID        VERSION
192.168.122.188   k8s         NodeIP   kubelet   1
```

- nodelabelspec
```
NODE              NAMESPACE   TYPE            ID                                                        VERSION   VALUE
192.168.122.188   k8s         NodeLabelSpec   node-role.kubernetes.io/control-plane                     1         
192.168.122.188   k8s         NodeLabelSpec   node.kubernetes.io/exclude-from-external-load-balancers   1 
```

- nodename
```
NODE              NAMESPACE   TYPE       ID         VERSION   NODENAME
192.168.122.188   k8s         Nodename   nodename   1         alt-orchestra-dbo-s97
```

- nodestatus
```
NODE              NAMESPACE   TYPE         ID                      VERSION   READY   UNSCHEDULABLE
192.168.122.188   k8s         NodeStatus   alt-orchestra-dbo-s97   1         true    false
```

- nodetaintspec
```
NODE              NAMESPACE   TYPE            ID                                      VERSION   EFFECT       VALUE
192.168.122.188   k8s         NodeTaintSpec   node-role.kubernetes.io/control-plane   1         NoSchedule 
```

- operatorspec
```
NODE              NAMESPACE   TYPE           ID             VERSION
192.168.122.188   network     OperatorSpec   dhcp4/enp1s0   1
```

- devices
```
NODE              NAMESPACE   TYPE        ID             VERSION   CLASS                      SUBCLASS                    VENDOR              PRODUCT
192.168.122.188   hardware    PCIDevice   0000:00:00.0   1         Bridge                     Host bridge                 Intel Corporation   82G33/G31/P35/P31 Express DRAM Controller
192.168.122.188   hardware    PCIDevice   0000:00:01.0   1         Display controller         VGA compatible controller   Red Hat, Inc.       Virtio 1.0 GPU
192.168.122.188   hardware    PCIDevice   0000:00:02.0   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:02.1   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:02.2   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:02.3   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:02.4   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:02.5   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:02.6   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:02.7   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:03.0   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:03.1   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:03.2   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:03.3   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:03.4   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:03.5   1         Bridge                     PCI bridge                  Red Hat, Inc.       QEMU PCIe Root port
192.168.122.188   hardware    PCIDevice   0000:00:1b.0   1         Multimedia controller      Audio device                Intel Corporation   82801I (ICH9 Family) HD Audio Controller
192.168.122.188   hardware    PCIDevice   0000:00:1f.0   1         Bridge                     ISA bridge                  Intel Corporation   82801IB (ICH9) LPC Interface Controller
192.168.122.188   hardware    PCIDevice   0000:00:1f.2   1         Mass storage controller    SATA controller             Intel Corporation   82801IR/IO/IH (ICH9R/DO/DH) 6 port SATA Controller [AHCI mode]
192.168.122.188   hardware    PCIDevice   0000:00:1f.3   1         Serial bus controller      SMBus                       Intel Corporation   82801I (ICH9 Family) SMBus Controller
192.168.122.188   hardware    PCIDevice   0000:01:00.0   1         Network controller         Ethernet controller         Red Hat, Inc.       Virtio 1.0 network device
192.168.122.188   hardware    PCIDevice   0000:02:00.0   1         Serial bus controller      USB controller              Red Hat, Inc.       QEMU XHCI Host Controller
192.168.122.188   hardware    PCIDevice   0000:03:00.0   1         Communication controller   Communication controller    Red Hat, Inc.       Virtio 1.0 console
192.168.122.188   hardware    PCIDevice   0000:04:00.0   1         Mass storage controller    SCSI storage controller     Red Hat, Inc.       Virtio 1.0 block device
192.168.122.188   hardware    PCIDevice   0000:05:00.0   1         Unclassified device                                    Red Hat, Inc.       Virtio 1.0 memory balloon
192.168.122.188   hardware    PCIDevice   0000:06:00.0   1         Unclassified device                                    Red Hat, Inc.       Virtio 1.0 RNG
```

- platformmetadata
```
NODE              NAMESPACE   TYPE               ID                 VERSION   PLATFORM   TYPE   REGION   ZONE
192.168.122.188   runtime     PlatformMetadata   platformmetadata   2         metal                   
```

- processor
```
NODE              NAMESPACE   TYPE        ID      VERSION   MANUFACTURER   MODEL        CORES   THREADS
192.168.122.188   hardware    Processor   CPU-0   1         QEMU           pc-q35-9.1   1       1
192.168.122.188   hardware    Processor   CPU-1   1         QEMU           pc-q35-9.1   1       1
```

- registryconfig
```
NODE              NAMESPACE   TYPE             ID           VERSION
192.168.122.188   cri         RegistryConfig   registries   1
```

- resolverspec - DNS
```
NODE              NAMESPACE   TYPE           ID          VERSION   LAYER      RESOLVERS           SEARCH DOMAINS
192.168.122.188   network     ResolverSpec   resolvers   3         operator   ["192.168.122.1"]   
```

- resolverstatus
```
NODE              NAMESPACE   TYPE             ID          VERSION   RESOLVERS           SEARCH DOMAINS
192.168.122.188   network     ResolverStatus   resolvers   2         ["192.168.122.1"]   []
```

- routespec
```
NODE              NAMESPACE   TYPE        ID                          VERSION
192.168.122.188   network     RouteSpec   inet4/192.168.122.1//1024   2
```

- routestatus
```
NODE              NAMESPACE   TYPE          ID                                                          VERSION   DESTINATION                     GATEWAY         LINK           METRIC

192.168.122.188   network     RouteStatus   inet4//10.244.0.0/24/0                                      1         10.244.0.0/24                                   cni0           0
192.168.122.188   network     RouteStatus   inet4//192.168.122.0/24/1024                                1         192.168.122.0/24                                enp1s0         1024
192.168.122.188   network     RouteStatus   inet4/192.168.122.1//1024                                   1                                         192.168.122.1   enp1s0         1024
192.168.122.188   network     RouteStatus   local/inet4//10.244.0.0/32/0                                1         10.244.0.0/32                                   flannel.1      0
192.168.122.188   network     RouteStatus   local/inet4//10.244.0.1/32/0                                1         10.244.0.1/32                                   cni0           0
192.168.122.188   network     RouteStatus   local/inet4//10.244.0.255/32/0                              1         10.244.0.255/32                                 cni0           0
192.168.122.188   network     RouteStatus   local/inet4//127.0.0.0/8/0                                  1         127.0.0.0/8                                     lo             0
192.168.122.188   network     RouteStatus   local/inet4//127.0.0.1/32/0                                 1         127.0.0.1/32                                    lo             0
192.168.122.188   network     RouteStatus   local/inet4//127.255.255.255/32/0                           1         127.255.255.255/32                              lo             0
192.168.122.188   network     RouteStatus   local/inet4//169.254.116.108/32/0                           20        169.254.116.108/32                              lo             0
192.168.122.188   network     RouteStatus   local/inet4//192.168.122.188/32/0                           1         192.168.122.188/32                              enp1s0         0
192.168.122.188   network     RouteStatus   local/inet4//192.168.122.255/32/0                           1         192.168.122.255/32                              enp1s0         0
```

- schedulerconfig
```
NODE              NAMESPACE      TYPE              ID               VERSION
192.168.122.188   controlplane   SchedulerConfig   kube-scheduler   1
```

- secretstatus
```
NODE              NAMESPACE      TYPE           ID            VERSION   READY   SECRETS VERSION
192.168.122.188   controlplane   SecretStatus   static-pods   1         true    1
```

- securitystate
```
NODE              NAMESPACE   TYPE            ID              VERSION   SECUREBOOT   UKISIGNINGKEYFINGERPRINT   PCRSIGNINGKEYFINGERPRINT   SELINUXSTATE
192.168.122.188   runtime     SecurityState   securitystate   1         false                                                              enabled, permissive
```

- service
```
NODE              NAMESPACE   TYPE      ID           VERSION   RUNNING   HEALTHY   HEALTH UNKNOWN
192.168.122.188   runtime     Service   apid         2         true      true      false
192.168.122.188   runtime     Service   auditd       2         true      true      false
192.168.122.188   runtime     Service   containerd   2         true      true      false
192.168.122.188   runtime     Service   cri          2         true      true      false
192.168.122.188   runtime     Service   dashboard    1         true      false     true
192.168.122.188   runtime     Service   etcd         2         true      true      false
192.168.122.188   runtime     Service   kubelet      2         true      true      false
192.168.122.188   runtime     Service   machined     2         true      true      false
192.168.122.188   runtime     Service   syslogd      2         true      true      false
192.168.122.188   runtime     Service   trustd       2         true      true      false
192.168.122.188   runtime     Service   udevd        2         true      true      false
```

- staticpod
```
NODE              NAMESPACE   TYPE        ID                        VERSION
192.168.122.188   k8s         StaticPod   kube-apiserver            1
192.168.122.188   k8s         StaticPod   kube-controller-manager   1
192.168.122.188   k8s         StaticPod   kube-scheduler            1
```


- staticpodserverstatus
```
NODE              NAMESPACE   TYPE                    ID                         VERSION
192.168.122.188   k8s         StaticPodServerStatus   static-pod-server-status   1
```

- staticpodstatus
```
NODE              NAMESPACE   TYPE              ID                                                          VERSION   READY
192.168.122.188   k8s         StaticPodStatus   kube-system/kube-apiserver-alt-orchestra-dbo-s97            1         True
192.168.122.188   k8s         StaticPodStatus   kube-system/kube-controller-manager-alt-orchestra-dbo-s97   2         True
192.168.122.188   k8s         StaticPodStatus   kube-system/kube-scheduler-alt-orchestra-dbo-s97            1         True
```

- systemdisk
```
NODE              NAMESPACE   TYPE         ID            VERSION   DISK
192.168.122.188   runtime     SystemDisk   system-disk   1         vda
```

- systeminformation
```
NODE              NAMESPACE   TYPE                ID                  VERSION   MANUFACTURER   PRODUCTNAME                      VERSION      SERIALNUMBER   UUID                                   WAKEUPTYPE     SKUNUMBER
192.168.122.188   hardware    SystemInformation   systeminformation   1         QEMU           Standard PC (Q35 + ICH9, 2009)   pc-q35-9.1                  d4c23304-5d2d-48f2-98cf-7cf600c8e88d   Power Switch   
```

- timeserverspec
```
NODE              NAMESPACE   TYPE             ID            VERSION
192.168.122.188   network     TimeServerSpec   timeservers   2
```

- timeserverstatus
```
NODE              NAMESPACE   TYPE               ID            VERSION   TIMESERVERS
192.168.122.188   network     TimeServerStatus   timeservers   1         ["time.cloudflare.com"]
```

- timestatus
```
NODE              NAMESPACE   TYPE         ID     VERSION   SYNCED
192.168.122.188   runtime     TimeStatus   node   2         true
```

- trustdcertificate
```
NODE              NAMESPACE   TYPE                ID       VERSION
192.168.122.188   secrets     TrustdCertificate   trustd   2
```

- uniquemachinetoken
```
NODE              NAMESPACE   TYPE                 ID                     VERSION   TOKEN
192.168.122.188   runtime     UniqueMachineToken   unique-machine-token   1         
```

- userdiskconfigstatus
```
NODE              NAMESPACE   TYPE                   ID           VERSION   READY
192.168.122.188   runtime     UserDiskConfigStatus   user-disks   1         true
```

- version
```
NODE              NAMESPACE   TYPE      ID        VERSION   VERSION
192.168.122.188   runtime     Version   version   1         v1.10.7
```

- volumeconfig
```
NODE              NAMESPACE   TYPE           ID                                  VERSION
192.168.122.188   runtime     VolumeConfig   /etc/cni                            2
192.168.122.188   runtime     VolumeConfig   /etc/kubernetes                     2
192.168.122.188   runtime     VolumeConfig   /opt                                2
192.168.122.188   runtime     VolumeConfig   /usr/libexec/kubernetes             2
192.168.122.188   runtime     VolumeConfig   /var/lib                            2
192.168.122.188   runtime     VolumeConfig   /var/lib/cni                        2
192.168.122.188   runtime     VolumeConfig   /var/lib/containerd                 2
192.168.122.188   runtime     VolumeConfig   /var/lib/kubelet                    2
192.168.122.188   runtime     VolumeConfig   /var/lib/kubelet/seccomp            2
192.168.122.188   runtime     VolumeConfig   /var/lib/kubelet/seccomp/profiles   2
192.168.122.188   runtime     VolumeConfig   /var/log                            2
192.168.122.188   runtime     VolumeConfig   /var/log/audit                      2
192.168.122.188   runtime     VolumeConfig   /var/log/audit/kube                 2
192.168.122.188   runtime     VolumeConfig   /var/log/containers                 2
192.168.122.188   runtime     VolumeConfig   /var/log/pods                       2
192.168.122.188   runtime     VolumeConfig   /var/mnt                            2
192.168.122.188   runtime     VolumeConfig   /var/run                            2
192.168.122.188   runtime     VolumeConfig   /var/run/lock                       2
192.168.122.188   runtime     VolumeConfig   EPHEMERAL                           2
192.168.122.188   runtime     VolumeConfig   ETCD                                2
192.168.122.188   runtime     VolumeConfig   META                                2
192.168.122.188   runtime     VolumeConfig   STATE                               3
```

- volumelifecycle
```
NODE              NAMESPACE   TYPE              ID        VERSION
192.168.122.188   runtime     VolumeLifecycle   volumes   3
```

- volumemountrequest
```
NODE              NAMESPACE   TYPE                 ID                                                  VERSION   VOLUME ID                           REQUESTER
192.168.122.188   runtime     VolumeMountRequest   /var/mnt                                            1         /var/mnt                            block.UserVolumeConfigController
192.168.122.188   runtime     VolumeMountRequest   EPHEMERAL                                           1         EPHEMERAL                           sequencer
192.168.122.188   runtime     VolumeMountRequest   service/cri-/etc/cni                                1         /etc/cni                            service/cri
192.168.122.188   runtime     VolumeMountRequest   service/cri-/etc/kubernetes                         1         /etc/kubernetes                     service/cri
192.168.122.188   runtime     VolumeMountRequest   service/cri-/opt                                    1         /opt                                service/cri
192.168.122.188   runtime     VolumeMountRequest   service/cri-/usr/libexec/kubernetes                 1         /usr/libexec/kubernetes             service/cri
192.168.122.188   runtime     VolumeMountRequest   service/cri-/var/lib                                1         /var/lib                            service/cri
192.168.122.188   runtime     VolumeMountRequest   service/cri-/var/lib/cni                            1         /var/lib/cni                        service/cri
192.168.122.188   runtime     VolumeMountRequest   service/cri-/var/lib/containerd                     1         /var/lib/containerd                 service/cri
192.168.122.188   runtime     VolumeMountRequest   service/cri-/var/run                                1         /var/run                            service/cri
192.168.122.188   runtime     VolumeMountRequest   service/cri-/var/run/lock                           1         /var/run/lock                       service/cri
192.168.122.188   runtime     VolumeMountRequest   service/etcd-/var/lib                               1         /var/lib                            service/etcd
192.168.122.188   runtime     VolumeMountRequest   service/etcd-ETCD                                   1         ETCD                                service/etcd
192.168.122.188   runtime     VolumeMountRequest   service/kubelet-/var/lib                            1         /var/lib                            service/kubelet
192.168.122.188   runtime     VolumeMountRequest   service/kubelet-/var/lib/kubelet                    1         /var/lib/kubelet                    service/kubelet
192.168.122.188   runtime     VolumeMountRequest   service/kubelet-/var/lib/kubelet/seccomp            1         /var/lib/kubelet/seccomp            service/kubelet
192.168.122.188   runtime     VolumeMountRequest   service/kubelet-/var/lib/kubelet/seccomp/profiles   1         /var/lib/kubelet/seccomp/profiles   service/kubelet
192.168.122.188   runtime     VolumeMountRequest   service/kubelet-/var/log                            1         /var/log                            service/kubelet
192.168.122.188   runtime     VolumeMountRequest   service/kubelet-/var/log/audit                      1         /var/log/audit                      service/kubelet
192.168.122.188   runtime     VolumeMountRequest   service/kubelet-/var/log/audit/kube                 1         /var/log/audit/kube                 service/kubelet
192.168.122.188   runtime     VolumeMountRequest   service/kubelet-/var/log/containers                 1         /var/log/containers                 service/kubelet
192.168.122.188   runtime     VolumeMountRequest   service/kubelet-/var/log/pods                       1         /var/log/pods                       service/kubelet
192.168.122.188   runtime     VolumeMountRequest   service/kubelet-/var/mnt                            1         /var/mnt                            service/kubelet
```

- volumemountstatus
```
NODE              NAMESPACE   TYPE                ID                                                  VERSION   VOLUME ID                           REQUESTER                          TARGET
192.168.122.188   runtime     VolumeMountStatus   /var/mnt                                            1         /var/mnt                            block.UserVolumeConfigController   /var/mnt
192.168.122.188   runtime     VolumeMountStatus   EPHEMERAL                                           1         EPHEMERAL                           sequencer                          /var
192.168.122.188   runtime     VolumeMountStatus   service/cri-/etc/cni                                2         /etc/cni                            service/cri                        /etc/cni
192.168.122.188   runtime     VolumeMountStatus   service/cri-/etc/kubernetes                         2         /etc/kubernetes                     service/cri                        /etc/kubernetes
192.168.122.188   runtime     VolumeMountStatus   service/cri-/opt                                    2         /opt                                service/cri                        /opt
192.168.122.188   runtime     VolumeMountStatus   service/cri-/usr/libexec/kubernetes                 2         /usr/libexec/kubernetes             service/cri                        /usr/libexec/kubernetes
192.168.122.188   runtime     VolumeMountStatus   service/cri-/var/lib                                2         /var/lib                            service/cri                        /var/lib
192.168.122.188   runtime     VolumeMountStatus   service/cri-/var/lib/cni                            2         /var/lib/cni                        service/cri                        /var/lib/cni
192.168.122.188   runtime     VolumeMountStatus   service/cri-/var/lib/containerd                     2         /var/lib/containerd                 service/cri                        /var/lib/containerd
192.168.122.188   runtime     VolumeMountStatus   service/cri-/var/run                                2         /var/run                            service/cri                        /var/run
192.168.122.188   runtime     VolumeMountStatus   service/cri-/var/run/lock                           2         /var/run/lock                       service/cri                        /var/run/lock
192.168.122.188   runtime     VolumeMountStatus   service/etcd-/var/lib                               2         /var/lib                            service/etcd                       /var/lib
192.168.122.188   runtime     VolumeMountStatus   service/etcd-ETCD                                   2         ETCD                                service/etcd                       /var/lib/etcd
192.168.122.188   runtime     VolumeMountStatus   service/kubelet-/var/lib                            2         /var/lib                            service/kubelet                    /var/lib
192.168.122.188   runtime     VolumeMountStatus   service/kubelet-/var/lib/kubelet                    2         /var/lib/kubelet                    service/kubelet                    /var/lib/kubelet
192.168.122.188   runtime     VolumeMountStatus   service/kubelet-/var/lib/kubelet/seccomp            2         /var/lib/kubelet/seccomp            service/kubelet                    /var/lib/kubelet/seccomp
192.168.122.188   runtime     VolumeMountStatus   service/kubelet-/var/lib/kubelet/seccomp/profiles   2         /var/lib/kubelet/seccomp/profiles   service/kubelet                    /var/lib/kubelet/seccomp/profiles
192.168.122.188   runtime     VolumeMountStatus   service/kubelet-/var/log                            2         /var/log                            service/kubelet                    /var/log
192.168.122.188   runtime     VolumeMountStatus   service/kubelet-/var/log/audit                      2         /var/log/audit                      service/kubelet                    /var/log/audit
192.168.122.188   runtime     VolumeMountStatus   service/kubelet-/var/log/audit/kube                 2         /var/log/audit/kube                 service/kubelet                    /var/log/audit/kube
192.168.122.188   runtime     VolumeMountStatus   service/kubelet-/var/log/containers                 2         /var/log/containers                 service/kubelet                    /var/log/containers
192.168.122.188   runtime     VolumeMountStatus   service/kubelet-/var/log/pods                       2         /var/log/pods                       service/kubelet                    /var/log/pods
192.168.122.188   runtime     VolumeMountStatus   service/kubelet-/var/mnt                            2         /var/mnt                            service/kubelet                    /var/mnt
```

- volumestatus
```
NODE              NAMESPACE   TYPE           ID                                  VERSION   TYPE        PHASE   LOCATION    SIZE
192.168.122.188   runtime     VolumeStatus   /etc/cni                            3         overlay     ready               
192.168.122.188   runtime     VolumeStatus   /etc/kubernetes                     3         overlay     ready               
192.168.122.188   runtime     VolumeStatus   /opt                                3         overlay     ready               
192.168.122.188   runtime     VolumeStatus   /usr/libexec/kubernetes             3         overlay     ready               
192.168.122.188   runtime     VolumeStatus   /var/lib                            2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/lib/cni                        2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/lib/containerd                 2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/lib/kubelet                    2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/lib/kubelet/seccomp            2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/lib/kubelet/seccomp/profiles   2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/log                            2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/log/audit                      2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/log/audit/kube                 2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/log/containers                 2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/log/pods                       2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/mnt                            2         directory   ready               
192.168.122.188   runtime     VolumeStatus   /var/run                            2         symlink     ready               
192.168.122.188   runtime     VolumeStatus   /var/run/lock                       2         directory   ready               
192.168.122.188   runtime     VolumeStatus   EPHEMERAL                           6         partition   ready   /dev/vda6   20 GB
192.168.122.188   runtime     VolumeStatus   ETCD                                2         directory   ready               
192.168.122.188   runtime     VolumeStatus   META                                3         partition   ready   /dev/vda4   1.0 MB
192.168.122.188   runtime     VolumeStatus   STATE                               6         partition   ready   /dev/vda5   1
```

