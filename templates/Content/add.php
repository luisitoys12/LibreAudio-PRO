<?php
$this->assign('title', 'Submit Content');
?>
<div class="content form">
    <?= $this->Form->create($content) ?>
    <fieldset>
        <legend><?= __('Submit New Content') ?></legend>
        <p>All submissions are reviewed by administrators before being published.</p>
        
        <?= $this->Form->control('title', ['required' => true, 'maxlength' => 255]) ?>
        <?= $this->Form->control('type', [
            'options' => [
                'radio' => 'Radio',
                'podcast' => 'Podcast',
                'other' => 'Other Audio'
            ],
            'required' => true
        ]) ?>
        <?= $this->Form->control('description', [
            'type' => 'textarea',
            'rows' => 4,
            'placeholder' => 'Provide a brief description of this content...'
        ]) ?>
        <?= $this->Form->control('external_url', [
            'required' => true,
            'placeholder' => 'https://drive.google.com/... or https://dropbox.com/...',
            'label' => 'External URL',
            'help' => 'Provide a link to your content hosted on Google Drive, Dropbox, or similar services'
        ]) ?>
    </fieldset>
    <?= $this->Form->button(__('Submit for Review')); ?>
    <?= $this->Form->end() ?>
</div>
