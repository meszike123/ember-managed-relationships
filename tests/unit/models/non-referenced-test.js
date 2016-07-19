import { moduleForModel, test } from 'ember-qunit';
import Ember from 'ember';

moduleForModel('class', 'Unit | Model | default rollback and isDirty', {
    integration:true,
    // Specify the other units that are required for this test.
    beforeEach(){
    	let store = this.store();

		store.pushPayload({data: null, included:[
			{type: 'class', id: 10, attributes: {name: 'Mathematics'}},
			{type: 'class', id: 11, attributes: {name: 'Physics'}},
			{type: 'class', id: 12, attributes: {name: 'CS'}},
		]});
    },
    afterEach(){
    	Ember.run(() => {
    		const store = this.store();
    		store.unloadAll();	
    	});
    }
});

test('Default behaviour on attributes', function(assert) {
    Ember.run( () => {
        const store = this.store();
        let clazz = store.peekRecord('class', 10);

        assert.notOk(clazz.get('hasDirtyAttributes'));

        clazz.set('name', 'Thomas');

        assert.ok(clazz.get('hasDirtyAttributes'));
    
        clazz.rollbackAttributes();

        assert.notOk(clazz.get('hasDirtyAttributes'));
    });
});

test('Modified model behaviour on attributes', function(assert) {
    Ember.run( () => {
    	const store = this.store();
	    let clazz = store.peekRecord('class', 10);

    	assert.notOk(clazz.get('isDirty'));

    	clazz.set('name', 'Thomas');

    	assert.ok(clazz.get('isDirty'));
	
    	clazz.rollback();

    	assert.notOk(clazz.get('isDirty'));
    });
});

test('Checking defined rollback method for attributes', function(assert) {
    Ember.run( () => {
    	const store = this.store();
	    let clazz = store.peekRecord('class', 10);

    	assert.notOk(clazz.get('isDirty'));

	
    	clazz.rollback();

    	assert.notOk(clazz.get('isDirty'));
    });
});

