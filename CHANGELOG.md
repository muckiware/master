# Changelog

All notable changes to `muckiware/master` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow the
`version` field in `composer.json`; released versions are tagged as `v<version>`.

## [0.0.2.0] - Unreleased

### Added
- Settings page *Settings → General → Administration interface* (`sw-settings-admin-interface`, privilege
  `system.system_config`), prepared for further interface options such as a color scheme
- Main menu entries can be shown or hidden system-wide for all users, including apps, custom entities and
  plugin entries (e.g. *Facility*); the *Settings* entry is locked and can never be hidden (enforced in the
  backend as well)
- The *Frontends* block below the main menu can be shown or hidden system-wide; users without the
  `sales_channel.viewer` privilege still never see it
- API endpoint `/api/_admin/interface-settings`: `GET` for every authenticated admin user, `POST` requires the
  `system_config` ACL privileges and validates the payload
- `AdminInterfaceSettingsService` storing the settings in `system_config`
  (`MuckiwareMaster.adminInterface.hiddenMainMenuEntries`, `MuckiwareMaster.adminInterface.showFrontendsMenu`)
- Pinia store `adminInterface` and API service `adminInterfaceApiService`; the main menu and the frontends
  block update immediately after saving
- GitHub workflow `admin-unit-tests.yml` running the Jest unit tests on every pull request and on pushes to
  `main`, without database or Shopware installation
- Committed entity schema snapshot `test/_fixtures_/entity-schema.json` for the Jest environment;
  `npm run unit-setup` uses it when no generated schema exists, `npm run update-entity-schema-fixture`
  refreshes it (locally installed `muwa_*` plugin entities are excluded)
- `npm run unit:ci` (`jest.ci.config.js`) skipping the 34 known failing specs listed in
  `jest.known-failures.js` (shop features Muckidrive does not have, tracked as technical debt)
- Unit tests for the administration interface settings, the main menu filter and the frontends block

### Changed
- By default (as long as nothing has been saved) the *Content* main menu entry and the *Frontends* block are
  hidden, since Muckidrive is not a shop; hidden modules stay reachable via URL and search, access is still
  controlled by the user permissions

### Fixed
- The Jest environment works again: `test/_setup/prepare_environment.js` no longer imports stores of removed
  shop modules (category, order, product, shipping, payment, promotion), which had broken every spec
- `.jestcache/` is ignored by git

## [0.0.1.3] - 2026-11-11

### Added
- Shopware-specific SCSS color variables that were missing in the administration styles
- Module color styling (`module-colors.scss`)
- The release workflow triggers the MuckiSafe image build (`muckidrive-master-release` dispatch) after the tag
  and GitHub release exist; skipped with a warning when `MUCKISAFE_DISPATCH_TOKEN` is not set

## [0.0.1.2] - 2026-11-06

### Added
- README describing the architecture (bundle bootstrap, request flow, controllers, snippets, Vite assets, shop
  removal, migrations, console commands) and the build, update and release workflows

## [0.0.1.1] - 2026-11-06

### Added
- Release workflow: merging `main` into `release` creates the tag `v<version>` from `composer.json` and a
  GitHub release
- Migrations for the frontend view (`Migration1757500000FrontendView`, `Migration1792670843RecreateFrontendView`)
- `NullFirstRunWizardService` stub, since Muckidrive does not use the Shopware Store or the first run wizard
- Login page styling

### Changed
- Settings overview corrected, the missing extensions group is shown again

### Removed
- Remaining price and currency items in the administration

## [0.0.1.0] - 2026-10-12

First version of the customized administration for Muckidrive, based on the Shopware 6.7 administration
without shop-specific modules.

### Added
- Own `SystemInfoController` returning the version of the master bundle
- Layout overrides, brand colors, Muckidrive icons and app icon in login and main menu
- Adjustments for `muckiware/core` (selective Shopware Core loader)

### Changed
- "Sales Channel" is called "Frontend" throughout the administration
- "Shopping Experiences" is called "CMS"
- Admin labels, menu font colors and the title in the upper left corner
- `vue3-apexcharts` pinned for compatibility with `apexcharts` 4.4.0
- `SystemInfoController` adjusted to the current Shopware Core version

### Removed
- Shop-specific modules and services, among them document and login/registration settings, product stream
  controller, dashboard blocks, in-app purchase checkout items and extension items with Shopware context
- Store button when the plugin list is empty
- Shopware banner in the settings view and Shopware-specific search item types

[0.0.2.0]: https://github.com/muckiware/master/compare/v0.0.1.2...main
[0.0.1.3]: https://github.com/muckiware/master/compare/v0.0.1.2...1ccec5d
[0.0.1.2]: https://github.com/muckiware/master/compare/v0.0.1.1...v0.0.1.2
[0.0.1.1]: https://github.com/muckiware/master/releases/tag/v0.0.1.1
