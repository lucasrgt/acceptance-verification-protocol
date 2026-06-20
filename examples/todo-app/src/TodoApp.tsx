import { useEffect, useState } from 'react';
import { addTodo, listTodos, removeTodo, toggleTodo, type Todo } from './api';

/**
 * A small but real todo app. It handles the action-effect criteria correctly:
 * the Add button fires the real POST, and on failure it keeps the draft and
 * shows an error (no phantom success). AVP verifies exactly this — see
 * `avp/todo.avp.test.ts`.
 */
export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      setTodos(await listTodos());
      setError(null);
    } catch {
      setError('Could not load todos.');
    } finally {
      setLoading(false);
    }
  }

  async function onAdd() {
    const title = draft.trim();
    if (!title) return;
    setError(null);
    try {
      const created = await addTodo(title);
      setTodos((prev) => [...prev, created]);
      setDraft(''); // clear only once the effect really happened
    } catch {
      setError('Could not add the todo. Please try again.'); // keep the draft, surface the error
    }
  }

  async function onToggle(t: Todo) {
    try {
      await toggleTodo(t.id, !t.done);
      setTodos((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    } catch {
      setError('Could not update the todo.');
    }
  }

  async function onRemove(t: Todo) {
    try {
      await removeTodo(t.id);
      setTodos((prev) => prev.filter((x) => x.id !== t.id));
    } catch {
      setError('Could not delete the todo.');
    }
  }

  return (
    <main>
      <h1>Todos</h1>
      <div>
        <input
          aria-label="new todo"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What needs doing?"
        />
        <button onClick={onAdd}>Add</button>
      </div>
      {error && <div role="alert">{error}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : todos.length === 0 ? (
        <p>No todos yet.</p>
      ) : (
        <ul>
          {todos.map((t) => (
            <li key={t.id}>
              <label>
                <input type="checkbox" checked={t.done} onChange={() => onToggle(t)} /> {t.title}
              </label>
              <button onClick={() => onRemove(t)} aria-label={`delete ${t.title}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
