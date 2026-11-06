# muckiware/master

Customized Shopware 6.7 Administration for [Muckidrive](../../../CLAUDE.md). `muckiware/master` replaces
`shopware/administration`: it ships the admin backend (controllers, snippets, routing, Vite integration) and
the Vue 3 admin application, with all shop specific modules (products, orders, customers, currencies, …)
removed.

It runs on top of [`muckiware/core`](../core/README.md), which loads `shopware/core` without Checkout and
Storefront.

```
shopware/core ~v6.7      ← DAL, DI, events, Admin API (vendor)
muckiware/core           ← selective loader of shopware/core
muckiware/master         ← this package: administration without shop modules
custom/plugins/*         ← project specific plugins (may ship their own admin code)
```

- Package: `muckiware/master` (type `library`, MIT)
- Namespace: `Muckiware\Master\` (PSR-4, package root)
- Bundle: `Muckiware\Master\Administration` (registered in `config/bundles.php`)
- PHP: 8.2 – 8.5, Node: 20 – 24, npm ≥ 10
- Installed as composer path repository (`custom/muckiware/*`, symlinked to `vendor/muckiware/master`)

## Contents

| Path | Purpose |
|---|---|
| `Administration.php` | Bundle class — loads `Resources/config`, registers `PentatrionViteBundle` and the migration compiler pass |
| `Controller/` | Admin and API controllers (admin entry page, snippets, search, system info, user config, …) |
| `Framework/` | Route scope, 404 handling, known IPs, readiness check, Vite file accessor |
| `Snippet/` | Snippet finder (with cache decorator) and the `app_administration_snippet` entity for app snippets |
| `Notification/` | `notification` entity (deprecated, `@deprecated tag:v6.8.0`) |
| `Store/` | `NullFirstRunWizardService` — disables the First Run Wizard |
| `Migration/` | Administration migrations (`V6_4`, `V6_7`) |
| `Command/` | Cleanup commands for build artifacts |
| `Core/` | Decorators for shop services (Cart, Cache, SalesChannelProxy) — **inactive**, commented out in `services.xml` |
| `Resources/config/` | `services.xml`, `routes.xml`, `packages/pentatrion_vite.yaml` |
| `Resources/views/` | Twig templates of the admin HTML shell (`index.html.twig`, `error-404.html.twig`) |
| `Resources/app/administration/` | The Vue admin application (sources, Vite build, Jest tests) |
| `Resources/public/administration/` | Build output (not versioned) |

## How it works

### 1. Bundle bootstrap

`Administration::build()` loads the bundle's default config (`Resources/config/services.xml`,
`routes.xml`, `packages/*.yaml`) and adds `AdministrationMigrationCompilerPass`. The compiler pass adds
every existing `Migration/V6_x` folder to the matching Shopware migration source
(`MigrationSource.core.V6_x`), so the admin migrations run together with the core migrations
(`bin/console database:migrate --all`).

`getAdditionalBundles()` registers `PentatrionViteBundle`, which renders the Vite entry points into the
admin HTML.

### 2. Request flow

```
GET /admin                    → AdministrationController::index()   renders index.html.twig
                                  └─ vite_entry_script_tags('administration') → JS/CSS of admin + plugins
GET /api/_admin/snippets      → SnippetFinder (cached)              translations for the Vue app
GET /api/_systeminfo/config   → SystemInfoController                versions, bundles, admin worker settings
… all other data              → Shopware Admin API (/api/*)         DAL repositories, actions
```

The admin path comes from `SHOPWARE_ADMINISTRATION_PATH_NAME` (parameter
`shopware_administration.path_name`, default `admin`). `AdministrationRouteScope` (`administration`) allows
routes below the admin path and `/api`. `AdministrationNotFoundSubscriber` renders `error-404.html.twig`
for unknown admin URLs.

### 3. Controllers

| Controller | Routes | Purpose |
|---|---|---|
| `AdministrationController` | `/{admin}`, `/{admin}/{pluginName}/index.html`, `/api/_admin/snippets`, `locales`, `known-ips`, `reset-excluded-search-term`, `check-customer-email-valid`, `sanitize-html` | Admin HTML shell, i18n, plugin iframes, helper actions |
| `AdminSearchController` | `POST /api/_admin/search` | Global admin search via `AdminSearcher` (DAL) |
| `AdminTagController` | `POST /api/_admin/tag-filter-ids` | Tag filter for listings |
| `UserConfigController` | `GET/POST/PATCH /api/_info/config-me` | Per-user admin settings (`user_config`) |
| `SystemInfoController` | `/api/_systeminfo/config`, `/api/_systeminfo/version` | Core and master version, loaded bundles/apps and their assets, feature settings |
| `AdminExtensionApiController` | `/api/_action/extension-sdk/run-action`, `sign-uri` | Meteor Admin SDK actions for apps |
| `NotificationController` | (API scope) | Admin notifications |

`SystemInfoController` reports both `coreVersion` (Shopware) and `masterVersion` (read from this package's
`composer.json`), and returns the JS/CSS entry points of every Shopware bundle so the admin can load plugin
code at runtime.

### 4. Snippets (i18n)

`SnippetFinder` collects `administration.json` / `<locale>.json` files from the installed translations,
the Shopware core, all plugins and Meteor bundles, and merges app snippets stored in the
`app_administration_snippet` table. `CachedSnippetFinder` decorates it.

App snippets are maintained by subscribers:

- `Snippet\AppLifecycleSubscriber` — on app install/update, reads `Resources/app/administration/snippet/*.json`
  of the app and persists them.
- `Framework\App\Subscriber\SystemLanguageChangedSubscriber` — swaps the locale of app snippets when the
  system language changes.

### 5. Vite asset handling

`ViteFileAccessorDecorator` decorates `pentatrion_vite.file_accessor`. It reads
`Resources/public/administration/.vite/{manifest,entrypoints}.json` of **each Shopware bundle** (the
`_default` config maps to this bundle), so the admin and every plugin are delivered as separate Vite builds.
Assets are published to `public/bundles/<bundle>/administration/` by `assets:install`
(`build_directory: bundles/muckiware/master`).

### 6. Shop removal

Muckidrive has no shop. In this package that means:

- **First Run Wizard / Store**: `FirstRunWizardService` is replaced by `NullFirstRunWizardService`
  (`frwShouldRun()` always returns `false`).
- **Sales channel → Frontend**: the admin module `sw-sales-channel` is registered as `sw-frontend`
  (entity `frontend`, routes `sw.frontend.*`). The migrations `Migration1757500000FrontendView` and
  `Migration1792670843RecreateFrontendView` create the database views `frontend` and
  `frontend_translation` on top of `sales_channel`. Because MySQL expands `SELECT *` when a view is created,
  the view must be recreated whenever Shopware adds columns to `sales_channel`.
- **Shop decorators**: the classes in `Core/` (Cart, Cache, SalesChannelProxy, CleanPersonalData) are kept
  for reference but not registered.
- **Admin modules**: commerce modules and settings were removed from the Vue app (see below).

### 7. Migrations

| Migration | Purpose |
|---|---|
| `V6_4/Migration1636121186CopySalesChannelIdsIntoUserConfig` | Copies sales channel favorites into `user_config` |
| `V6_4/Migration1660813696AddAppAdministrationSnippet` | Creates `app_administration_snippet` |
| `V6_7/Migration1737472122TokenUser` | Creates `oauth_user` (SSO tokens) |
| `V6_7/Migration1744203319MailTemplate` | Adds the mail template `admin_sso_user_invite` |
| `V6_7/Migration1757057005MailTemplate` | Updates the `admin_sso_user_invite` template |
| `V6_7/Migration1757500000FrontendView` | Creates the `frontend` / `frontend_translation` views |
| `V6_7/Migration1792670843RecreateFrontendView` | Recreates `frontend` with the current `sales_channel` columns |

### 8. Console commands

| Command | Purpose |
|---|---|
| `administration:delete-files-after-build` | Deletes unnecessary administration files after the build |
| `administration:delete-extension-local-public-files` | Deletes the local public folder of extensions (run after `assets:install`) |

## Admin application (`Resources/app/administration`)

Fork of the Shopware 6.7 admin app: TypeScript/JavaScript, Vue 3 with Twig.js templates (no SFCs — the
component factory builds components at runtime so plugins can extend/override them), Pinia, Vue Router,
Axios, Vite, Jest. Branding: snippet `textShopwareAdmin` = "Muckiware Administration", SCSS variable
`$color-muckiware-brand-500`.

### Boot sequence

```
src/index.ts          → global SCSS, window.Shopware = src/core/shopware.ts
src/app/main.ts       → registers services and the VueAdapter
src/app/init-pre/     → API services, state, Pinia
src/app/init/         → http, components, modules, router, locale, repositories, menu, extension SDK
src/app/init-post/    → language, worker, usage data
```

| Folder | Purpose |
|---|---|
| `src/core/` | Framework code without Vue: Shopware global, application, factories, data/repository, extension API, workers |
| `src/app/` | Vue specific code: global components, init steps, stores, router, mixins, directives, filters, snippets, SCSS |
| `src/module/` | Feature modules (auto-registered via `import.meta.glob` in `src/module/index.js`) |
| `src/meta/` | Generated data sets / position identifiers for the Meteor Admin SDK |

### Modules

Available: `sw-dashboard`, `sw-cms` (incl. `sw-landing-page`), `sw-media`, `sw-mail-template`, `sw-flow`,
`sw-property`, `sw-custom-entity`, `sw-import-export`, `sw-integration`, `sw-extension`, `sw-extension-sdk`,
`sw-users-permissions`, `sw-profile`, `sw-login`, `sw-inactivity-login`, `sw-privilege-error`,
`sw-sales-channel` (as `sw-frontend`) and the settings modules `basic-information`, `cache`, `custom-field`,
`language`, `logging`, `mailer`, `media`, `message-stats`, `rule`, `search`, `snippet`, `tag`.

Removed compared to the stock Shopware admin: product, product stream, category, manufacturer, order,
customer, promotion, review, newsletter recipient, bulk edit, first run wizard, my apps and the settings for
currency, tax, shipping, payment, country, delivery time, number range, salutation, units, customer group,
document, listing, SEO, sitemap, cart, address, login/registration, newsletter, store, usage data, updates.

> Some shop leftovers are still in the code (product export templates in `sw-sales-channel`,
> `ProductStreamConditionService`, `sw-category-tree-field`). Remove them step by step when touching the code.

### Plugin admin code

`bin/console bundle:dump` writes `var/plugins.json`. The Vite build (`build/plugins.vite.ts`) builds every
bundle's `Resources/app/administration/src/main.{js,ts}` into `<bundle>/Resources/public/administration`.
At runtime `/api/_systeminfo/config` lists these entry points and the admin loads them. Apps use the Meteor
Admin SDK (`@shopware-ag/meteor-admin-sdk`).

## Build & development

From the project root:

```bash
bin/build-administration.sh     # bundle:dump, feature:dump, npm install (admin + plugins), entity schema, build, assets:install
bin/watch-administration.sh     # Vite dev server with hot reload
bin/build-js.sh                 # build all JS assets
```

Inside `Resources/app/administration`:

| Script | Purpose |
|---|---|
| `npm run build` | Production build (`build.ts` → `vite build` + plugin builds) |
| `npm run dev` | Dev servers for admin and plugins (port 5173 or `ADMIN_PORT`, proxies `/api` to `APP_URL`) |
| `npm run unit-setup` | Generate the component import map — required once before `npm run unit` |
| `npm run unit` | Jest unit tests (specs live next to the code as `*.spec.js`) |
| `npm run lint` / `lint:all` | ESLint (JS/TS/Twig), Stylelint, TypeScript check |

Useful environment variables: `SHOPWARE_ADMIN_BUILD_ONLY_EXTENSIONS=1` (build plugins only),
`SKIP_<PLUGIN_NAME>=1` (skip a plugin in `build-administration.sh`), `SHOPWARE_SKIP_ASSET_COPY`,
`SHOPWARE_SKIP_ENTITY_SCHEMA_DUMP`, `SHOPWARE_SKIP_BUNDLE_DUMP`.

## Updating Shopware

When `shopware/core` is updated:

1. Compare controllers, `Snippet/`, `Framework/` and `services.xml` with `src/Administration` of the
   target Shopware version (upstream repository `shopware/shopware`; it is not installed in `vendor/`) —
   constructor arguments, new routes.
2. Port relevant admin app changes from the upstream `Resources/app/administration` without re-adding
   shop modules.
3. If Shopware added columns to `sales_channel`, add a migration that recreates the `frontend` view.
4. Rebuild the admin (`bin/build-administration.sh`) and run `npm run unit`.

## Release

`.github/workflows/create-release.yml` creates the tag `v{version}` (from `composer.json`) and a GitHub
release when `main` is merged into the `release` branch. Use a regular merge — squash/rebase merges are not
detected. Bump `version` in `composer.json` before merging.

## License

MIT — see [LICENSE](LICENSE).
