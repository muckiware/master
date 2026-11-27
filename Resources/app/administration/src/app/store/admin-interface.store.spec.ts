/**
 * @sw-package framework
 */

// eslint-disable-next-line filename-rules/match
import { createPinia, setActivePinia } from 'pinia';
import type { AdminInterfaceStore } from './admin-interface.store';

describe('admin-interface.store', () => {
    let store: AdminInterfaceStore;
    const getSettings = jest.fn();
    const saveSettings = jest.fn();

    beforeAll(() => {
        // eslint-disable-next-line sw-deprecation-rules/private-feature-declarations
        Shopware.Service().register('adminInterfaceApiService', () => ({ getSettings, saveSettings }));
    });

    beforeEach(() => {
        setActivePinia(createPinia());
        store = Shopware.Store.get('adminInterface');
        getSettings.mockReset();
        saveSettings.mockReset();
    });

    it('hides the content entry and the frontends menu by default', () => {
        expect(store.isLoaded).toBe(false);
        expect(store.isMainMenuEntryVisible('sw-content')).toBe(false);
        expect(store.isMainMenuEntryVisible('sw-dashboard')).toBe(true);
        expect(store.showFrontendsMenu).toBe(false);
    });

    it('hides entries loaded from the api', async () => {
        getSettings.mockResolvedValue({
            hiddenMainMenuEntries: ['sw-content'],
            lockedMainMenuEntries: ['sw-settings'],
        });

        await store.loadSettings();

        expect(store.isLoaded).toBe(true);
        expect(store.isMainMenuEntryVisible('sw-content')).toBe(false);
        expect(store.isMainMenuEntryVisible('sw-dashboard')).toBe(true);
    });

    it('never hides locked entries', () => {
        store.applySettings({
            hiddenMainMenuEntries: ['sw-settings'],
            lockedMainMenuEntries: ['sw-settings'],
            showFrontendsMenu: true,
        });

        expect(store.isMainMenuEntryVisible('sw-settings')).toBe(true);
    });

    it('keeps the defaults when loading fails', async () => {
        getSettings.mockRejectedValue(new Error('403'));

        await store.loadSettings();

        expect(store.isLoaded).toBe(true);
        expect(store.isMainMenuEntryVisible('sw-content')).toBe(false);
        expect(store.isMainMenuEntryVisible('sw-dashboard')).toBe(true);
        expect(store.showFrontendsMenu).toBe(false);
    });

    it('shows saved entries even if they are hidden by default', async () => {
        getSettings.mockResolvedValue({
            hiddenMainMenuEntries: [],
            lockedMainMenuEntries: ['sw-settings'],
            showFrontendsMenu: true,
        });

        await store.loadSettings();

        expect(store.isMainMenuEntryVisible('sw-content')).toBe(true);
        expect(store.showFrontendsMenu).toBe(true);
    });

    it('applies the loaded frontends menu flag', () => {
        store.applySettings({
            hiddenMainMenuEntries: [],
            lockedMainMenuEntries: ['sw-settings'],
            showFrontendsMenu: true,
        });
        expect(store.showFrontendsMenu).toBe(true);

        store.applySettings({
            hiddenMainMenuEntries: [],
            lockedMainMenuEntries: ['sw-settings'],
            showFrontendsMenu: false,
        });

        expect(store.showFrontendsMenu).toBe(false);
    });

    it('saves the frontends menu flag', async () => {
        saveSettings.mockResolvedValue({
            hiddenMainMenuEntries: [],
            lockedMainMenuEntries: ['sw-settings'],
            showFrontendsMenu: false,
        });

        await store.saveSettings({ showFrontendsMenu: false });

        expect(saveSettings).toHaveBeenCalledWith({ showFrontendsMenu: false });
        expect(store.showFrontendsMenu).toBe(false);
    });

    it('saves hidden entries and applies the response', async () => {
        saveSettings.mockResolvedValue({
            hiddenMainMenuEntries: ['sw-media'],
            lockedMainMenuEntries: ['sw-settings'],
        });

        await store.saveHiddenMainMenuEntries(['sw-media']);

        expect(saveSettings).toHaveBeenCalledWith({ hiddenMainMenuEntries: ['sw-media'] });
        expect(store.hiddenMainMenuEntries).toEqual(['sw-media']);
    });
});
