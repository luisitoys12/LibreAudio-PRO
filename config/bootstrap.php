<?php
declare(strict_types=1);

/**
 * CakePHP(tm) : Rapid Development Framework (https://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 */

use Cake\Cache\Cache;
use Cake\Core\Configure;
use Cake\Core\Plugin;
use Cake\Datasource\ConnectionManager;
use Cake\Error\ErrorTrap;
use Cake\Error\ExceptionTrap;
use Cake\Http\ServerRequest;
use Cake\Log\Log;
use Cake\Routing\Router;
use Cake\Utility\Security;

/*
 * Configure paths required to find CakePHP + general filepath constants
 */
require __DIR__ . '/paths.php';

/*
 * Bootstrap CakePHP.
 *
 * Does the various bits of setup that CakePHP needs to do.
 * This includes:
 *
 * - Registering the CakePHP autoloader.
 * - Setting the default application paths.
 */
require CORE_PATH . 'config' . DS . 'bootstrap.php';

/*
 * Load .env file
 */
use Cake\Core\Configure\Engine\PhpConfig;

try {
    Configure::config('default', new PhpConfig());
    Configure::load('app_local', 'default', false);
} catch (\Exception $e) {
    exit($e->getMessage() . "\n");
}

// Load an environment local configuration file to provide overrides to your
// app.php configuration file. This is useful for inject environment variables
// or to provide changes without modifying app.php.
//
// You can use a file like app_local.php that is excluded from your git repo.
// https://book.cakephp.org/4/en/development/configuration.html#environment-variables
// Configure::load('app_local', 'default');

/*
 * When debug = true the metadata cache should only last
 * for a short time.
 */
if (Configure::read('debug')) {
    Configure::write('Cache._cake_model_.duration', '+2 minutes');
    Configure::write('Cache._cake_core_.duration', '+2 minutes');
    // disable router cache during development
    Configure::write('Cache._cake_routes_.duration', '+2 seconds');
}

/*
 * Set the default server timezone. Using UTC makes time calculations / conversions easier.
 * Check http://php.net/manual/en/timezones.php for list of valid timezone strings.
 */
date_default_timezone_set(Configure::read('App.defaultTimezone') ?? 'UTC');

/*
 * Configure the mbstring extension to use the correct encoding.
 */
mb_internal_encoding(Configure::read('App.encoding') ?? 'UTF-8');

/*
 * Set the default locale. This controls how dates, number and currency is
 * formatted and sets the default language to use for translations.
 */
ini_set('intl.default_locale', Configure::read('App.defaultLocale') ?? 'en_US');

/*
 * Register application error and exception handlers.
 */
(new ErrorTrap(Configure::read('Error')))->register();
(new ExceptionTrap(Configure::read('Error')))->register();

/*
 * Include the CLI bootstrap overrides.
 */
if (PHP_SAPI === 'cli') {
    require __DIR__ . '/bootstrap_cli.php';
}

/*
 * Set the full base URL.
 * This URL is used as the base of all absolute links.
 *
 * If you define fullBaseUrl in your config file you can remove this.
 */
if (!Configure::read('App.fullBaseUrl')) {
    $s = null;
    if (PHP_SAPI !== 'cli') {
        $s = ServerRequest::getServerParams();
    }
    if ($s) {
        $httpHost = $s['HTTP_HOST'] ?? '';
        $httpScheme = $s['HTTPS'] ?? 'off';
        Configure::write('App.fullBaseUrl', ($httpScheme === 'on' ? 'https://' : 'http://') . $httpHost);
    }
    unset($httpHost, $s);
}

Cache::setConfig(Configure::consume('Cache'));
ConnectionManager::setConfig(Configure::consume('Datasources'));
Log::setConfig(Configure::consume('Log'));
Security::setSalt(Configure::consume('Security.salt'));

/*
 * Setup detectors for mobile and tablet.
 * Reuse a single MobileDetect instance for efficiency
 */
$mobileDetector = null;
ServerRequest::addDetector('mobile', function ($request) use (&$mobileDetector) {
    if ($mobileDetector === null) {
        $mobileDetector = new \Detection\MobileDetect();
    }
    
    return $mobileDetector->isMobile();
});
ServerRequest::addDetector('tablet', function ($request) use (&$mobileDetector) {
    if ($mobileDetector === null) {
        $mobileDetector = new \Detection\MobileDetect();
    }
    
    return $mobileDetector->isTablet();
});

/*
 * You can load all plugins using the following:
 *
 * ```
 * Plugin::loadAll();
 * ```
 *
 * Or you can load them one by one:
 *
 * ```
 * Plugin::load('DebugKit');
 * ```
 *
 * Some plugins only need to be loaded in development environment.
 */
if (Configure::read('debug')) {
    Plugin::getCollection()->add(new \DebugKit\Plugin());
}

/*
 * Load Authentication and Authorization plugins
 */
Plugin::getCollection()->add(new \Authentication\Plugin());
Plugin::getCollection()->add(new \Authorization\Plugin());
