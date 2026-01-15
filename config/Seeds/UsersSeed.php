<?php
declare(strict_types=1);

use Migrations\AbstractSeed;

class UsersSeed extends AbstractSeed
{
    public function run(): void
    {
        $data = [
            [
                'email' => 'admin@libreaudiopro.com',
                'password' => password_hash('admin123', PASSWORD_DEFAULT),
                'name' => 'Administrator',
                'role' => 'admin',
                'active' => 1,
                'created' => date('Y-m-d H:i:s'),
                'modified' => date('Y-m-d H:i:s'),
            ],
            [
                'email' => 'user@libreaudiopro.com',
                'password' => password_hash('user123', PASSWORD_DEFAULT),
                'name' => 'Test User',
                'role' => 'user',
                'active' => 1,
                'created' => date('Y-m-d H:i:s'),
                'modified' => date('Y-m-d H:i:s'),
            ],
        ];

        $table = $this->table('users');
        $table->insert($data)->save();
    }
}
