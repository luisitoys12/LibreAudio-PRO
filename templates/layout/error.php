<!DOCTYPE html>
<html>
<head>
    <?= $this->Html->charset() ?>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>
        Error - LibreAudio PRO
    </title>
    <?= $this->Html->meta('icon') ?>
    <?= $this->Html->css(['style']) ?>
</head>
<body>
    <header>
        <div class="container">
            <h1>🎵 LibreAudio PRO</h1>
        </div>
    </header>
    <main class="container">
        <?= $this->Flash->render() ?>
        <?= $this->fetch('content') ?>
    </main>
    <footer>
        <div class="container">
            <p>&copy; <?= date('Y') ?> LibreAudio PRO</p>
        </div>
    </footer>
</body>
</html>
