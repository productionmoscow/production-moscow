# Автоматический деплой ProductionMoscow.ru

После настройки push в `main` запускает GitHub Actions. Workflow проверяет
lint, production-сборку и rendered HTML-тесты, затем отправляет готовый `dist`
на VPS, переключает симлинк `current` на новый release и перезапускает отдельный
процесс `productionmoscow.service`.

Сайт работает отдельно от CLEVENT и других проектов:

- каталог: `/var/www/productionmoscow.ru`;
- внутренний порт Node.js: `3011`;
- systemd-сервис: `productionmoscow.service`;
- пользователь деплоя: `productionmoscow`.

## Одноразовая настройка VPS

Команды ниже выполняются на сервере с правами администратора.

1. Установить Node.js `22.13.x`, `npm`, `rsync` и Nginx.
2. Создать отдельного пользователя и каталоги:

   ```bash
   sudo useradd --create-home --shell /bin/bash productionmoscow
   sudo install -d -o productionmoscow -g productionmoscow /var/www/productionmoscow.ru/releases
   ```

3. Добавить публичный SSH-ключ GitHub Actions в
   `/home/productionmoscow/.ssh/authorized_keys`.
4. Скопировать `productionmoscow.service.example` в
   `/etc/systemd/system/productionmoscow.service`, затем выполнить:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable productionmoscow.service
   ```

5. Скопировать `productionmoscow.sudoers.example` в
   `/etc/sudoers.d/productionmoscow`, выставить права и проверить файл:

   ```bash
   sudo chmod 440 /etc/sudoers.d/productionmoscow
   sudo visudo -cf /etc/sudoers.d/productionmoscow
   ```

6. Скопировать `productionmoscow.nginx.example` в конфигурацию Nginx,
   включить сайт и проверить конфигурацию:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. После проверки DNS выпустить сертификат Let's Encrypt:

   ```bash
   sudo certbot --nginx -d productionmoscow.ru -d www.productionmoscow.ru --redirect
   ```

GitHub Actions не получает права администратора для управления Nginx или
сертификатами. Ему разрешён только перезапуск и проверка конкретного systemd-
сервиса.

## Secrets репозитория GitHub

В `productionmoscow/production-moscow` можно добавить отдельные Actions
secrets:

- `PRODUCTIONMOSCOW_SSH_HOST` — адрес VPS;
- `PRODUCTIONMOSCOW_SSH_USER` — `productionmoscow`;
- `PRODUCTIONMOSCOW_SSH_PORT` — обычно `22`;
- `PRODUCTIONMOSCOW_SSH_KEY` — приватный ключ для отдельного deploy key;
- `PRODUCTIONMOSCOW_DEPLOY_PATH` — `/var/www/productionmoscow.ru`.

После этого любой push в `main` будет автоматически выкатывать новую версию.
Ручной запуск доступен во вкладке Actions через `workflow_dispatch`.

Для переходного запуска workflow также умеет использовать общие secrets,
которые уже применяются в проектах Антона: `ANTON_SSH_HOST`,
`ANTON_SSH_USER`, `ANTON_SSH_PORT` и `ANTON_SSH_KEY`. Отдельные
`PRODUCTIONMOSCOW_*` имеют приоритет, если они заведены. Значение пути по
умолчанию — `/var/www/productionmoscow.ru`.
