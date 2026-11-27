<?php

declare(strict_types=1);

namespace Muckiware\Master\Service;

use Shopware\Core\System\SystemConfig\SystemConfigService;

/**
 * Reads and writes the system-wide administration interface settings
 * (hidden main menu entries, visibility of the frontends menu block).
 */
final readonly class AdminInterfaceSettingsService
{
    public const CONFIG_HIDDEN_MAIN_MENU_ENTRIES = 'MuckiwareMaster.adminInterface.hiddenMainMenuEntries';

    public const CONFIG_SHOW_FRONTENDS_MENU = 'MuckiwareMaster.adminInterface.showFrontendsMenu';

    /**
     * Main menu entries that can never be hidden, otherwise the settings would become unreachable.
     */
    public const LOCKED_MAIN_MENU_ENTRIES = ['sw-settings'];

    /**
     * Defaults as long as nothing has been saved: Muckidrive is not a shop, so the content
     * main menu entry and the frontends menu block are hidden.
     */
    public const DEFAULT_HIDDEN_MAIN_MENU_ENTRIES = ['sw-content'];

    public const DEFAULT_SHOW_FRONTENDS_MENU = false;

    private const MAX_ENTRIES = 200;

    private const ENTRY_ID_PATTERN = '#^[A-Za-z0-9_.:/\-]{1,255}$#';

    public function __construct(
        private SystemConfigService $systemConfigService,
    ) {
    }

    /**
     * @return array{hiddenMainMenuEntries: list<string>, lockedMainMenuEntries: list<string>, showFrontendsMenu: bool}
     */
    public function getSettings(): array
    {
        $hidden = $this->systemConfigService->get(self::CONFIG_HIDDEN_MAIN_MENU_ENTRIES);
        $showFrontendsMenu = $this->systemConfigService->get(self::CONFIG_SHOW_FRONTENDS_MENU);

        return [
            'hiddenMainMenuEntries' => $this->sanitizeEntryIds(
                \is_array($hidden) ? $hidden : self::DEFAULT_HIDDEN_MAIN_MENU_ENTRIES,
            ),
            'lockedMainMenuEntries' => self::LOCKED_MAIN_MENU_ENTRIES,
            'showFrontendsMenu' => $showFrontendsMenu === null
                ? self::DEFAULT_SHOW_FRONTENDS_MENU
                : (bool) $showFrontendsMenu,
        ];
    }

    /**
     * @param list<string> $entryIds
     */
    public function setHiddenMainMenuEntries(array $entryIds): void
    {
        $this->systemConfigService->set(
            self::CONFIG_HIDDEN_MAIN_MENU_ENTRIES,
            $this->sanitizeEntryIds($entryIds),
        );
    }

    public function setShowFrontendsMenu(bool $show): void
    {
        $this->systemConfigService->set(self::CONFIG_SHOW_FRONTENDS_MENU, $show);
    }

    /**
     * @param array<mixed> $entryIds
     *
     * @return list<string>
     */
    public function sanitizeEntryIds(array $entryIds): array
    {
        $valid = array_filter(
            $entryIds,
            static fn (mixed $id): bool => \is_string($id)
                && preg_match(self::ENTRY_ID_PATTERN, $id) === 1
                && !\in_array($id, self::LOCKED_MAIN_MENU_ENTRIES, true),
        );

        return \array_slice(array_values(array_unique($valid)), 0, self::MAX_ENTRIES);
    }
}
