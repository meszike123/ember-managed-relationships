import { moduleForModel, test } from 'ember-qunit';
import Ember from 'ember';

moduleForModel('student', 'Unit | Model | student', {
    // Specify the other units that are required for this test.
    //needs: ['model:class'],
    integration:true,

    beforeEach(){
    	let store = this.store();

		store.pushPayload({data: null, included:[
			{type: 'student', id: 1, attributes: {name: 'Peter'}, relationships: {major: {data: {id: 10, type: 'class'}}, newMajor: {data: {id: 12, type: 'class'}}}},
			{type: 'student', id: 2, attributes: {name: 'Tomas'}, relationships: {major: {data: null}}},
            {type: 'student', id: 3, attributes: {name: 'Bruno'}, relationships: {favourite: {data: {id: 12, type: 'class'}}}},
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
	    let student = store.peekRecord('student', 1);

    	assert.notOk(student.get('hasDirtyAttributes'));

    	student.set('name', 'Thomas');

    	assert.ok(student.get('hasDirtyAttributes'));
	
    	student.rollbackAttributes();

    	assert.notOk(student.get('hasDirtyAttributes'));
    });
});

test('Checking defined rollback method for attributes', function(assert) {
    Ember.run( () => {
    	const store = this.store();
	    let student = store.peekRecord('student', 1);

    	assert.notOk(student.get('isDirty'));

    	student.set('name', 'Thomas');

    	assert.ok(student.get('isDirty'));
	
    	student.rollback();

    	assert.notOk(student.get('isDirty'));
    });
});

test('Checking dirty tracking and rollback on belongsTo ', function(assert) {
    Ember.run( () => {
    	const store = this.store();
	    let student = store.peekRecord('student', 1);

		// Check the initial relationship
	    assert.equal(10, student.belongsTo('major').id());
    	assert.notOk(student.get('isDirty'));

    	student.set('major', store.peekRecord('class', 11));

    	// Check if the relationship has changed
    	assert.equal(11, student.belongsTo('major').id());
    	assert.ok(student.get('isDirty'));
	
    	student.rollback();

    	// Check the relationship has been rollbacked to the initial one
	    assert.equal(10, student.belongsTo('major').id());
    	assert.notOk(student.get('isDirty'));
    });
});

test('Making sure that rollback and dirty tracking works only relationships which have the checkReference option ', function(assert) {
    Ember.run( () => {
    	const store = this.store();
	    let student = store.peekRecord('student', 1);

		// Check the initial relationship
    	assert.notOk(student.get('isDirty'));

    	student.set('oldMajor', store.peekRecord('class', 11));

    	// Check if the relationship has changed
    	assert.equal(11, student.belongsTo('oldMajor').id());
    	assert.notOk(student.get('isDirty'));
	
    	student.rollback();

    	// Check the relationship has been rollbacked to the initial one
	    assert.equal(11, student.belongsTo('oldMajor').id());
    	assert.notOk(student.get('isDirty'));
    });
});

test('Making sure that the model is not dirtied when we set the same value', function(assert) {
    Ember.run( () => {
        const store = this.store();
        let student = store.peekRecord('student', 1);

        // Check the initial relationship
        assert.notOk(student.get('isDirty'));

        student.set('oldMajor', store.peekRecord('class', 10));

        // Check if the relationship has changed
        assert.notOk(student.get('isDirty'));
    });
});

//This should be an integration test :) 
// test('Test if save makes the record not dirty', function(assert) {
//     Ember.run( () => {
//     	const store = this.store();
// 	    let student = store.peekRecord('student', 1);

// 		// Check the initial relationship
// 	    assert.equal(2, student.belongsTo('major').id());
//     	assert.notOk(student.get('isDirty'));

//     	student.set('major', store.peekRecord('class', 3));

//     	// Check if the relationship has changed
//     	assert.equal(3, student.belongsTo('major').id());
//     	assert.ok(student.get('isDirty'));
	
//     	student.save().then((savedModel) => {
//     		Ember.run(() => {
//     			// Check the relationship has been undirtied after save
// 			    assert.equal(3, savedModel.belongsTo('major').id());
// 		    	assert.notOk(savedModel.get('isDirty'));
//     		});
//     	});

    	
//     });
// });

test('Checking dirty tracking when I change and then I change back the property', function(assert) {
    Ember.run( () => {
    	const store = this.store();
	    let student = store.peekRecord('student', 1);

		// Check the initial relationship
	    assert.equal(10, student.belongsTo('major').id());
    	assert.notOk(student.get('isDirty'));

    	student.set('major', store.peekRecord('class', 11));

    	// Check if the relationship has changed
    	assert.equal(11, student.belongsTo('major').id());
    	assert.ok(student.get('isDirty'));
		
		student.set('major', store.peekRecord('class', 10));
    	
    	// Check the relationship has been rollbacked to the initial one
	    assert.equal(10, student.belongsTo('major').id());
    	assert.notOk(student.get('isDirty'));
    });
});

test('Checking dirty tracking and rollback the default value is null', function(assert) {
    Ember.run( () => {
    	const store = this.store();
	    let student = store.peekRecord('student', 2);

		// Check the initial relationship
    	assert.notOk(student.get('isDirty'));

    	student.set('major', store.peekRecord('class', 10));

    	// Check if the relationship has changed
    	assert.equal(10, student.belongsTo('major').id());
    	assert.ok(student.get('isDirty'));
	
    	student.rollback();

    	// Check the relationship has been rollbacked to the initial one
	    assert.equal(null, student.belongsTo('major').id());
    	assert.notOk(student.get('isDirty'));
    });
});

test('check dirty tracking in managed entities when accessing through relationship', function(assert) {
    Ember.run( () => {
        const store = this.store();
        let student = store.peekRecord('student', 3);
        // Check the initial relationship
        assert.notOk(student.get('isDirty'));

        student.get('favourite').then( favouriteClass => {
            favouriteClass.set('name', "CS 101");

            assert.ok(favouriteClass.get('isDirty'));

            assert.ok(student.get('isDirty'));    

            student.rollback();

            assert.notOk(student.get('isDirty'));
            assert.notOk(favouriteClass.get('isDirty'));
            assert.equal(favouriteClass.get('name'), 'CS');
        });
    });
});

test('check dirty tracking in managed entities when accessing them directly', function(assert) {
    Ember.run( () => {
        const store = this.store();
        let student = store.peekRecord('student', 3);
        // Check the initial relationship
        assert.notOk(student.get('isDirty'));

        let favouriteClass = store.peekRecord('class', 12);

        favouriteClass.set('name', "CS 101");

        assert.ok(favouriteClass.get('isDirty'));

        assert.ok(student.get('isDirty'));    

        student.rollback();

        assert.notOk(student.get('isDirty'));
        assert.notOk(favouriteClass.get('isDirty'));
        assert.equal(favouriteClass.get('name'), 'CS');
    });
});

