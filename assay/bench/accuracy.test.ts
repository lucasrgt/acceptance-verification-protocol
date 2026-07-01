import { verify } from '../src/adapter-react/verify';
import { actionEffect } from '../src/archetypes/action-effect';
import { pairs } from './pairs';
import { pairAccuracy } from './harness';

/**
 * The verifier's own accuracy benchmark. Before scoring any agent, the ruler
 * must be calibrated: does it fail the bad and pass the good? Green here = the
 * verifier works. A false-green is the catastrophic error.
 */
pairAccuracy({
  label: 'action-effect',
  pairs,
  run: (subject) => verify(actionEffect, subject),
});
