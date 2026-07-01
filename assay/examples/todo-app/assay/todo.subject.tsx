import type { ActionEffectSubject } from '@aerofortress/assay/react';
import { TodoApp } from '../src/TodoApp';
import { API_BASE } from '../src/api';

/**
 * Declares the seams of the "add todo" flow so Assay can drive it: how to mount,
 * the domain endpoint the action must hit, the control the user activates, and
 * the input whose draft must survive a failure.
 */
export const addTodoSubject: ActionEffectSubject = {
  name: 'todo: add',
  render: () => <TodoApp />,
  endpoint: { method: 'POST', path: `${API_BASE}/todos` },
  action: { role: 'button', name: /add/i },
  input: { role: 'textbox', name: /new todo/i },
  draftSample: 'buy milk',
  successResponse: { id: 'created-1', title: 'buy milk', done: false },
};
