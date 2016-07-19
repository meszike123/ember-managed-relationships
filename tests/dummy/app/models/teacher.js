import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { hasMany } from 'ember-data/relationships';
import ManagedRelationshipsMixin from 'ember-managed-relationships/managed-relationships-mixin';

export default Model.extend(ManagedRelationshipsMixin, {
  name:   attr     ('string'),
  students: hasMany('student', {inverse: null, checkReference: true}),
  assistants: hasMany('student', {inverse: null, managed: true})
});