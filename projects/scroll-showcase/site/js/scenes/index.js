// scenes/index.js: the scene registry (frozen in wave 0). Exactly six modules, in arc order (§3.1).
// Static guard 7 checks that it exports 6 modules and that each `meta` equals SCENES.
import * as s1 from './s1-incidence.js';
import * as s2 from './s2-field.js';
import * as s3 from './s3-refraction.js';
import * as s4 from './s4-dichroic.js';
import * as s5 from './s5-agreement.js';
import * as s6 from './s6-return.js';

/** @type {readonly import('../types.js').SceneModule[]} */
const scenes = Object.freeze([s1, s2, s3, s4, s5, s6]);

export default scenes;
