<?php declare(strict_types=1);

namespace Muckiware\Master\Controller;

use Doctrine\DBAL\Connection;
use Shopware\Core\DevOps\Environment\EnvironmentHelper;
use Shopware\Core\Framework\App\Exception\ShopIdChangeSuggestedException;
use Shopware\Core\Framework\App\ShopId\ShopIdProvider;
use Shopware\Core\Framework\Bundle;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Log\Package;
use Shopware\Core\Framework\Plugin;
use Shopware\Core\Framework\Plugin\Composer\Factory;
use Shopware\Core\Framework\Plugin\Exception\PluginComposerJsonInvalidException;
use Shopware\Core\Framework\Routing\ApiRouteScope;
use Shopware\Core\Kernel;
use Shopware\Core\Maintenance\Staging\Event\SetupStagingEvent;
use Shopware\Core\Maintenance\System\Service\AppUrlVerifier;
use Shopware\Core\PlatformRequest;
use Shopware\Core\System\SystemConfig\SystemConfigService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\ParameterBag\ParameterBagInterface;
use Symfony\Component\Filesystem\Filesystem;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Routing\RouterInterface;

use Muckiware\Master\Framework\Twig\ViteFileAccessorDecorator;

#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [ApiRouteScope::ID]])]
#[Package('framework')]
class SystemInfoController extends AbstractController
{
    /**
     * @internal
     */
    public function __construct(
        private readonly ParameterBagInterface $params,
        private readonly Kernel $kernel,
        private readonly Connection $connection,
        private readonly AppUrlVerifier $appUrlVerifier,
        private readonly RouterInterface $router,
        private readonly SystemConfigService $systemConfigService,
        /**
         * @phpstan-ignore phpat.restrictNamespacesInCore (Administration dependency is nullable. Don't do that! Will be fixed with https://github.com/shopware/shopware/issues/12966)
         */
        private readonly ?ViteFileAccessorDecorator $viteFileAccessorDecorator,
        private readonly Filesystem $filesystem,
        private readonly ShopIdProvider $shopIdProvider,
    )
    {}

    /**
     * @throws \JsonException
     */
    #[Route(path: '/api/_systeminfo/config', name: 'api.systeminfo.config', methods: ['GET'])]
    public function config(Context $context, Request $request): JsonResponse
    {
        return new JsonResponse([
            'coreVersion' => $this->getShopwareVersion(),
            'masterVersion' => $this->getMasterVersion(),
            'shopId' => $this->getShopId(),
            'appUrl' => (string) EnvironmentHelper::getVariable('APP_URL'),
            'versionRevision' => $this->params->get('kernel.shopware_version_revision'),
            'adminWorker' => [
                'enableAdminWorker' => $this->params->get('shopware.admin_worker.enable_admin_worker'),
                'enableQueueStatsWorker' => $this->params->get('shopware.admin_worker.enable_queue_stats_worker'),
                'enableNotificationWorker' => $this->params->get('shopware.admin_worker.enable_notification_worker'),
                'transports' => $this->params->get('shopware.admin_worker.transports'),
            ],
            'bundles' => $this->getBundles(),
            'settings' => [
                'enableUrlFeature' => $this->params->get('shopware.media.enable_url_upload_feature'),
                'appUrlReachable' => $this->appUrlVerifier->isAppUrlReachable($request),
                'appsRequireAppUrl' => $this->appUrlVerifier->hasAppsThatNeedAppUrl(),
                'private_allowed_extensions' => $this->params->get('shopware.filesystem.private_allowed_extensions'),
                'enableHtmlSanitizer' => $this->params->get('shopware.html_sanitizer.enabled'),
                'enableStagingMode' => $this->params->get('shopware.staging.administration.show_banner') && $this->systemConfigService->getBool(SetupStagingEvent::CONFIG_FLAG),
                'disableExtensionManagement' => !$this->params->get('shopware.deployment.runtime_extension_management'),
            ],
            'inAppPurchases' => null,
        ]);
    }

    #[Route(path: '/api/_systeminfo/version', name: 'api.systeminfo.shopware.version', methods: ['GET'])]
    #[Route(path: '/api/v1/_systeminfo/version', name: 'api.systeminfo.shopware.version_old_version', methods: ['GET'])]
    public function infoShopwareVersion(): JsonResponse
    {
        return new JsonResponse([
            'version' => $this->getShopwareVersion(),
        ]);
    }

    /**
     * @return array<string, array{
     *     type: 'plugin',
     *     css: list<string>,
     *     js: list<string>,
     *     baseUrl: ?string
     * }|array{
     *     type: 'app',
     *     name: string,
     *     active: bool,
     *     integrationId: string,
     *     baseUrl: string,
     *     version: string,
     *     permissions: array<string, list<string>>
     * }>
     * @throws \JsonException
     */
    private function getBundles(): array
    {
        $assets = [];

        foreach ($this->kernel->getBundles() as $bundle) {
            if (!$bundle instanceof Bundle) {
                continue;
            }

            if (!$this->viteFileAccessorDecorator) {
                // Admin bundle is not there, admin assets are not available
                continue;
            }

            $viteEntryPoints = $this->viteFileAccessorDecorator->getBundleData($bundle);

            $technicalBundleName = $this->getTechnicalBundleName($bundle);
            $styles = $viteEntryPoints['entryPoints'][$technicalBundleName]['css'] ?? [];
            $scripts = $viteEntryPoints['entryPoints'][$technicalBundleName]['js'] ?? [];
            $baseUrl = $this->getBaseUrl($bundle);

            if (empty($styles) && empty($scripts) && $baseUrl === null) {
                continue;
            }

            $assets[$bundle->getName()] = [
                'css' => $styles,
                'js' => $scripts,
                'baseUrl' => $baseUrl,
                'type' => 'plugin',
            ];
        }

        foreach ($this->getActiveApps() as $app) {
            $assets[$app['name']] = [
                'active' => (bool) $app['active'],
                'integrationId' => $app['integrationId'],
                'type' => 'app',
                'baseUrl' => $app['baseUrl'],
                'permissions' => $app['privileges'],
                'version' => $app['version'],
                'name' => $app['name'],
            ];
        }

        return $assets;
    }

    private function getBaseUrl(Bundle $bundle): ?string
    {
        if ($bundle->getAdminBaseUrl()) {
            return $bundle->getAdminBaseUrl();
        }

        if (!$this->filesystem->exists($bundle->getPath() . '/Resources/public/meteor-app/index.html')) {
            return null;
        }

        // exception is possible as the administration is an optional dependency
        try {
            return $this->router->generate(
                'administration.plugin.index',
                [
                    /**
                     * Adopted from symfony, as they also strip the bundle suffix:
                     * https://github.com/symfony/symfony/blob/7.2/src/Symfony/Bundle/FrameworkBundle/Command/AssetsInstallCommand.php#L128
                     *
                     * @see Plugin\Util\AssetService::getTargetDirectory
                     */
                    'pluginName' => preg_replace('/bundle$/', '', mb_strtolower($bundle->getName())),
                ],
                UrlGeneratorInterface::ABSOLUTE_URL
            );
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @return list<array{name: string, active: int, integrationId: string, baseUrl: string, version: string, privileges: array<string, list<string>>}>
     * @throws \JsonException
     */
    private function getActiveApps(): array
    {
        /** @var list<array{name: string, active: int, integrationId: string, baseUrl: string, version: string, privileges: ?string}> $apps */
        $apps = $this->connection->fetchAllAssociative('SELECT
    app.name,
    app.active,
    LOWER(HEX(app.integration_id)) as integrationId,
    app.base_app_url as baseUrl,
    app.version,
    ar.privileges as privileges
FROM app
LEFT JOIN acl_role ar on app.acl_role_id = ar.id
WHERE app.active = 1 AND app.base_app_url is not null');

        return array_map(static function (array $item) {
            $privileges = $item['privileges'] ? json_decode($item['privileges'], true, 512, \JSON_THROW_ON_ERROR) : [];

            $item['privileges'] = [];

            foreach ($privileges as $privilege) {
                if (substr_count($privilege, ':') !== 1) {
                    $item['privileges']['additional'][] = $privilege;

                    continue;
                }

                [$entity, $key] = \explode(':', $privilege);
                $item['privileges'][$key][] = $entity;
            }

            return $item;
        }, $apps);
    }

    private function getShopwareVersion(): string
    {
        $shopwareVersion = $this->params->get('kernel.shopware_version');
        if ($shopwareVersion === Kernel::SHOPWARE_FALLBACK_VERSION) {
            $shopwareVersion = str_replace('.9999999-dev', '.9999999.9999999-dev', $shopwareVersion);
        }

        return $shopwareVersion;
    }

    protected function getMasterVersion(): string
    {
        $bundlePath = $this->searchPathMasterBundle();
        try {
            return  Factory::createComposer($bundlePath)->getPackage()->getVersion();
        } catch (\InvalidArgumentException $e) {
            throw new \Exception($bundlePath.'Error message: '.$e->getMessage());
        }
    }

    private function getTechnicalBundleName(Bundle $bundle): string
    {
        return str_replace('_', '-', $bundle->getContainerPrefix());
    }

    private function getShopId(): string
    {
        try {
            return $this->shopIdProvider->getShopId();
        } catch (ShopIdChangeSuggestedException $e) {
            return $e->shopId->id;
        }
    }

    protected function searchPathMasterBundle(): ?string
    {
        foreach ($this->kernel->getBundles() as $bundle) {

            if (!$bundle instanceof Bundle) {
                continue;
            }

            if($bundle->getName() !== 'Administration') {
                continue;
            }

            return $bundle->getPath();
        }

        return null;
    }
}
