<?php
$this->assign('title', $content->title);
?>
<div class="content view">
    <h2><?= h($content->title) ?></h2>
    
    <div class="content-details">
        <p class="meta">
            <strong>Type:</strong> <?= h($content->type) ?><br>
            <strong>Submitted by:</strong> <?= h($content->user->name) ?><br>
            <strong>Date:</strong> <?= $content->created->format('F d, Y') ?><br>
            <strong>Status:</strong> <span class="status-<?= h($content->status) ?>"><?= h($content->status) ?></span>
        </p>
        
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
    
    <p>
        <?= $this->Html->link('← Back to List', ['action' => 'index'], ['class' => 'button']) ?>
    </p>
</div>
