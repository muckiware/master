/**
 * @sw-package discovery
 */

import { mount } from '@vue/test-utils';
import 'src/app/component/structure/sw-admin-menu';
import swAdminMenuExtension from 'src/module/sw-sales-channel/component/structure/sw-admin-menu-extension';
import createMenuService from 'src/app/service/menu.service';

// Turn off known errors
import { missingGetListMethod } from 'test/_helper_/allowedErrors';

Shopware.Component.register('sw-admin-menu-extension', swAdminMenuExtension);

global.allowedErrors = [missingGetListMethod];

const menuService = createMenuService(Shopware.Module);
Shopware.Service().register('menuService', () => menuService);

async function createWrapper() {
    return mount(await wrapTestComponent('sw-admin-menu', { sync: true }), {
        global: {
            stubs: {
                'sw-version': true,
                'sw-loader': true,
                'sw-avatar': true,
                'sw-shortcut-overview': true,
                'sw-sales-channel-menu': true,
                'sw-admin-menu-item': true,
            },
            provide: {
                loginService: {
                    notifyOnLoginListener: () => {},
                },
                userService: {
                    getUser: () => Promise.resolve({ data: {} }),
                },
                menuService,
                appModulesService: {
                    fetchAppModules: () => Promise.resolve([]),
                },
                customEntityDefinitionService: {
                    getMenuEntries: () => {
                        return [];
                    },
                },
            },
        },
    });
}

describe('module/sw-sales-channel/component/structure/sw-admin-menu-extension', () => {
    beforeAll(() => {
        Shopware.Store.get('session').setCurrentUser({});
    });

    beforeEach(() => {
        Shopware.Store.get('adminInterface').$reset();
    });

    it('should not show the sw-sales-channel-menu when privilege does not exist', async () => {
        global.activeAclRoles = [];
        const wrapper = await createWrapper();
        await wrapper.vm.$nextTick();
        const swSalesChannelMenu = wrapper.find('sw-sales-channel-menu-stub');

        expect(swSalesChannelMenu.exists()).toBeFalsy();
    });

    it('should show the sw-sales-channel-menu when privilege exists and it is enabled', async () => {
        global.activeAclRoles = ['sales_channel.viewer'];
        const wrapper = await createWrapper();
        Shopware.Store.get('adminInterface').showFrontendsMenu = true;
        await wrapper.vm.$nextTick();
        const swSalesChannelMenu = wrapper.find('sw-sales-channel-menu-stub');

        expect(swSalesChannelMenu.exists()).toBeTruthy();
    });

    it('should not show the sw-sales-channel-menu when it is hidden in the admin interface settings', async () => {
        global.activeAclRoles = ['sales_channel.viewer'];
        const wrapper = await createWrapper();
        Shopware.Store.get('adminInterface').showFrontendsMenu = false;
        await wrapper.vm.$nextTick();

        expect(wrapper.find('sw-sales-channel-menu-stub').exists()).toBeFalsy();
    });

    it('should not show the sw-sales-channel-menu by default', async () => {
        global.activeAclRoles = ['sales_channel.viewer'];
        const wrapper = await createWrapper();
        await wrapper.vm.$nextTick();

        expect(wrapper.find('sw-sales-channel-menu-stub').exists()).toBeFalsy();
    });
});
