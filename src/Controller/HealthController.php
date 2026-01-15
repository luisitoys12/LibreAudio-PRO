<?php
declare(strict_types=1);

namespace App\Controller;

use Cake\Event\EventInterface;

class HealthController extends AppController
{
    public function beforeFilter(EventInterface $event)
    {
        parent::beforeFilter($event);
        $this->Authentication->addUnauthenticatedActions(['index']);
    }

    public function index()
    {
        $this->viewBuilder()->disableAutoLayout();
        $this->response = $this->response->withType('application/json');
        
        $status = [
            'status' => 'ok',
            'timestamp' => date('c'),
            'application' => 'LibreAudio PRO',
        ];
        
        $this->set('data', $status);
        $this->viewBuilder()->setOption('serialize', 'data');
    }
}
