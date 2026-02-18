# Описание страницы 

## REST-интерфейсы используемые страницей

Страница конфигурирования разворачивания располашается в `pages/clusters/factory.tsx` и доступна по URL `http://localhost:3000/maestro/cluster/factory` и использует 
два REST-интерфейса по `URLs`:
- `http://localhost:5000/factory` - получение текущих вариантов разворачивания;
- `http://localhost:5000/apply` - создание controlplane.yaml, worker.yaml для выбранного или сформированного разворачивания и создания  узлов Alt Orchestra кластера.

Номера портов параметризируется при вызове плагина maestro и REST/API интерфейса.

На гассальной странице разворачивания кластеров добавляется элемент `select`, в котором отображаются варианты разворачивания (по умолчанию default).

Пользователь 
- выбирает существующий вариант разворачивания;
- переводит все или часть узлов кластеров из состояния `maintenance` в состяния `controlplane` или `worker`.
- нажимает кнопку  `Apply`.

После нажатия кнопки странице `factory.tsx` через запрос `POST`передается JSON-структура формата:

```
{
  "Clusters": {
    "Cluster1": {
      "controlplane": [
        "192.168.122.12"
      ],
      "worker": [
        "192.168.122.13"
      ]
    },
    "Cluster2": {
      "controlplane": [
        "192.168.122.14"
      ],
      "worker": [
        "192.168.122.14"
      ]
    }
  },
  "deploymentVariant": "NVidia"
}
```

## Вид страницы

На странице `pages/clusters/factory.tsx`

```
http://localhost:3000/factory
```
![image](images/pageView.png)

отображаются:

- Кнопка *Отмена* для возврата на предыдущую страницу

- Input поле *Текущий вариант* - имя варианта разворачивания переданное параметорм (по умолчанию в режиме только на чтение) или имя введенное пользователем после изменения параметров разворачивания перечисленных ниже. 

- Поле Select *Варианты разворачивания* - при изменении значения производится обращение к http://localhost:5000/factory для получения указанного варианта разворачивания и перезаполнением нижеописанных полей. 

- Поле Select *Версия ALT Orchestra* для выбора версий ALT Orchestra (см 
  [https://factory.altlinux.space/?platform=metal\&target=metal](https://factory.altlinux.space/?platform=metal&target=metal)
  )

- Поле Select *Архитектура* для выбора архитектуры (amd64, arm64) (см 
  [https://factory.altlinux.space/?platform=metal\&target=metal&version=1.10.8.0](https://factory.altlinux.space/?platform=metal&target=metal&version=1.10.8.0)
  )

- Поле *Расширения* для выбора набора расширений (см 
  [https://factory.altlinux.space/?arch=amd64\&platform=metal&target=metal&version=1.10.8.0](https://factory.altlinux.space/?arch=amd64&platform=metal&target=metal&version=1.10.8.0)
  )

- Поле *Кастомизация ядра* для указания параметров вызова ядра (см
  https://factory.altlinux.space/?arch=amd64\&extensions=-&platform=metal&target
  metal&version=1.10.8.0)

- Поле Select *CNI* для выбора CNI (Container Network Interface)

- Поле *Имя образа installer* является альтернативным перечисленным выше полям. Если это поле заполняется обращение к image-factory для получения имени образа формата  `factory.altlinux.space/metal-installer/<uid>:v<version>` не производится. Используется указанное имя образа. 

В конце отображаются три секции для добавления патч файлов:

- `common` \- патчи применимые для файлов `controlplane.yaml`, `worker.yaml`
- `controlplane` \- патчи применимые для файла `controlplane.yaml`
- `worker` \- - патчи применимые для файла ` worker.yaml`

В каждой секции отображается кнопка `+` для добавления патчей для указанной
секции. Описание патчей может быть в yaml или json формате (см 
<https://docs.siderolabs.com/talos/v1.9/configure-your-talos-cluster/system-configuration/patching>
). 

Для передачи запроса на странице присутствует кнопка `Apply`.

Если пользователь меняет хотя бы одно поле, то поле `Текущий вариант`
становится пустым, включается режим возможности изменения поля и пользователь до передачи запроса должен ввести уникальное имя этого поля.

При нажатии кнопки `Apply` через запрос POST передаются введенные значения по
URL  `http://localhost:5000/apply`.

# Описание REST-интерфейса получения вариантов разворачивания

Страница делает REST-запрос по URL `http://localhost:5000/factory`.

В ответ возвращается в формате JSON:

- список текущих вариантов разворачивания (`deploymentsVariants`)
- список версий ALT оркестра (`versions`)
- список schematics (`schematics`)
- список CNI (`cni`);
- список патчей : `patches `  по типам `common`, `controlplane`, `worker`

Например:

```
{
  "deploymentsVariants": [
    {
      "default": {
        "version": "1.10.8.0",
        "schematicId": "376567988ad370138ad8b2698212367b8edcb69b5fd68c80be1f2ec7d603b4ba",
        "cni": "flannel:v0.27.3"
      }
    },
    {
      "NVidia": {
        "version": "1.10.8.0",
        "schematicId": "75102a21bfd618eb6ad53f06d5a27b6a3c03c8d108f2c72f1bbaf8dec328f1f5",
        "cni": "cilium:1.18.2"
      }
    }
  ],
  "versions": [
    {
      "1.1": [
        "1.10.8.0",
        "1.10.7.0"
      ]
    },
    {
      "1.11-pre": [
        "1.11.6.0-alpha.1",
        "1.11.6.0-alpha.0"
      ]
    }
  ],
  "schematics": [
    {
      "376567988ad370138ad8b2698212367b8edcb69b5fd68c80be1f2ec7d603b4ba": {
        "customization": {}
      }
    },
    {
      "75102a21bfd618eb6ad53f06d5a27b6a3c03c8d108f2c72f1bbaf8dec328f1f5": {
        "customization": {
          "systemExtensions": {
            "officialExtensions": [
              "alt-orchestra/nonfree-kmod-nvidia",
              "alt-orchestra/nvidia-container-toolkit"
            ]
          }
        }
      }
    }
  ],
  "cni": [
    {
      "flannel": [
        "v0.27.3",
        "v0.27.0",
        "v0.25.1"
      ]
    },
    {
      "cilium": [
        "1.18.2"
      ]
    }
  ],
  "patches": {
    "common": [],
    "controlplane": [],
    "worker": []
  }
}
```

# Описание  REST-интерфейса разворачиания узлов кластера
