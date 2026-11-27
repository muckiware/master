/**
 * @sw-package framework
 */
import { mount } from '@vue/test-utils';

const getSettings = jest.fn();
const saveSettings = jest.fn();

async function createWrapper(privileges = ['system.system_config']) {
    global.activeAclRoles = privileges;

    return mount(await wrapTestComponent('sw-settings-admin-interface', { sync: true }), {
        global: {
            provide: {
                customEntityDefinitionService: {
                    getMenuEntries: () => [
                        { id: 'custom-entity/ce_foo', path: 'sw.custom.entity.index', label: 'ce_foo.moduleTitle' },
                    ],
                },
            },
            stubs: {
                'sw-page': {
                    template: `
                    <div>
                        <slot name="smart-bar-actions"></slot>
                        <slot name="content"></slot>
                    </div>`,
                },
                'sw-card-view': { template: '<div><slot></slot></div>' },
                'sw-search-bar': true,
                'sw-button-process': {
                    template: '<button class="sw-button-process" @click="$emit(\'click\')"><slot></slot></button>',
                },
            },
        },
    });
}

describe('module/sw-settings-admin-interface/page/sw-settings-admin-interface', () => {
    beforeAll(() => {
        // eslint-disable-next-line sw-deprecation-rules/private-feature-declarations
        Shopware.Service().register('adminInterfaceApiService', () => ({ getSettings, saveSettings }));
    });

    beforeEach(() => {
        saveSettings.mockReset();
        getSettings.mockResolvedValue({
            hiddenMainMenuEntries: ['sw-content'],
            lockedMainMenuEntries: ['sw-settings'],
            showFrontendsMenu: true,
        });

        Shopware.Store.get('menuItem').menuItems = [];
        Shopware.Store.get('adminMenu').adminModuleNavigation = [
            { id: 'sw-dashboard', path: 'sw.dashboard.index', label: 'Dashboard', position: 10 },
            { id: 'sw-content', label: 'Content', position: 20 },
            { id: 'sw-cms', parent: 'sw-content', path: 'sw.cms.index', label: 'CMS' },
            { id: 'sw-empty-container', label: 'Empty container', position: 30 },
            { id: 'sw-settings', path: 'sw.settings.index', label: 'Settings', position: 80 },
        ];
    });

    it('lists only top level entries that have a target or children', async () => {
        const wrapper = await createWrapper();
        await flushPromises();

        const ids = wrapper.vm.mainMenuEntries.map((entry) => entry.menuId);

        expect(ids).toEqual([
            'sw-dashboard',
            'sw-content',
            'sw-settings',
            'custom-entity/ce_foo',
        ]);
    });

    it('reflects the loaded settings and locks the settings entry', async () => {
        const wrapper = await createWrapper();
        await flushPromises();

        const byId = (id) => wrapper.vm.mainMenuEntries.find((entry) => entry.menuId === id);

        expect(wrapper.vm.isVisible(byId('sw-content'))).toBe(false);
        expect(wrapper.vm.isVisible(byId('sw-dashboard'))).toBe(true);
        expect(wrapper.vm.isLocked(byId('sw-settings'))).toBe(true);

        wrapper.vm.onToggleEntry(byId('sw-settings'), false);
        expect(wrapper.vm.hiddenMainMenuEntries).not.toContain('sw-settings');
    });

    it('saves hidden entries and the frontends menu flag', async () => {
        saveSettings.mockResolvedValue({
            hiddenMainMenuEntries: ['sw-dashboard'],
            lockedMainMenuEntries: ['sw-settings'],
            showFrontendsMenu: false,
        });

        const wrapper = await createWrapper();
        await flushPromises();

        const byId = (id) => wrapper.vm.mainMenuEntries.find((entry) => entry.menuId === id);
        wrapper.vm.onToggleEntry(byId('sw-content'), true);
        wrapper.vm.onToggleEntry(byId('sw-dashboard'), false);
        await wrapper.setData({ showFrontendsMenu: false });

        await wrapper.find('.sw-button-process').trigger('click');
        await flushPromises();

        expect(saveSettings).toHaveBeenCalledWith({
            hiddenMainMenuEntries: ['sw-dashboard'],
            showFrontendsMenu: false,
        });
        expect(Shopware.Store.get('adminInterface').showFrontendsMenu).toBe(false);
    });
});
