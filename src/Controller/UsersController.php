<?php
declare(strict_types=1);

namespace App\Controller;

use Cake\Event\EventInterface;

/**
 * Users Controller
 *
 * @property \App\Model\Table\UsersTable $Users
 */
class UsersController extends AppController
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

        // Allow public access to login and register
        $this->Authentication->addUnauthenticatedActions(['login', 'register']);
    }

    /**
     * Login method
     *
     * @return \Cake\Http\Response|null|void Redirects on successful login.
     */
    public function login()
    {
        $this->request->allowMethod(['get', 'post']);
        $result = $this->Authentication->getResult();

        // If the user is logged in send them to the admin area
        if ($result->isValid()) {
            $user = $this->Authentication->getIdentity();
            
            // Redirect based on role
            if ($user->role === 'admin') {
                $redirect = $this->request->getQuery('redirect', ['controller' => 'Content', 'action' => 'index', 'prefix' => 'Admin']);
            } else {
                $redirect = $this->request->getQuery('redirect', ['controller' => 'Content', 'action' => 'index']);
            }

            return $this->redirect($redirect);
        }

        // Display error if user submitted and authentication failed
        if ($this->request->is('post') && !$result->isValid()) {
            $this->Flash->error(__('Invalid email or password'));
        }
    }

    /**
     * Logout method
     *
     * @return \Cake\Http\Response|null|void Redirects to login.
     */
    public function logout()
    {
        $result = $this->Authentication->getResult();
        
        if ($result->isValid()) {
            $this->Authentication->logout();
            $this->Flash->success(__('You have been logged out.'));
        }

        return $this->redirect(['controller' => 'Users', 'action' => 'login']);
    }

    /**
     * Register method
     *
     * @return \Cake\Http\Response|null|void Redirects on successful registration.
     */
    public function register()
    {
        $user = $this->Users->newEmptyEntity();
        
        if ($this->request->is('post')) {
            $data = $this->request->getData();
            $data['role'] = 'user'; // Default role
            $data['active'] = true;
            
            $user = $this->Users->patchEntity($user, $data);
            
            if ($this->Users->save($user)) {
                $this->Flash->success(__('Registration successful. Please log in.'));

                return $this->redirect(['action' => 'login']);
            }
            $this->Flash->error(__('Registration failed. Please try again.'));
        }
        
        $this->set(compact('user'));
    }
}
