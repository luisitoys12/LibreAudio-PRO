<!DOCTYPE html>
<html>
<head>
    <?= $this->Html->charset() ?>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>
        LibreAudio PRO - <?= $this->fetch('title') ?>
    </title>
    <?= $this->Html->meta('icon') ?>
    <?= $this->Html->css(['style']) ?>
    <?= $this->fetch('meta') ?>
    <?= $this->fetch('css') ?>
    <?= $this->fetch('script') ?>
</head>
<body>
    <header>
        <div class="container">
            <h1>🎵 LibreAudio PRO</h1>
            <nav>
                <ul>
                    <li><?= $this->Html->link('Home', ['controller' => 'Content', 'action' => 'index', 'prefix' => false]) ?></li>
                    <?php if ($this->Identity->isLoggedIn()): ?>
                        <?php if ($this->Identity->get('role') === 'admin'): ?>
                            <li><?= $this->Html->link('Admin Panel', ['controller' => 'Content', 'action' => 'index', 'prefix' => 'Admin']) ?></li>
                        <?php endif; ?>
                        <li><?= $this->Html->link('Submit Content', ['controller' => 'Content', 'action' => 'add', 'prefix' => false]) ?></li>
                        <li><?= $this->Html->link('My Content', ['controller' => 'Content', 'action' => 'mine', 'prefix' => false]) ?></li>
                        <li><?= $this->Html->link('Logout (' . $this->Identity->get('name') . ')', ['controller' => 'Users', 'action' => 'logout', 'prefix' => false]) ?></li>
                    <?php else: ?>
                        <li><?= $this->Html->link('Login', ['controller' => 'Users', 'action' => 'login', 'prefix' => false]) ?></li>
                        <li><?= $this->Html->link('Register', ['controller' => 'Users', 'action' => 'register', 'prefix' => false]) ?></li>
                    <?php endif; ?>
                </ul>
            </nav>
        </div>
    </header>
    <main class="container">
        <?= $this->Flash->render() ?>
        <?= $this->fetch('content') ?>
    </main>
    <footer>
        <div class="container">
            <p>&copy; <?= date('Y') ?> LibreAudio PRO - Open-source directory for radios and podcasts</p>
        </div>
    </footer>
</body>
</html>
