# Ember Managed Relationships

This ember addons tries to solve the problem, that ember-data is not handling relationship management out of box very good.

In Ember.js it is possible to define hasMany and belongsTo relationships, but is not possible to allow ember to track relationship status out of box. Just some of the problems of ember relationship management
 - Ember is not capable to track whether a child model is dirty and is not dirtiing a parent model
 - In meber it is not possible track whether the belongsTo has changed or not
 - Rollback is not working as expected
 - ...
 
# How is this working
Basically there are 3 types of relationships: 

## Referenced relationships
These relationships are most common, what really happens here is that we want to check wheather a reference to the model has changed, while we dont really care wheather the referced model has really changed

```
Subject = Model.extend(Managed, {
    name: attr('string')
})

Student = Model.extend(Managed, {
   favouriteSubject: belongsTo('subject', {referenced: true})
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
## Managed relationships
These are the relationships when we are interested to know wheather not just the references have changed, but are interested in the changed happening on objects too
```
Subject = Model.extend(Managed, {
    name: attr('string')
})

Student = Model.extend(Managed, {
   favouriteSubject: belongsTo('subject', {managed: true})
})

student2.get('favoriteSubject.name') == 'Math' //true
student2.get('isDirty') // false

favoriteSubject = student2.get('favoriteSubject');
favoriteSubject.get('isDirty') // false

favoriteSubject.set('name', 'English') //Setting different name
favoriteSubject.get('isDirty') // true - the value has changed

student2.get('isDirty') // true - the reference to the favoriteSubject has not changed, but the value has changed and this dirties the whole parent model

-------------------------------

student.get('favoriteSubject.id') == 1 //true
student.get('isDirty') // false

student.set('favoriteSubject', secondSubject) // has id '2' 
student.get('isDirty') // true - the reference to the favoriteSubject has changed - managed models take into account refence changes too

```
## ReadOnly relationships
In thesee relationships we dont care if the relationship changes or not 

# How to use
Right now it is not possible to install the addon throu ember:install, so if you would like to use this just insert a line to your package.json pointing to master or a tag in this repository

## Default API changes
`.isDirty` and `rollback()` will be defined on every Model. 

# Limitation
This plugin is not solving how to handle creation of new 'managed' models as Ember is not capable mapping newly created models, to models with ids. They are multiple ways how to solve this:
1. For the managed models use UUID as id so you can generate id's on frontend
2. unload the newly created models after save from the store
...

# Info
This package is soon going to be moved and this package will be deprecated so please check back for updates  



