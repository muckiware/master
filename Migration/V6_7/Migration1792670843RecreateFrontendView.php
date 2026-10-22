<?php declare(strict_types=1);

namespace Muckiware\Master\Migration\V6_7;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

/**
 * MySQL expands `SELECT *` of a view at creation time, so columns added to `sales_channel`
 * by later Shopware migrations (e.g. `business_time_zone`, `maintenance_ip_allowlist`)
 * are missing in the `frontend` view. Recreate it to pick up the current column set.
 */
class Migration1792670843RecreateFrontendView extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1792670843;
    }

    public function update(Connection $connection): void
    {
        $connection->executeStatement(
            'CREATE OR REPLACE VIEW frontend AS SELECT * FROM sales_channel'
        );
    }
}
