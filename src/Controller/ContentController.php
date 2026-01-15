<?php
declare(strict_types=1);

namespace App\Controller;

use Cake\Event\EventInterface;

/**
 * Content Controller
 *
 * @property \App\Model\Table\ContentTable $Content
 */
class ContentController extends AppController
{
    /**
     * Before filter callback.
     *
     * @param \Cake\Event\EventInterface $event The event.
     * @return \Cake\Http\Response|null|void
     */
    public function beforeFilter(EventInterface $event)
    {
        parent::beforeFilter($event);

        // Allow public access to index and view
        $this->Authentication->addUnauthenticatedActions(['index', 'view']);
    }

    /**
     * Index method - Public listing of approved content
     *
     * @return \Cake\Http\Response|null|void Renders view
     */
    public function index()
    {
        $query = $this->Content
            ->find('approved')
            ->contain(['Users'])
            ->order(['Content.created' => 'DESC']);

        // Filter by type if provided
        if ($this->request->getQuery('type')) {
            $query->where(['Content.type' => $this->request->getQuery('type')]);
        }

        $content = $this->paginate($query);

        $this->set(compact('content'));
    }

    /**
     * View method - View single content item
     *
     * @param string|null $id Content id.
     * @return \Cake\Http\Response|null|void Renders view
     * @throws \Cake\Datasource\Exception\RecordNotFoundException When record not found.
     */
    public function view($id = null)
    {
        $content = $this->Content->get($id, [
            'contain' => ['Users'],
        ]);

        // Only show approved content to non-owners
        $user = $this->Authentication->getIdentity();
        if ($content->status !== 'approved' && (!$user || $content->user_id !== $user->id)) {
            $this->Flash->error(__('Content not found.'));

            return $this->redirect(['action' => 'index']);
        }

        $this->set(compact('content'));
    }

    /**
     * Add method - Authenticated users can submit content
     *
     * @return \Cake\Http\Response|null|void Redirects on successful add, renders view otherwise.
     */
    public function add()
    {
        $this->request->allowMethod(['get', 'post']);
        
        $user = $this->Authentication->getIdentity();
        if (!$user) {
            $this->Flash->error(__('You must be logged in to submit content.'));

            return $this->redirect(['controller' => 'Users', 'action' => 'login']);
        }

        $content = $this->Content->newEmptyEntity();
        
        if ($this->request->is('post')) {
            $data = $this->request->getData();
            $data['user_id'] = $user->id;
            $data['status'] = 'pending'; // All new content starts as pending
            
            $content = $this->Content->patchEntity($content, $data);
            
            if ($this->Content->save($content)) {
                $this->Flash->success(__('Your content has been submitted for review.'));

                return $this->redirect(['action' => 'index']);
            }
            $this->Flash->error(__('Unable to submit content. Please try again.'));
        }
        
        $this->set(compact('content'));
    }

    /**
     * My Content - User's own submissions
     *
     * @return \Cake\Http\Response|null|void Renders view
     */
    public function mine()
    {
        $user = $this->Authentication->getIdentity();
        if (!$user) {
            $this->Flash->error(__('You must be logged in.'));

            return $this->redirect(['controller' => 'Users', 'action' => 'login']);
        }

        $content = $this->paginate($this->Content->find()
            ->where(['Content.user_id' => $user->id])
            ->order(['Content.created' => 'DESC']));

        $this->set(compact('content'));
    }
}
