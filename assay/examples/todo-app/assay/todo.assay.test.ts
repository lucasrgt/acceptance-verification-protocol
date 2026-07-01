import { http, HttpResponse } from 'msw';
import { defineVerification } from '@aerofortress/assay/react/vitest';
import { actionEffect } from '@aerofortress/assay';
import { server } from '@aerofortress/assay/react';
import { addTodoSubject } from './todo.subject';
import { API_BASE } from '../src/api';

/**
 * No describe/it/expect: you declare the verification, Assay runs it and gates.
 * Assay mounts the real TodoApp, forces conditions via MSW, and emits a verdict.
 */
defineVerification(actionEffect, addTodoSubject, {
  // baseline so the initial list load succeeds; the verifier forces POST on top.
  setup: () => server.use(http.get(`${API_BASE}/todos`, () => HttpResponse.json([]))),
});
