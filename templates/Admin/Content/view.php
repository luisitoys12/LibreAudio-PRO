<?php
$this->assign('title', 'Admin - View Content');
?>
<div class="admin content view">
    <h2><?= h($content->title) ?></h2>
    
    <div class="content-details">
        <table class="details-table">
            <tr>
                <th>ID:</th>
                <td><?= h($content->id) ?></td>
            </tr>
            <tr>
                <th>Type:</th>
                <td><?= h($content->type) ?></td>
            </tr>
            <tr>
                <th>Status:</th>
                <td><span class="badge status-<?= h($content->status) ?>"><?= h($content->status) ?></span></td>
            </tr>
            <tr>
                <th>Submitted By:</th>
                <td><?= h($content->user->name) ?> (<?= h($content->user->email) ?>)</td>
            </tr>
            <tr>
                <th>Created:</th>
                <td><?= $content->created->format('F d, Y H:i:s') ?></td>
            </tr>
            <tr>
                <th>Modified:</th>
                <td><?= $content->modified->format('F d, Y H:i:s') ?></td>
            </tr>
        </table>
        
        <?php if ($content->description): ?>
            <div class="description">
                <h3>Description</h3>
                <p><?= nl2br(h($content->description)) ?></p>
            </div>
        <?php endif; ?>
        
        <div class="external-link">
            <h3>External Link</h3>
            <p>
                <a href="<?= h($content->external_url) ?>" target="_blank" rel="noopener noreferrer" class="button primary">
                    🔗 Open in New Tab
                </a>
            </p>
            <p class="link-display"><?= h($content->external_url) ?></p>
        </div>
    </div>
    
    <div class="actions">
        <?= $this->Html->link('← Back to List', ['action' => 'index'], ['class' => 'button']) ?>
        
        <?php if ($content->status !== 'approved'): ?>
            <?= $this->Html->link('✓ Approve', ['action' => 'approve', $content->id], ['class' => 'button success', 'confirm' => 'Approve this content?']) ?>
        <?php endif; ?>
        
        <?php if ($content->status !== 'rejected'): ?>
            <?= $this->Html->link('✗ Reject', ['action' => 'reject', $content->id], ['class' => 'button warning', 'confirm' => 'Reject this content?']) ?>
        <?php endif; ?>
        
        <?= $this->Form->postLink('🗑 Delete', ['action' => 'delete', $content->id], ['class' => 'button danger', 'confirm' => 'Are you sure you want to delete this content permanently?']) ?>
    </div>
</div>
