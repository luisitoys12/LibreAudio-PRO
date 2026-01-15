<?php
declare(strict_types=1);

/**
 * CakePHP(tm) : Rapid Development Framework (https://cakephp.org)
 * Copyright (c) Cake Software Foundation, Inc. (https://cakefoundation.org)
 *
 * Licensed under The MIT License
 * For full copyright and license information, please see the LICENSE.txt
 */

// Check platform requirements
require dirname(__DIR__) . '/config/requirements.php';

/**
 * Bootstrap the application.
 *
 * This bootstraps the application and loads up CakePHP and its plugins.
 */
require dirname(__DIR__) . '/config/bootstrap.php';

use Cake\Http\Server;

// Bind your application to the server.
$server = new Server(new App\Application(dirname(__DIR__) . '/config'));

// Run the request/response through the application and emit the response.
$server->emit(
    $server->run()
);
