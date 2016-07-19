import { moduleForModel, test } from 'ember-qunit';
import Ember from 'ember';

moduleForModel('teacher', 'Unit | Model | teacher', {
    // Specify the other units that are required for this test.
    integration:true,
    //needs: ['model:student', 'model:class'],
    beforeEach(){
    	let store = this.store();

		store.pushPayload({data: null, included:[
			{type: 'student', id: 1, attributes: {name: 'Peter'}, relationships: {major: {data: {id: 10, type: 'class'}}}},
			{type: 'student', id: 2, attributes: {name: 'Tomas'}, relationships: {major: {data: null}}},
			{type: 'class', id: 10, attributes: {name: 'Mathematics'}},
            {type: 'teacher', id: 100, attributes: {name: 'Margaret'}, relationships: {students: {data: [{id: 1, type: 'student'}]}}},
		    {type: 'teacher', id: 101, attributes: {name: 'Alicia'}, relationships: {assistants: {data: [{id: 2, type: 'student'}]}}},
          
		]});
    },
    afterEach(){
    	Ember.run(() => {
    		const store = this.store();
    		store.unloadAll();	
    	});
    	
    }
});

test('if dirty tracking is functionning on hasMany relationships', function(assert) {
    Ember.run( () => {
    	const store = this.store();
	    let teacher = store.peekRecord('teacher', 100);

    	assert.notOk(teacher.get('isDirty'));

        teacher.get('students').then((students) =>{
        
            students.addObject(store.peekRecord('student', 2));

            assert.equal(2, teacher.hasMany('students').ids().length);

            assert.ok(teacher.get('isDirty'));  
            
            teacher.rollback();

            assert.notOk(teacher.get('isDirty'));
            assert.equal(1, teacher.hasMany('students').ids().length);            
        });
    });
});

test('if model is undiertied if we add and remove a record', function(assert) {
    Ember.run( () => {
        const store = this.store();
        let teacher = store.peekRecord('teacher', 100);

        assert.notOk(teacher.get('isDirty'));

        teacher.get('students').then((students) =>{
            let newStudent = store.peekRecord('student', 2);

            students.addObject(newStudent);

            assert.equal(2, teacher.hasMany('students').ids().length);

            assert.ok(teacher.get('isDirty'));  
            
            students.removeObject(newStudent);

            assert.notOk(teacher.get('isDirty'));
            assert.equal(1, teacher.hasMany('students').ids().length);            
        });
    });
});

test('if model is dirty tracking is functioning on managed relationships accessing it throught relationships', function(assert) {
    Ember.run( () => {
        const store = this.store();
        let teacher = store.peekRecord('teacher', 101);

        assert.notOk(teacher.get('isDirty'));

        teacher.get('assistants').then((assistants) =>{
            let assistant = assistants.get('firstObject');

            assistant.set('name', 'new assistant');
            assert.ok(assistant.get('isDirty'));
            assert.ok(teacher.get('isDirty'));

            teacher.rollback();
            
            assert.notOk(assistant.get('isDirty'));
            assert.notOk(teacher.get('isDirty'));
           
        });
    });
});

test('if model is dirty tracking is functioning on managed relationships accessing the an entity directly', function(assert) {
    Ember.run( () => {
        const store = this.store();
        let teacher = store.peekRecord('teacher', 101);

        assert.notOk(teacher.get('isDirty'));

        let assistant = store.peekRecord('student', 2);

        assistant.set('name', 'new assistant');
        assert.ok(assistant.get('isDirty'));
        assert.ok(teacher.get('isDirty'));

        teacher.rollback();
        
        assert.notOk(assistant.get('isDirty'));
        assert.notOk(teacher.get('isDirty'));
           
       
    });
});