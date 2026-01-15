<?php
declare(strict_types=1);

use Migrations\AbstractMigration;

class CreateContent extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('content');
        $table->addColumn('title', 'string', [
            'default' => null,
            'limit' => 255,
            'null' => false,
        ]);
        $table->addColumn('description', 'text', [
            'default' => null,
            'null' => true,
        ]);
        $table->addColumn('type', 'string', [
            'default' => 'radio',
            'limit' => 50,
            'null' => false,
        ]);
        $table->addColumn('external_url', 'string', [
            'default' => null,
            'limit' => 500,
            'null' => false,
        ]);
        $table->addColumn('status', 'string', [
            'default' => 'pending',
            'limit' => 20,
            'null' => false,
        ]);
        $table->addColumn('user_id', 'integer', [
            'default' => null,
            'null' => false,
        ]);
        $table->addColumn('created', 'datetime', [
            'default' => null,
            'null' => false,
        ]);
        $table->addColumn('modified', 'datetime', [
            'default' => null,
            'null' => false,
        ]);
        $table->addIndex(['user_id'], ['name' => 'BY_USER']);
        $table->addIndex(['status'], ['name' => 'BY_STATUS']);
        $table->addIndex(['type'], ['name' => 'BY_TYPE']);
        $table->addForeignKey('user_id', 'users', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE']);
        $table->create();
    }
}
