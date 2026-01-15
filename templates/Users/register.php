<?php
$this->assign('title', 'Register');
?>
<div class="users form">
    <?= $this->Form->create($user) ?>
    <fieldset>
        <legend><?= __('Register for LibreAudio PRO') ?></legend>
        <?= $this->Form->control('name', ['required' => true]) ?>
        <?= $this->Form->control('email', ['required' => true, 'type' => 'email']) ?>
        <?= $this->Form->control('password', ['required' => true, 'type' => 'password']) ?>
    </fieldset>
    <?= $this->Form->button(__('Register')); ?>
    <?= $this->Form->end() ?>
    
    <p>
        Already have an account? <?= $this->Html->link('Login here', ['action' => 'login']) ?>
    </p>
</div>
