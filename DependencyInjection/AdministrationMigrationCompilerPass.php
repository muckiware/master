<?php declare(strict_types=1);

namespace Muckiware\Master\DependencyInjection;

use Shopware\Core\Framework\Log\Package;
use Shopware\Core\Framework\Migration\MigrationSource;
use Symfony\Component\DependencyInjection\Compiler\CompilerPassInterface;
use Symfony\Component\DependencyInjection\ContainerBuilder;

#[Package('framework')]
class AdministrationMigrationCompilerPass implements CompilerPassInterface
{
    private const MAJOR_VERSIONS = ['V6_3', 'V6_4', 'V6_5', 'V6_6', 'V6_7', 'V6_8'];

    public function process(ContainerBuilder $container): void
    {
        $basePath = \dirname(__DIR__);

        foreach (self::MAJOR_VERSIONS as $major) {
            $migrationPath = $basePath . '/Migration/' . $major;

            if (!\is_dir($migrationPath)) {
                continue;
            }

            $migrationSource = $container->getDefinition(MigrationSource::class . '.core.' . $major);
            $migrationSource->addMethodCall('addDirectory', [
                $migrationPath,
                'Muckiware\\Master\\Migration\\' . $major,
            ]);
        }
    }
}
