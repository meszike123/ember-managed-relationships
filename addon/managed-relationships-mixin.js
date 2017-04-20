import Ember from 'ember';
import flatten from './utils/flatten';

function isRelationshipManaged(relationship){
    return relationship.relationshipMeta.options.managed;
}

export default Ember.Mixin.create({
    /* Public API changes */
    isDirty: Ember.computed('hasDirtyAttributes', '_hasDirtyRelationships', function(){
        return this.get('hasDirtyAttributes') || this.get('_hasDirtyRelationships');
    }),

    rollback(){
        if (this.get('hasDirtyAttributes')){
            this.rollbackAttributes();
        }
        if (this.get('_hasDirtyRelationships')){
            this._rollbackRelationships();
        }
    },

    save(...args){
        return this._super(...args).then( savedModel => {
            savedModel._commitModelAndManagedRelationships();
            return savedModel;
        })
    },


    /* private API */

    _commitModelAndManagedRelationships(commitThisModel = false){
        if (commitThisModel){
        	this._internalModel.adapterWillCommit();
            this._internalModel.updateChangedAttributes();
            this._internalModel.adapterDidCommit();
        }

        this.eachRelationship((name, relationship) => {
            if (relationship.options.managed){
                if (relationship.kind == 'hasMany'){
                    this._commitManagedHasMany(name, relationship.options.noCommitNew);
                } else if (relationship.kind =='belongsTo'){
                    this._commitManagedBelongsTo(name);

                } else {
                    throw new Error(`this relationship type is not supported ${relationship.kind}`);
                }
            }
        });

        // Invalidate all caches for managed and referenced relations
        this._invalidateHasDirtyRelationships();

    },

    _commitManagedBelongsTo(name){
        let currentValue = this.get(name).content;
        if (currentValue && currentValue._commitModelAndManagedRelationships){
            currentValue._commitModelAndManagedRelationships(true);
        }
    },

    _commitManagedHasMany(name, noCommitNew){
        let currentValue = this.get(name).content;
        if (currentValue){
            currentValue.toArray().forEach((model) => {
                if (model && model._commitModelAndManagedRelationships){
                    var commitThisModel = !model.get('isNew') || !noCommitNew
                    model._commitModelAndManagedRelationships(commitThisModel);
                }
            });
        }

    },

    _rollbackRelationships(){
        this.eachRelationship((name, relationship) => {
            if (relationship.options.referenced  || relationship.options.managed){
                if (relationship.kind == 'hasMany'){
                    this._rollbackHasManyRelation(name);
                } else if (relationship.kind =='belongsTo'){
                    this._rollbackBelongsToRelation(name);

                } else {
                    throw new Error(`this relationship type is not supported ${relationship.kind}`);
                }
            }
        });
    },

    _rollbackBelongsToRelation(name){
        let relationship = this.belongsTo(name).belongsToRelationship;
        if (relationship.hasLoaded && this._isBelongsToDirty(relationship)){
            let originalValue = null;
            if (relationship.canonicalState){
                originalValue = this.store.peekRecord(relationship.canonicalState.modelName, relationship.canonicalState.id);
            }

            let currentValue = this.get(name).content;
            this.set(name, originalValue);

            if (originalValue && isRelationshipManaged(relationship) && originalValue.get('isDirty')){
                originalValue.rollback();
            }
        }
    },

    _rollbackHasManyRelation(name){
        let relationship = this.hasMany(name).hasManyRelationship;

        let currentValue = Ember.A(this.get(relationship.key).content);

        currentValue.clear();



        if (relationship.isPolymorphic){
            let originalValueIdsAndTypes = Ember.A(relationship.canonicalState.map(m => {
                return { id: m.id, type:m.modelName }
            }));
            originalValueIdsAndTypes.forEach((e) => {
                currentValue.addObject(this.store.peekRecord(e.type, e.id));
            })
        } else {
            let originalValueIds = Ember.A(relationship.canonicalState.map(m => m.id));

            currentValue.addObjects(this.store.peekAll(relationship.belongsToType).filter(model => {
                return originalValueIds.contains(model.id)
            }));
        }

        if (isRelationshipManaged(relationship)){
            currentValue.forEach( model => {
                if (model.get('isDirty')){
                    model.rollback();
                }
            })
        }
    },

    _defineRelationshipComputedProperty: Ember.on('init', function(){
        const related = Ember.A();

        this.eachRelationship((name, relationship) => {
            if (relationship.options.referenced || relationship.options.managed){
                if (!relationship.options.async){
                    throw new Error('Managed relationships mixin works only with async relationships');
                }

                let relationshipData = {
                    name: name,
                    kind: relationship.kind,
                    managed: Boolean(relationship.options.managed)
                }

                if (relationship.kind == 'hasMany'){
                    relationshipData.keys = [`${name}.[]`];

                    if (relationshipData.managed){
                        relationshipData.keys.push(`${name}.@each.isDirty`);
                    }

                } else if (relationship.kind =='belongsTo'){
                    relationshipData.keys = [name];

                    if (relationshipData.managed){
                        relationshipData.keys.push(`${name}.isDirty`);
                    }

                } else {
                    throw new Error(`this relationship type is not supported ${relationship.kind}`);
                }
                related.addObject(relationshipData);
            }
        });

        if (!Ember.isEmpty(related)){
            Ember.defineProperty(this, '_hasDirtyRelationships', Ember.computed.apply(null, [...flatten(related.mapBy('keys')), '_invalidateCachedValue', function(){
                return this._isAtLeastOneBelongsToDirty(related) || this._isAtLeastOneHasManyDirty(related);
            }]));
        }
    }),

    _isAtLeastOneBelongsToDirty(relationships){
        let belongsTos = relationships.filterBy('kind', 'belongsTo');
        let belongsToRelations = belongsTos.map((r) => this.belongsTo(r.name).belongsToRelationship);

        //We filter out the ones which are not loaded yet, because there cannot be a change from the user side
        let belongsToLoadedRelations = Ember.A(belongsToRelations).filterBy('hasLoaded', true);

        return Ember.A(belongsToLoadedRelations).any((relation) => this._isBelongsToDirty(relation));
    },

    _isAtLeastOneHasManyDirty(relationships){
        let hasManys = relationships.filterBy('kind', 'hasMany');
        let hasManyRelations = hasManys.map((r) => this.hasMany(r.name).hasManyRelationship);

        //We filter out the ones which are not loaded yet, because there cannot be a change from the user side
        let hasManyLoadedRelations = Ember.A(hasManyRelations).filterBy('hasLoaded', true);

        return Ember.A(hasManyLoadedRelations).any((relation) => this._isHasManyDirty(relation));

    },

    _isBelongsToDirty(belongsToRelationship){
        //Working just on async relations
        let currentValue = this.get(belongsToRelationship.key).content;

        function isReferenceChanged(){
            if (belongsToRelationship.canonicalState){
                return !currentValue || belongsToRelationship.canonicalState.id !== currentValue.get('id') ;
            } else {
                return Boolean(currentValue);
            }
        }

        function isTheManegedEntityDirty(){
            if (!currentValue){
                return false;
            }
            return currentValue.get('isDirty');
        }

        return isRelationshipManaged(belongsToRelationship) ? isReferenceChanged() || isTheManegedEntityDirty() : isReferenceChanged();
    },

    _isHasManyDirty(hasManyRelationship){
        //Working just on async relations
        let currentValue = this.get(hasManyRelationship.key).content;
        const ordered = hasManyRelationship.relationshipMeta.options.ordered;

        function isReferenceChanged(){
            if (hasManyRelationship.canonicalState.length !== currentValue.length){
                return true
            }

            if (ordered){
                return Ember.A(hasManyRelationship.canonicalState).any((e, i) => e !== currentValue.currentState[i]);
            } else {
                const currentState = Ember.A(currentValue.currentState);
                return Ember.A(hasManyRelationship.canonicalState).any((e, i) => !currentState.contains(e));
            }

        }

        function isTheManegedEntityDirty(){
            return currentValue.any(model => model.get('isDirty') );
        }
        return isRelationshipManaged(hasManyRelationship) ? isReferenceChanged() || isTheManegedEntityDirty() : isReferenceChanged();


    },

    _invalidateCachedValue: false,

    _invalidateHasDirtyRelationships(){
        this.toggleProperty('_invalidateCachedValue');
    }
});
