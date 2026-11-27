/**
 * @sw-package framework
 * @private
 * @description System-wide administration interface settings (main menu visibility, frontends menu block,
 * later e.g. color scheme).
 */

interface AdminInterfaceSettings {
    hiddenMainMenuEntries: string[];
    lockedMainMenuEntries: string[];
    showFrontendsMenu: boolean;
}

type AdminInterfaceSettingsUpdate = Partial<Pick<AdminInterfaceSettings, 'hiddenMainMenuEntries' | 'showFrontendsMenu'>>;

interface AdminInterfaceApiService {
    getSettings(): Promise<AdminInterfaceSettings>;
    saveSettings(settings: AdminInterfaceSettingsUpdate): Promise<AdminInterfaceSettings>;
}

const DEFAULT_LOCKED_MAIN_MENU_ENTRIES = ['sw-settings'];

// Must match the defaults of the PHP AdminInterfaceSettingsService
const DEFAULT_HIDDEN_MAIN_MENU_ENTRIES = ['sw-content'];
const DEFAULT_SHOW_FRONTENDS_MENU = false;

const adminInterfaceStore = Shopware.Store.register({
    id: 'adminInterface',

    state: () => ({
        hiddenMainMenuEntries: [...DEFAULT_HIDDEN_MAIN_MENU_ENTRIES] as string[],
        lockedMainMenuEntries: [...DEFAULT_LOCKED_MAIN_MENU_ENTRIES] as string[],
        showFrontendsMenu: DEFAULT_SHOW_FRONTENDS_MENU,
        isLoaded: false,
    }),

    getters: {
        isMainMenuEntryVisible(state) {
            return (entryId: string): boolean => {
                return state.lockedMainMenuEntries.includes(entryId) || !state.hiddenMainMenuEntries.includes(entryId);
            };
        },
    },

    actions: {
        applySettings(settings: AdminInterfaceSettings) {
            this.hiddenMainMenuEntries = Array.isArray(settings?.hiddenMainMenuEntries)
                ? settings.hiddenMainMenuEntries
                : [...DEFAULT_HIDDEN_MAIN_MENU_ENTRIES];
            this.lockedMainMenuEntries = Array.isArray(settings?.lockedMainMenuEntries)
                ? settings.lockedMainMenuEntries
                : [...DEFAULT_LOCKED_MAIN_MENU_ENTRIES];
            this.showFrontendsMenu =
                typeof settings?.showFrontendsMenu === 'boolean' ? settings.showFrontendsMenu : DEFAULT_SHOW_FRONTENDS_MENU;
            this.isLoaded = true;
        },

        async loadSettings(): Promise<void> {
            const service = Shopware.Service('adminInterfaceApiService') as AdminInterfaceApiService;

            try {
                this.applySettings(await service.getSettings());
            } catch {
                // Keep the defaults, the menu must never break because of this.
                this.isLoaded = true;
            }
        },

        async saveSettings(settings: AdminInterfaceSettingsUpdate): Promise<void> {
            const service = Shopware.Service('adminInterfaceApiService') as AdminInterfaceApiService;

            this.applySettings(await service.saveSettings(settings));
        },

        async saveHiddenMainMenuEntries(hiddenMainMenuEntries: string[]): Promise<void> {
            await this.saveSettings({ hiddenMainMenuEntries });
        },
    },
});

/**
 * @private
 */
export type AdminInterfaceStore = ReturnType<typeof adminInterfaceStore>;

/**
 * @private
 */
export default adminInterfaceStore;
