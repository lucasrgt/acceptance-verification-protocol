import { defineVerification } from '@aerofortress/assay/react/vitest';
import { dataHonesty } from '@aerofortress/assay';
import { todoListSubject } from './todo-list.subject';

/**
 * Dogfood #2: a second archetype against the same real app. Assay mounts TodoApp
 * with an empty API and proves it renders the empty state instead of fabricating
 * fixture rows. Same declarative surface, different archetype — the neutral core
 * at work.
 */
defineVerification(dataHonesty, todoListSubject);
