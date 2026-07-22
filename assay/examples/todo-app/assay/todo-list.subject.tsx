import type { DataHonestySubject } from '@aerofortress/assay/react';
import { TodoApp } from '../src/TodoApp';
import { API_BASE } from '../src/api';

/**
 * Declares the seams for verifying the list is HONEST: which collection endpoint
 * it reads, how to count the rendered rows, and what an empty response looks like.
 * A real app must render the empty state on an empty API — never invent fixtures.
 * (No `mediaResponse`: todos carry no imagery, so `no-fabricated-media` is not applicable.)
 */
export const todoListSubject: DataHonestySubject = {
  name: 'todo: list',
  render: () => <TodoApp />,
  endpoint: { method: 'GET', path: `${API_BASE}/todos` },
  items: { role: 'listitem' },
  emptyResponse: [],
  fabricationMarkers: ['images.unsplash.com', 'i.pravatar.cc', 'placeholder'],
};
