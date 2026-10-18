<?php declare(strict_types=1);

namespace Muckiware\Master\Migration\V6_7;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Migration\MigrationStep;

class Migration1757500000FrontendView extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1757500000;
    }

    public function update(Connection $connection): void
    {
        $connection->executeStatement(
            'CREATE OR REPLACE VIEW frontend AS SELECT * FROM sales_channel'
        );

        // The DAL expects translation table `frontend_translation` with FK column `frontend_id`.
        // Since SalesChannelTranslation uses `sales_channel_id`, we alias it here.
        $connection->executeStatement('
            CREATE OR REPLACE VIEW frontend_translation AS
            SELECT
                sales_channel_id AS frontend_id,
                language_id,
                name,
                home_keywords,
                home_meta_description,
                home_meta_title,
                home_name,
                home_enabled,
                home_slot_config,
                custom_fields,
                created_at,
                updated_at
            FROM sales_channel_translation
        ');
    }
}
