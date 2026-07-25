<?php declare(strict_types=1);

namespace Muckiware\Master\Core\Checkout\Cart;

use Shopware\Core\Checkout\Cart\Delivery\DeliveryProcessor;
use Shopware\Core\Checkout\Cart\Price\Struct\CalculatedPrice;
use Shopware\Core\Checkout\Cart\SalesChannel\CartService;
use Shopware\Core\Framework\Log\Package;
use Shopware\Core\System\SalesChannel\Context\SalesChannelContextPersister;
use Shopware\Core\System\SalesChannel\Context\SalesChannelContextService;
use Shopware\Core\System\SalesChannel\SalesChannelContext;

#[Package('checkout')]
class ApiOrderCartServiceDecorator
{
    /**
     * @internal
     */
    public function __construct() {}
}
