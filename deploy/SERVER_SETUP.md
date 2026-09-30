# Локальный деплой Production Moscow на Mac mini

Production Moscow разворачивается только локальным self-hosted runner’ом
репозитория `productionmoscow/production-moscow`. SSH-доступ, SSH-секреты и
fallback-секреты других проектов для деплоя не используются.

Runner хранится отдельно от существующих runner’ов: его каталог —
`/Users/clevent/server/productionmoscow/runner`, launchd label —
`com.productionmoscow.github-runner`, имя — `mac-mini-productionmoscow`,
labels — `self-hosted`, `mac-mini`, `arm64`.

## Изоляция

- production-каталог: `/Users/clevent/server/sites/production-moscow`;
- релизы: `/Users/clevent/server/sites/production-moscow/releases/<commit>`;
- текущий релиз: `/Users/clevent/server/sites/production-moscow/current`;
- launchd label: `com.productionmoscow.website`;
- локальный endpoint: `127.0.0.1:3011`;
- Caddy hostnames: только `productionmoscow.ru` и `www.productionmoscow.ru`.
- внутренний парсер аренды: `/Users/clevent/server/sites/production-moscow/zoom-prokat-parser`;
- внутренние данные аренды для RAG: `/Users/clevent/server/sites/production-moscow/data/zoom-prokat-knowledge`;
- Excel-каталог аренды: `/Users/clevent/server/sites/production-moscow/data/zoom-prokat/zoom-prokat-prices.xlsx`.

Node-приложение запускается как отдельный native-процесс Mac и слушает только
`127.0.0.1:3011`. Caddy работает в Docker, поэтому отдельный bridge-контейнер
только в namespace Caddy переносит запросы Caddy на host-only endpoint. Он не
публикует порт и не перезапускает другие контейнеры.

## Одноразовая установка launchd

После первого локального релиза:

```bash
install -d -m 755 /Users/clevent/server/sites/production-moscow/logs
install -m 644 deploy/macos/com.productionmoscow.website.plist \
  "$HOME/Library/LaunchAgents/com.productionmoscow.website.plist"
launchctl bootstrap "gui/$(id -u)" \
  "$HOME/Library/LaunchAgents/com.productionmoscow.website.plist"
launchctl enable "gui/$(id -u)/com.productionmoscow.website"
launchctl kickstart -k "gui/$(id -u)/com.productionmoscow.website"
```

В Actions используется ровно такой же label и перезапускается только этот
launchd-сервис.

## Caddy

В `/Users/clevent/server/migration/caddy/Caddyfile` добавляются только эти
два блока; существующие блоки других доменов не редактируются:

```caddyfile
productionmoscow.ru {
    reverse_proxy 127.0.0.1:3011
}

www.productionmoscow.ru {
    reverse_proxy 127.0.0.1:3011
}
```

Проверка и reload выполняются без пересоздания других контейнеров:

```bash
docker_bin=/Users/clevent/.docker/bin/docker
compose_file=/Users/clevent/server/migration/compose.yaml
"$docker_bin" compose -f "$compose_file" exec -T edge \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
"$docker_bin" compose -f "$compose_file" exec -T edge \
  caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

## Проверки

```bash
curl -fsS http://127.0.0.1:3011/
curl -I https://productionmoscow.ru/
curl -I https://www.productionmoscow.ru/
```

Публикация использует только уже настроенные DNS-записи. DNS из этого
репозитория или workflow не изменяется.

## Знания ассистента и каталог аренды

Еженедельный launchd-процесс `com.productionmoscow.knowledge-crawler` обновляет
два источника знаний: страницы Production Moscow и каталог `zoom-prokat.ru`.
Парсер аренды сохраняет цену за сутки, разбивает каталог на небольшие Markdown-
фрагменты и кладёт их в RAG ассистента. Наличие, комплектность, даты и финальные
условия аренды не считаются подтверждёнными автоматически и требуют проверки
продюсером/прокатом.
