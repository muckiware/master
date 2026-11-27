/**
 * @sw-package framework
 *
 * Specs of this administration that fail for known reasons and are skipped by `npm run unit:ci`.
 * Muckidrive is not a shop: these specs test shop features (product, currency, customer, ... entities,
 * removed modules like sw-category) or are broken upstream. They are technical debt - fix or delete
 * a spec and remove it from this list. Do NOT add new specs here to get a red pipeline green.
 */
/* eslint-disable max-len */
module.exports = [
    'src/app/component/base/sw-version/sw-version.spec.js',
    'src/app/component/component.spec.js',
    'src/app/component/form/select/entity/advanced-selection-entities/sw-advanced-selection-product/sw-advanced-selection-product.spec.js',
    'src/app/component/form/sw-text-editor/sw-text-editor-link-menu/sw-text-editor-link-menu.spec.js',
    'src/app/component/rule/condition-type/sw-condition-generic/sw-condition-generic.spec.js',
    'src/app/component/rule/condition-type/sw-condition-script/sw-condition-script.spec.js',
    'src/app/init-post/language.init.spec.js',
    'src/app/init/context.init.spec.js',
    'src/app/init/filter.init.spec.js',
    'src/app/main.spec.js',
    'src/app/service/entity-validation.service.spec.js',
    'src/app/service/search-preferences.service.spec.js',
    'src/core/data/changeset-generator.spec.js',
    'src/core/data/error-resolver.data.spec.js',
    'src/core/data/repository.data.spec.js',
    'src/core/service/utils/format.utils.spec.js',
    'src/meta/meta.spec.js',
    'src/module/sw-cms/elements/buy-box/component/component.spec.js',
    'src/module/sw-cms/elements/buy-box/component/sw-cms-el-buy-box.spec.js',
    'src/module/sw-cms/elements/product-box/component/component.spec.js',
    'src/module/sw-cms/mixin/sw-cms-element.mixin.spec.js',
    'src/module/sw-cms/service/cms.service.spec.js',
    'src/module/sw-extension/service/shopware-extension.service.spec.js',
    'src/module/sw-flow/service/flow-builder.service.spec.js',
    'src/module/sw-import-export/component/sw-import-export-edit-profile-modal-identifiers/sw-import-export-edit-profile-modal-identifiers.spec.js',
    'src/module/sw-import-export/component/sw-import-export-edit-profile-modal-mapping/sw-import-export-edit-profile-modal-mapping.spec.js',
    'src/module/sw-import-export/component/sw-import-export-entity-path-select/sw-import-export-entity-path-select.spec.js',
    'src/module/sw-import-export/service/importExportProfileMapping.service.spec.js',
    'src/module/sw-import-export/service/importExportUpdateByMapping.service.spec.js',
    'src/module/sw-sales-channel/page/sw-sales-channel-detail/sw-sales-channel-detail.spec.js',
    'src/module/sw-sales-channel/view/sw-sales-channel-detail-base/sw-sales-channel-detail-base.spec.js',
    'src/module/sw-settings-search/component/sw-settings-search-searchable-content/sw-settings-search-searchable-content.spec.js',
    'src/module/sw-settings-search/view/sw-settings-search-view-live-search/sw-settings-search-view-live-search.spec.js',
    'src/module/sw-settings-tag/component/sw-settings-tag-detail-assignments/sw-settings-tag-detail-assignments.spec.js',
];
