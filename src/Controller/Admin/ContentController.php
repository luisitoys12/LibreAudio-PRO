<?php
declare(strict_types=1);

namespace App\Controller\Admin;

use App\Controller\AppController;
use Cake\Event\EventInterface;

class ContentController extends AppController
{
    public function beforeFilter(EventInterface $event)
    {
        parent::beforeFilter($event);
        $this->Authentication->addUnauthenticatedActions([]);
    }

    public function beforeRender(EventInterface $event)
    {
        parent::beforeRender($event);
        $user = $this->Authentication->getIdentity();
        if (!$user || $user->role !== 'admin') {
            $this->Flash->error(__('You do not have permission to access this area.'));
            return $this->redirect(['controller' => 'Content', 'action' => 'index']);
        }
    }

    public function index()
    {
        $user = $this->Authentication->getIdentity();
        if (!$user || $user->role !== 'admin') {
            $this->Flash->error(__('Access denied.'));
            return $this->redirect(['controller' => 'Content', 'action' => 'index', 'prefix' => false]);
        }

        $query = $this->Content->find()->contain(['Users'])->order(['Content.created' => 'DESC']);
        $status = $this->request->getQuery('status');
        if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
            $query->where(['Content.status' => $status]);
        }

        $content = $this->paginate($query);
        $stats = [
            'pending' => $this->Content->find()->where(['status' => 'pending'])->count(),
            'approved' => $this->Content->find()->where(['status' => 'approved'])->count(),
            'rejected' => $this->Content->find()->where(['status' => 'rejected'])->count(),
            'total' => $this->Content->find()->count(),
        ];

        $this->set(compact('content', 'stats'));
    }

    public function view($id = null)
    {
        $user = $this->Authentication->getIdentity();
        if (!$user || $user->role !== 'admin') {
            $this->Flash->error(__('Access denied.'));
            return $this->redirect(['controller' => 'Content', 'action' => 'index', 'prefix' => false]);
        }

        $content = $this->Content->get($id, ['contain' => ['Users']]);
        $this->set(compact('content'));
    }

    public function approve($id = null)
    {
        $this->request->allowMethod(['post', 'get']);
        $user = $this->Authentication->getIdentity();
        if (!$user || $user->role !== 'admin') {
            $this->Flash->error(__('Access denied.'));
            return $this->redirect(['controller' => 'Content', 'action' => 'index', 'prefix' => false]);
        }

        $content = $this->Content->get($id);
        $content->status = 'approved';
        if ($this->Content->save($content)) {
            $this->Flash->success(__('Content has been approved.'));
        } else {
            $this->Flash->error(__('Unable to approve content.'));
        }
        return $this->redirect(['action' => 'index']);
    }

    public function reject($id = null)
    {
        $this->request->allowMethod(['post', 'get']);
        $user = $this->Authentication->getIdentity();
        if (!$user || $user->role !== 'admin') {
            $this->Flash->error(__('Access denied.'));
            return $this->redirect(['controller' => 'Content', 'action' => 'index', 'prefix' => false]);
        }

        $content = $this->Content->get($id);
        $content->status = 'rejected';
        if ($this->Content->save($content)) {
            $this->Flash->success(__('Content has been rejected.'));
        } else {
            $this->Flash->error(__('Unable to reject content.'));
        }
        return $this->redirect(['action' => 'index']);
    }

    public function delete($id = null)
    {
        $this->request->allowMethod(['post', 'delete']);
        $user = $this->Authentication->getIdentity();
        if (!$user || $user->role !== 'admin') {
            $this->Flash->error(__('Access denied.'));
            return $this->redirect(['controller' => 'Content', 'action' => 'index', 'prefix' => false]);
        }

        $content = $this->Content->get($id);
        if ($this->Content->delete($content)) {
            $this->Flash->success(__('Content has been deleted.'));
        } else {
            $this->Flash->error(__('Unable to delete content.'));
        }
        return $this->redirect(['action' => 'index']);
    }
}
