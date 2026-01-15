<?php
$this->assign('title', 'Browse Content');
?>
<div class="content index">
    <h2><?= __('Browse Radios and Podcasts') ?></h2>
    
    <div class="filter-bar">
        <p>Filter by type:</p>
        <ul>
            <li><?= $this->Html->link('All', ['action' => 'index']) ?></li>
            <li><?= $this->Html->link('Radios', ['action' => 'index', '?' => ['type' => 'radio']]) ?></li>
            <li><?= $this->Html->link('Podcasts', ['action' => 'index', '?' => ['type' => 'podcast']]) ?></li>
            <li><?= $this->Html->link('Other', ['action' => 'index', '?' => ['type' => 'other']]) ?></li>
        </ul>
    </div>

    <div class="content-list">
        <?php if ($content->count()): ?>
            <?php foreach ($content as $item): ?>
                <div class="content-item">
                    <h3><?= h($item->title) ?></h3>
                    <p class="meta">
                        Type: <strong><?= h($item->type) ?></strong> | 
                        Submitted by: <strong><?= h($item->user->name) ?></strong> | 
                        <?= $item->created->format('M d, Y') ?>
                    </p>
                    <?php if ($item->description): ?>
                        <p><?= h($item->description) ?></p>
                    <?php endif; ?>
                    <p class="actions">
                        <?= $this->Html->link('View Details', ['action' => 'view', $item->id], ['class' => 'button']) ?>
                        <a href="<?= h($item->external_url) ?>" target="_blank" rel="noopener noreferrer" class="button primary">
                            🔗 Open External Link
                        </a>
                    </p>
                </div>
            <?php endforeach; ?>
            
            <div class="paginator">
                <ul class="pagination">
                    <?= $this->Paginator->first('<< ' . __('first')) ?>
                    <?= $this->Paginator->prev('< ' . __('previous')) ?>
                    <?= $this->Paginator->numbers() ?>
                    <?= $this->Paginator->next(__('next') . ' >') ?>
                    <?= $this->Paginator->last(__('last') . ' >>') ?>
                </ul>
                <p><?= $this->Paginator->counter(__('Page {{page}} of {{pages}}, showing {{current}} record(s) out of {{count}} total')) ?></p>
            </div>
        <?php else: ?>
            <p>No content available yet. <?= $this->Html->link('Be the first to submit!', ['action' => 'add']) ?></p>
        <?php endif; ?>
    </div>
</div>
