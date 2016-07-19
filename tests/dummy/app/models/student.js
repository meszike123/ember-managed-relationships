import Model from 'ember-data/model';
import attr from 'ember-data/attr';
import { belongsTo/*, hasMany*/ } from 'ember-data/relationships';
import ManagedRelationshipsMixin from 'ember-managed-relationships/managed-relationships-mixin';

export default Model.extend(ManagedRelationshipsMixin, {
  name:   attr     ('string'),
  major: belongsTo('class', {inverse: null, checkReference: true}),
  favourite: belongsTo('class', {inverse: null, managed: true}),
  oldMajor: belongsTo('class', {inverse: null})
});