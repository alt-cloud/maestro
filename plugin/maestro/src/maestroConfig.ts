export interface MaestroConfig {
  MAESTRO_API_URL: string;
}

class MaestroConfigManager {
  private config: MaestroConfig | null = null;
  private initPromise: Promise<void> | null = null;

  // 1. Инициализация (вызывается один раз в точке входа)
  public init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = fetch('/plugins/maestro/config.json')
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Не удалось загрузить конфиг: HTTP ${res.status}`);
            }
          return res.json();
        })
        .then((data: MaestroConfig) => {
          this.config = data;
          console.log('✅ Конфигурация Maestro успешно загружена:', this.config);
        })
        .catch((err) => {
          console.error('❌ Ошибка загрузки config.json, используются значения по умолчанию:', err);
          // Fallback (значения по умолчанию на случай ошибки)
          this.config = {
            MAESTRO_API_URL: 'http://127.0.0.1:5000'
          };
        });
    }
    return this.initPromise;
  }

  // 2. Синхронное получение (возвращает null, если загрузка еще не завершилась)
  public getConfig(): MaestroConfig | null {
    return this.config;
  }

  // 3. Асинхронное получение (гарантирует, что данные уже загружены)
  public async getConfigAsync(): Promise<MaestroConfig> {
    await this.init();
    return this.config!;
  }

  // 4. Удобный геттер для готового URL
  public getBaseUrl(): string | null {
    if (!this.config) return null;
    return `${this.config.MAESTRO_API_URL}`;
  }
}

// Экспортируем единственный экземпляр (Синглтон)
export const maestroConfig = new MaestroConfigManager();
