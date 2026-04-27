<?php declare(strict_types=1);

namespace Muckiware\Master\Core\Framework\Demodata\PersonalData;

use Doctrine\DBAL\Connection;
use Shopware\Core\Checkout\Customer\CustomerCollection;
use Shopware\Core\Defaults;
use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\DataAbstractionLayer\EntityRepository;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter;
use Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\RangeFilter;
use Shopware\Core\Framework\Log\Package;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * @internal
 */
#[AsCommand(
    name: 'database:clean-personal-data',
    description: 'Cleans personal data from the database',
)]
#[Package('framework')]
class CleanPersonalDataCommandDecorator extends Command
{
    /**
     * @internal
     *
     */
    public function __construct() {
        parent::__construct();
    }
}
