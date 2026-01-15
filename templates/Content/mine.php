<?php
$this->assign('title', 'My Content');
?>
<div class="content index">
    <h2><?= __('My Submissions') ?></h2>
    
    <p><?= $this->Html->link('Submit New Content', ['action' => 'add'], ['class' => 'button primary']) ?></p>

    <?php if ($content->count()): ?>
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($content as $item): ?>
                    <tr>
                        <td><?= h($item->title) ?></td>
                        <td><?= h($item->type) ?></td>
                        <td><span class="status-<?= h($item->status) ?>"><?= h($item->status) ?></span></td>
                        <td><?= $item->created->format('M d, Y') ?></td>
                        <td>
                            <?= $this->Html->link('View', ['action' => 'view', $item->id]) ?>
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
        </div>
    <?php else: ?>
        <p>You haven't submitted any content yet.</p>
    <?php endif; ?>
</div>
