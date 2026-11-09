# EMS COMMAND — updates (v3.4)

## What is implemented now
- Installed Electron launcher checks the configured public HTTPS feed automatically.
- Available updates download inside the launcher with real progress. Installation requires a user confirmation.
- All updates must be built from the source repository and distributed only as signed Windows releases.
- The animated ECG is now a genuinely seamless SVG animation (not a GIF or simulated screenshot).

## Before it can update real users
The source repository **Summuryy/EMS-COMMAND** is private. Its GitHub Actions test artifacts cannot be downloaded anonymously by installed clients.

1. Create a dedicated **public** releases repository, e.g. `Summuryy/EMS-COMMAND-RELEASES`. Its contents will be public binaries/metadata, not application source or user records.
2. In the private source repository, add Actions variables:
   - `EMS_RELEASE_REPO` = `Summuryy/EMS-COMMAND-RELEASES`
   - `EMS_UPDATE_FEED_URL` = `https://github.com/Summuryy/EMS-COMMAND-RELEASES/releases/latest/download/`
3. Add Actions secrets:
   - `EMS_RELEASES_TOKEN` — fine-grained GitHub token scoped to the releases repo (Contents: read/write).
   - `CSC_LINK` and `CSC_KEY_PASSWORD` — valid Windows code-signing certificate and password.
4. Run **Publish signed EMS COMMAND update** with `v3.4.0` after CI passes. This builds and publishes `latest.yml`, the signed installer and its `.blockmap` files.
5. Install the signed v3.4 release once; later signed releases will be detected and downloaded in the launcher. The older v3.3 installation is missing a feed and cannot discover v3.4 itself.

Do NOT commit signing keys, tokens or passwords, and do NOT put GitHub access tokens in the installer.

**Current limitation:** The public releases repository is connected, but signing credentials are not configured, so the test GitHub Actions installers are not automatically delivered. Workflows will not release anything without those prerequisites.

## Motion diagnostics
Open Profile → Animations and turn them ON. If Windows has reduced-motion accessibility preferences enabled, continuous ECG movement is intentionally disabled. The ECG should move in the sidebar and the launcher after installing v3.4.


## Бесплатный тестовый цикл (без сертификата)

**Важно:** неподписанный тестовый установщик не является доверенным стабильным обновлением. Не публикуйте его в публичный `latest`-канал и не отключайте проверку подписи в установленном лаунчере.

1. Откройте **Actions → Windows installer (test build) → Run workflow** в приватном репозитории.
2. Дождитесь зелёного статуса и скачайте `EMS-COMMAND-Windows-Installer-UNSIGNED` из **Artifacts**.
3. CI проверяет `latest.yml`: SHA-512 и имя EXE должны совпасть с собранным установщиком. Также создаётся отдельный `.sha256` для ручной проверки.
4. На отдельной тестовой Windows-машине (или в виртуальной машине) сравните SHA-256: `Get-FileHash .\\EMS-COMMAND-Setup-*.exe -Algorithm SHA256`. Сравните значение с файлом `.sha256`.
5. Проверьте запуск и сохранение пользовательских данных, используя тестовый профиль. Тестовый установщик может показывать предупреждение Windows о неизвестном издателе.
6. **Автоматическая установка из лаунчера пока не тестируется:** существующий `electron-updater` рассчитан на подписанный стабильный канал. Для испытания обновления без сертификата потребуется отдельная тестовая сборка с явным согласием пользователя и изолированным каналом, без отключения защит стабильного приложения.

Публичный канал уже зафиксирован в workflow: `Summuryy/EMS-COMMAND-RELEASES`. Секрет `EMS_RELEASES_TOKEN` используется только в workflow публикации подписанного релиза. `CSC_LINK` и `CSC_KEY_PASSWORD` пока отсутствуют, поэтому стабильная публикация должна завершаться отказом.

Нельзя считать SHA-256 подписью издателя: хеш проверяет целостность только относительно доверенного эталона.
