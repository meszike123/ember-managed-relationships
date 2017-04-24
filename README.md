# Managed-relationships

This ember addons tries to solve the problem, that ember-data is not handling relationship management out of box very good.

In Ember.js it is possible to define hasMany and belongsTo relationships, but is not possible to allow ember to track relationship status out of box. Just some of the problems of ember relationship management
 - Ember is not capable to track whether a child model is dirty and is not dirtiing a parent model
 - In meber it is not possible track whether the belongsTo has changed or not
 - Rollback is not working as expected
 - ...
 
# How is this working
Basically there are 3 types of relationships: 

1. Referenced relationships
These relationships are most common, what really happens here is that we want to check wheather a reference to the model has changed, while we dont really care wheather the referced model has really changed

```
Subject = Model.extend({
    name: attr('string')
})

Student = Model.extend({
   favouriteSubject: belongsTo('subject')
})

student.get('favoriteSubject.id') == 1 //true
student.get('isDirty') // false

student.set('favoriteSubject', secondSubject) // has id '2' 
student.get('isDirty') // true - the reference to the favoriteSubject has changed
-------------------------------
student2.get('favoriteSubject.name') == 'Math' //true
student2.get('isDirty') // false

favoriteSubject = student2.get('favoriteSubject');
favoriteSubject.get('isDirty') // false

favoriteSubject.set('name', 'English') //Setting different name
favoriteSubject.get('isDirty') // true - the value has changed

student2.get('isDirty') // false - the reference to the favoriteSubject has not changed 
```

 
 



