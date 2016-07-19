import Ember from 'ember';
import DS from 'ember-data';

export default function(){
	DS.Model.reopen({
	    isDirty: Ember.computed('hasDirtyAttributes', function(){
			return this.get('hasDirtyAttributes');
		}),

		rollback(){
			this.rollbackAttributes();

		},

	});	
}