<?php
declare(strict_types=1);

/**
 * CLI-environment bootstrap code.
 *
 * This file is included by config/bootstrap.php when running in CLI environment.
 */

use Cake\Utility\Inflector;

// Set to run indefinitely if needed
set_time_limit(0);

/*
 * Set the default inflections. If you want to customize your inflections, edit this
 * or add a config/inflection.php file that contains inflections to be used.
 */
Inflector::rules('singular', ['/^(.*)(menu)$/i' => '\1\2']);
Inflector::rules('plural', ['/^(.*)(menu)$/i' => '\1\2s']);
