<?php

declare(strict_types=1);

namespace Muckiware\Master\Controller;

use Muckiware\Master\Service\AdminInterfaceSettingsService;
use Shopware\Core\Framework\Log\Package;
use Shopware\Core\Framework\Routing\ApiRouteScope;
use Shopware\Core\PlatformRequest;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * Administration interface settings (main menu visibility, later e.g. color scheme).
 * Reading is allowed for every authenticated admin user, since the menu of every user depends on it.
 */
#[Route(defaults: [PlatformRequest::ATTRIBUTE_ROUTE_SCOPE => [ApiRouteScope::ID]])]
#[Package('framework')]
final class AdminInterfaceController extends AbstractController
{
    public function __construct(
        private readonly AdminInterfaceSettingsService $settingsService,
    ) {
    }

    #[Route(path: '/api/_admin/interface-settings', name: 'api.admin.interface-settings.get', methods: ['GET'])]
    public function getSettings(): JsonResponse
    {
        return new JsonResponse($this->settingsService->getSettings());
    }

    #[Route(
        path: '/api/_admin/interface-settings',
        name: 'api.admin.interface-settings.save',
        defaults: ['_acl' => ['system_config:update', 'system_config:create', 'system_config:delete']],
        methods: ['POST'],
    )]
    public function saveSettings(Request $request): JsonResponse
    {
        $payload = $request->request->all();
        $hidden = $payload['hiddenMainMenuEntries'] ?? null;
        $showFrontendsMenu = $payload['showFrontendsMenu'] ?? null;

        if ($hidden !== null && !\is_array($hidden)) {
            return $this->badRequest('Parameter "hiddenMainMenuEntries" must be an array.');
        }
        if ($showFrontendsMenu !== null && !\is_bool($showFrontendsMenu)) {
            return $this->badRequest('Parameter "showFrontendsMenu" must be a boolean.');
        }

        if ($hidden !== null) {
            $this->settingsService->setHiddenMainMenuEntries(array_values($hidden));
        }
        if ($showFrontendsMenu !== null) {
            $this->settingsService->setShowFrontendsMenu($showFrontendsMenu);
        }

        return new JsonResponse($this->settingsService->getSettings());
    }

    private function badRequest(string $detail): JsonResponse
    {
        return new JsonResponse(['errors' => [['detail' => $detail]]], Response::HTTP_BAD_REQUEST);
    }
}
