/**
 * @sw-package framework
 */

const { Module } = Shopware;

// eslint-disable-next-line sw-deprecation-rules/private-feature-declarations
Shopware.Component.register('sw-settings-admin-interface', () => import('./page/sw-settings-admin-interface'));

// eslint-disable-next-line sw-deprecation-rules/private-feature-declarations
Module.register('sw-settings-admin-interface', {
    type: 'core',
    name: 'settings-admin-interface',
    title: 'sw-settings-admin-interface.general.mainMenuItemGeneral',
    description: 'sw-settings-admin-interface.general.description',
    version: '1.0.0',
    targetVersion: '1.0.0',
    color: '#9AA8B5',
    icon: 'regular-cog',
    favicon: 'icon-module-settings.png',

    routes: {
        index: {
            component: 'sw-settings-admin-interface',
            path: 'index',
            meta: {
                parentPath: 'sw.settings.index',
                privilege: 'system.system_config',
            },
        },
    },

    settingsItem: {
        group: 'general',
        to: 'sw.settings.admin.interface.index',
        icon: 'regular-layout',
        privilege: 'system.system_config',
    },
});
