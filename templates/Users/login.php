<?php
$this->assign('title', 'Login');
?>
<div class="users form">
    <?= $this->Form->create() ?>
    <fieldset>
        <legend><?= __('Login to LibreAudio PRO') ?></legend>
        <?= $this->Form->control('email', ['required' => true, 'type' => 'email']) ?>
        <?= $this->Form->control('password', ['required' => true]) ?>
    </fieldset>
    <?= $this->Form->button(__('Login')); ?>
    <?= $this->Form->end() ?>
    
    <p>
        Don't have an account? <?= $this->Html->link('Register here', ['action' => 'register']) ?>
    </p>
</div>
