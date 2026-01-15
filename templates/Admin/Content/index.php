<?php
$this->assign('title', 'Admin - Content Moderation');
?>
<div class="admin content index">
    <h2><?= __('Content Moderation Panel') ?></h2>
    
    <div class="stats-bar">
        <div class="stat-item">
            <strong><?= $stats['total'] ?></strong>
            <span>Total</span>
        </div>
        <div class="stat-item pending">
            <strong><?= $stats['pending'] ?></strong>
            <span>Pending</span>
        </div>
        <div class="stat-item approved">
            <strong><?= $stats['approved'] ?></strong>
            <span>Approved</span>
        </div>
        <div class="stat-item rejected">
            <strong><?= $stats['rejected'] ?></strong>
            <span>Rejected</span>
        </div>
    </div>
    
    <div class="filter-bar">
        <p>Filter by status:</p>
        <ul>
            <li><?= $this->Html->link('All', ['action' => 'index']) ?></li>
            <li><?= $this->Html->link('Pending', ['action' => 'index', '?' => ['status' => 'pending']]) ?></li>
            <li><?= $this->Html->link('Approved', ['action' => 'index', '?' => ['status' => 'approved']]) ?></li>
            <li><?= $this->Html->link('Rejected', ['action' => 'index', '?' => ['status' => 'rejected']]) ?></li>
        </ul>
    </div>

    <?php if ($content->count()): ?>
        <table class="admin-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Submitted By</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($content as $item): ?>
                    <tr class="status-<?= h($item->status) ?>">
                        <td><?= h($item->id) ?></td>
                        <td><?= h($item->title) ?></td>
                        <td><?= h($item->type) ?></td>
                        <td><?= h($item->user->name) ?></td>
                        <td><span class="badge status-<?= h($item->status) ?>"><?= h($item->status) ?></span></td>
                        <td><?= $item->created->format('M d, Y') ?></td>
                        <td class="actions">
                            <?= $this->Html->link('View', ['action' => 'view', $item->id], ['class' => 'button small']) ?>
                            <?php if ($item->status !== 'approved'): ?>
                                <?= $this->Html->link('Approve', ['action' => 'approve', $item->id], ['class' => 'button small success', 'confirm' => 'Approve this content?']) ?>
                            <?php endif; ?>
                            <?php if ($item->status !== 'rejected'): ?>
                                <?= $this->Html->link('Reject', ['action' => 'reject', $item->id], ['class' => 'button small warning', 'confirm' => 'Reject this content?']) ?>
                            <?php endif; ?>
                            <?= $this->Form->postLink('Delete', ['action' => 'delete', $item->id], ['class' => 'button small danger', 'confirm' => 'Are you sure you want to delete this content?']) ?>
                        </td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
        
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
        <p>No content found.</p>
    <?php endif; ?>
</div>
