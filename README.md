# EdPlatform

API освітньої платформи на NestJS + TypeScript з PostgreSQL (TypeORM), упакований у Docker.

## Вимоги

- Docker з Compose v2 (для запуску в контейнерах)
- Node.js 24 (≥ 24.15.0) і npm 11 (для запуску без Docker, тестів і lint). З nvm достатньо виконати `nvm use`: версію задає `.nvmrc`.

Неправильна версія зупиняє роботу одразу:

- `npm ci` / `npm install` падають з `EBADENGINE` (`engines` у `package.json` + `engine-strict=true` у `.npmrc`);
- `npm run ...` падає з `EBADDEVENGINES` (`devEngines`). Цю перевірку виконує npm ≥ 10.9, старіші версії npm її ігнорують;
- Docker-збірка з іншою мажорною версією Node (`--build-arg NODE_VERSION=...`) падає на `npm ci`.

## Змінні оточення

```bash
cp .env.example .env
```

`.env` обов'язковий: проєкт працює за принципом **fail fast**. Якщо обов'язкової змінної немає, вона порожня або має некоректне значення, нічого не запуститься:

- `docker compose` одразу завершується з помилкою на кшталт `required variable DB_NAME is missing a value: DB_NAME is required, see .env.example`;
- застосунок перевіряє оточення під час старту (Joi-схема в `src/config/env.validation.ts`) і падає ще до відкриття порту, перелічивши всі проблеми разом:

  ```
  Error: Invalid environment configuration:
  ✖ DB_PASSWORD is required
    → at DB_PASSWORD
  ✖ DB_PORT must be a valid port
    → at DB_PORT
  ```

Той самий підхід застосовано до вхідних даних API: глобальний `ValidationPipe` з class-validator + class-transformer (`whitelist`, `forbidNonWhitelisted`, `transform`) відхиляє запит із `400 Bad Request`, якщо тіло, query чи параметри не відповідають DTO або містять зайві поля.

`docker compose` підхоплює `.env` автоматично, застосунок без Docker читає його через `@nestjs/config`. Змінні, задані в самому оточенні, мають пріоритет над `.env`.

| Змінна              | Обов'язкова     | За замовчуванням | Опис                                                                 |
| ------------------- | --------------- | ---------------- | -------------------------------------------------------------------- |
| `NODE_ENV`          | ні              | `development`    | `development`, `production` або `test`                               |
| `PORT`              | ні              | `3000`           | порт API (у контейнері й на хості)                                   |
| `DB_USER`           | так             |                  | користувач Postgres                                                  |
| `DB_PASSWORD`       | так             |                  | пароль Postgres                                                      |
| `DB_NAME`           | так             |                  | назва бази                                                           |
| `DB_HOST`           | так, без Docker | `db` у compose   | хост Postgres                                                        |
| `DB_PORT`           | так, без Docker | `5432` у compose | порт Postgres                                                        |
| `DB_LOGGING`        | ні              | `false`          | `true` вмикає логування SQL-запитів TypeORM (зручно, щоб бачити N+1) |
| `DB_PUBLISHED_PORT` | ні              | `5435`           | лише dev: порт Postgres на хості                                     |

## Запуск для розробки

```bash
cp .env.example .env   # один раз
docker compose up -d
```

Compose автоматично підхоплює `docker-compose.override.yml`:

- API збирається зі стадії `dev` і працює в режимі `nest start --watch`;
- `./src` змонтовано в контейнер, тож зміни в коді підхоплюються без перезбірки;
- Postgres доступний з хоста на `localhost:5435`.

Перевірка:

```bash
curl http://localhost:3000/api/health      # {"status":"ok","uptime":...}
curl http://localhost:3000/api/health/db   # {"status":"ok","db":"up"}
docker compose logs -f api             # логи застосунку
```

Після зміни `package.json` dev-образ треба перезібрати: `docker compose up -d --build`.

### Без Docker

```bash
npm ci
npm run start:dev
```

Потрібен `.env` з `DB_HOST=localhost` і `DB_PORT=5435` (як у `.env.example`). Postgres можна підняти окремо: `docker compose up -d db`.

## Запуск у production

```bash
docker compose -f docker-compose.yml up -d --build
```

Використовується лише базовий `docker-compose.yml`: стадія `runner` (скомпільований `dist/` і тільки production-залежності), процес від non-root користувача `node`, без bind mount, порт бази назовні не відкритий. Стан контейнера перевіряє `HEALTHCHECK` через `GET /api/health`.

Міграції в production запускаються явно, після деплою нової версії:

```bash
docker compose -f docker-compose.yml exec api npm run migration:run
```

> Для production задайте `DB_USER`, `DB_PASSWORD` і `DB_NAME` у `.env` або в оточенні сервера. Значення `postgres` з `.env.example` годяться лише для локальної розробки.

Без Docker:

```bash
npm ci
npm run build
npm run start:prod
```

## База даних і міграції

ORM — TypeORM. Схема бази змінюється **лише через міграції**: `synchronize` вимкнено, тож зміни в entity-класах самі по собі нічого в базі не змінюють.

Міграції живуть у `src/database/migrations/`. CLI TypeORM працює зі скомпільованими файлами (`dist/database/data-source.js`), тому перед `run`/`revert`/`show` потрібен актуальний `dist/`: його створює `npm run build` або запущений `npm run start:dev`.

| Команда                                                          | Що робить                                                            |
| ---------------------------------------------------------------- | -------------------------------------------------------------------- |
| `npm run migration:generate -- src/database/migrations/AddUsers` | збирає проєкт і генерує міграцію з різниці між entity та схемою бази |
| `npm run migration:create -- src/database/migrations/SeedRoles`  | створює порожню міграцію для ручного SQL                             |
| `npm run migration:run`                                          | застосовує всі нові міграції                                         |
| `npm run migration:revert`                                       | відкочує останню міграцію                                            |
| `npm run migration:show`                                         | показує, які міграції застосовано                                    |

Нова сутність: створіть `*.entity.ts`, підключіть її через `TypeOrmModule.forFeature([Entity])` у модулі фічі (`autoLoadEntities` зареєструє її в підключенні), згенеруйте й застосуйте міграцію.

## Тести

```bash
npm test                     # unit-тести, база не потрібна
docker compose up -d db      # e2e-тестам потрібен Postgres
npm run test:e2e
```

e2e-тести беруть параметри підключення з `.env`, але працюють в окремій базі `edplatform_test`. Її створює скрипт `docker/postgres/init/` при **першому** запуску dev-volume. Якщо volume створено раніше, створіть базу вручну:

```bash
docker compose exec db createdb -U postgres edplatform_test
```

## Зупинка

| Команда                  | Що робить                                                   |
| ------------------------ | ----------------------------------------------------------- |
| `docker compose down`    | зупиняє стек, **дані бази зберігаються** у volume `db-data` |
| `docker compose down -v` | зупиняє стек і **видаляє дані** бази                        |

## Ендпоінти

Усі маршрути мають глобальний префікс `/api` (`setupApp` у `src/app.setup.ts`, використовується і в `main.ts`, і в e2e-тестах).

| Метод | Шлях             | Відповідь                                                                                                          |
| ----- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| GET   | `/api`           | `Hello World!`                                                                                                     |
| GET   | `/api/health`    | `200 {"status":"ok","uptime":...}`: liveness, процес живий (використовує `HEALTHCHECK`)                            |
| GET   | `/api/health/db` | `200 {"status":"ok","db":"up"}` або `503 {"status":"error","db":"down"}`: readiness, база відповідає на `SELECT 1` |

## Скрипти

| Команда               | Що робить                                                      |
| --------------------- | -------------------------------------------------------------- |
| `npm run start:dev`   | запуск з hot reload                                            |
| `npm run build`       | компіляція в `dist/`                                           |
| `npm run start:prod`  | запуск скомпільованого `dist/main`                             |
| `npm test`            | unit-тести (Vitest)                                            |
| `npm run test:e2e`    | e2e-тести (потрібен Postgres)                                  |
| `npm run test:cov`    | unit-тести з покриттям                                         |
| `npm run lint`        | oxlint                                                         |
| `npm run format`      | prettier                                                       |
| `npm run migration:*` | міграції, див. [База даних і міграції](#база-даних-і-міграції) |
