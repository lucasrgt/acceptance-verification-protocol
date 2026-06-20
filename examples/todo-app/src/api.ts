export interface Todo {
  id: string;
  title: string;
  done: boolean;
}

export const API_BASE = 'http://localhost:8787/api';

export async function listTodos(): Promise<Todo[]> {
  const r = await fetch(`${API_BASE}/todos`);
  if (!r.ok) throw new Error(`list failed: ${r.status}`);
  return r.json();
}

export async function addTodo(title: string): Promise<Todo> {
  const r = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!r.ok) throw new Error(`add failed: ${r.status}`);
  return r.json();
}

export async function toggleTodo(id: string, done: boolean): Promise<void> {
  const r = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ done }),
  });
  if (!r.ok) throw new Error(`toggle failed: ${r.status}`);
}

export async function removeTodo(id: string): Promise<void> {
  const r = await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`delete failed: ${r.status}`);
}
