# Production Moscow

Сайт видеопродакшна полного цикла Production Moscow: съёмка мероприятий,
промо-видео, корпоративные фильмы и прямые трансляции.

## Локальный запуск

Нужен Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Production-сборка проверяется командами:

```bash
npm run build
npm test
```

## Деплой на VPS

Push в `main` автоматически запускает GitHub Actions: workflow проверяет lint,
production-сборку и rendered HTML-тесты, затем выкатывает новый release на VPS
и перезапускает отдельный сервис ProductionMoscow. Одноразовая настройка
сервера и список GitHub Secrets описаны в
[`deploy/SERVER_SETUP.md`](deploy/SERVER_SETUP.md).

Основные страницы: `/`, `/case`, `/stream`, `/event`, `/contact` и `/conf`.
Исходные тексты и ссылки на видео сохранены с productionmoscow.ru, а все
страницы собраны в единой визуальной системе: Cloud Dancer, Viva Magenta,
жирная Helvetica и IBM Plex Mono.
