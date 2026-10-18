<?php declare(strict_types=1);

namespace Muckiware\Master\Store;

use Shopware\Core\Framework\Store\Services\FirstRunWizardService;

/**
 * No-op stub — Muckidrive does not use the Shopware Store or First Run Wizard.
 * Extends the concrete class to satisfy the type hint in AdministrationController.
 * frwShouldRun() always returns false so the FRW overlay never appears.
 */
class NullFirstRunWizardService extends FirstRunWizardService
{
    public function __construct()
    {
    }

    public function frwShouldRun(): bool
    {
        return false;
    }
}
