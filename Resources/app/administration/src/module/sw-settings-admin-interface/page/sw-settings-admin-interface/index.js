/**
 * @sw-package framework
 */
import template from './sw-settings-admin-interface.html.twig';
import './sw-settings-admin-interface.scss';

const { Mixin } = Shopware;

// eslint-disable-next-line sw-deprecation-rules/private-feature-declarations
export default {
    template,

    inject: [
        'acl',
        'customEntityDefinitionService',
    ],

    mixins: [
        Mixin.getByName('notification'),
    ],

    data() {
        return {
            isLoading: false,
            isSaveSuccessful: false,
            hiddenMainMenuEntries: [],
            showFrontendsMenu: true,
        };
    },

    metaInfo() {
        return {
            title: this.$createTitle(),
        };
    },

    computed: {
        adminInterfaceStore() {
            return Shopware.Store.get('adminInterface');
        },

        adminMenuStore() {
            return Shopware.Store.get('adminMenu');
        },

        mainMenuEntries() {
            const entries = [
                ...this.adminMenuStore.adminModuleNavigation,
                ...(this.adminMenuStore.appModuleNavigation ?? []),
                ...this.customEntityDefinitionService.getMenuEntries(),
            ];
            // Like the main menu itself: top-level entries without a target and without children are not shown.
            const parentIds = new Set([
                ...entries.map((entry) => entry.parent),
                ...Shopware.Store.get('menuItem').menuItems.map((item) => item.parent ?? 'sw-extension'),
            ]);
            const seen = new Set();

            return entries
                .filter((entry) => !entry.parent)
                .map((entry) => ({ ...entry, menuId: entry.id || entry.path }))
                .filter((entry) => {
                    if (!entry.menuId || seen.has(entry.menuId)) {
                        return false;
                    }
                    seen.add(entry.menuId);

                    return Boolean(entry.path || entry.link) || parentIds.has(entry.menuId);
                })
                .sort((first, second) => (first.position ?? 1000) - (second.position ?? 1000));
        },
    },

    created() {
        this.createdComponent();
    },

    methods: {
        async createdComponent() {
            this.isLoading = true;
            await this.adminInterfaceStore.loadSettings();
            this.applyStoreState();
            this.isLoading = false;
        },

        applyStoreState() {
            this.hiddenMainMenuEntries = [...this.adminInterfaceStore.hiddenMainMenuEntries];
            this.showFrontendsMenu = this.adminInterfaceStore.showFrontendsMenu;
        },

        getEntryLabel(entry) {
            if (entry.label instanceof Object) {
                return entry.label.translated ? entry.label.label : this.$tc(entry.label.label);
            }

            return this.$tc(entry.label);
        },

        isLocked(entry) {
            return this.adminInterfaceStore.lockedMainMenuEntries.includes(entry.menuId);
        },

        isVisible(entry) {
            return this.isLocked(entry) || !this.hiddenMainMenuEntries.includes(entry.menuId);
        },

        onToggleEntry(entry, visible) {
            if (this.isLocked(entry)) {
                return;
            }

            const others = this.hiddenMainMenuEntries.filter((id) => id !== entry.menuId);
            this.hiddenMainMenuEntries = visible ? others : [...others, entry.menuId];
        },

        saveFinish() {
            this.isSaveSuccessful = false;
        },

        async onSave() {
            this.isSaveSuccessful = false;
            this.isLoading = true;

            try {
                await this.adminInterfaceStore.saveSettings({
                    hiddenMainMenuEntries: this.hiddenMainMenuEntries,
                    showFrontendsMenu: this.showFrontendsMenu,
                });
                this.applyStoreState();
                this.isSaveSuccessful = true;
                this.createNotificationSuccess({
                    message: this.$tc('sw-settings-admin-interface.general.messageSaveSuccess'),
                });
            } catch (error) {
                this.createNotificationError({
                    message: error?.message ?? String(error),
                });
            } finally {
                this.isLoading = false;
            }
        },
    },
};
