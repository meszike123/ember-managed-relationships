import Ember from 'ember';
import flatten from './utils/flatten';

function isRelationshipManaged(relationship){
	return relationship.relationshipMeta.options.managed;
}

export default Ember.Mixin.create({
	/* Properties */
	isDirty: Ember.computed('hasDirtyAttributes', '_hasDirtyRelationshipReference', function(){
		return this.get('hasDirtyAttributes') || this.get('_hasDirtyRelationshipReference');
	}),

	rollback(){
		this.rollbackAttributes();
		this._rollbackRelationshipReferences();
	},

	_rollbackRelationshipReferences (){
		this.eachRelationship((name, relationship) => {
			if (relationship.options.checkReference  || relationship.options.managed){
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

	_rollbackBelongsToRelation(name, managed){
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

		let originalValueIds = Ember.A(relationship.canonicalState.map(m => m.id));

		currentValue.addObjects(this.store.peekAll(relationship.belongsToType).filter(model => {
			return originalValueIds.contains(model.id)
		}));

		if (isRelationshipManaged(relationship)){
			currentValue.forEach( model => {
				if (model.get('isDirty')){
					model.rollback();
				}
			})	
		}
	},

	_defineRelationshipComputedPropert: Ember.on('init', function(){
		const related = Ember.A();

		this.eachRelationship((name, relationship) => {
			if (relationship.options.checkReference || relationship.options.managed){
				let relationshipData = {
					name: name,
					kind: relationship.kind,
					managed: Boolean(relationship.options.managed)
				}

				if (relationship.kind == 'hasMany'){
					relationshipData.key = [`${name}.[]`];

					if (relationshipData.managed){
						relationshipData.key.push(`${name}.@each.isDirty`);
					} 

				} else if (relationship.kind =='belongsTo'){
					relationshipData.key = [name];

					if (relationshipData.managed){
						relationshipData.key.push(`${name}.isDirty`);
					}

				} else {
					throw new Error(`this relationship type is not supported ${relationship.kind}`);
				}
				related.addObject(relationshipData);	
			}
		});

		if (!Ember.isEmpty(related)){
			Ember.defineProperty(this, '_hasDirtyRelationshipReference', Ember.computed.apply(null, [...flatten(related.mapBy('key')), function(){
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

	 	function isManaged(){
	 		return isRelationshipManaged(belongsToRelationship);
	 	}
	 	
	 	function isReferenceChanged(){
	 		if (belongsToRelationship.canonicalState){
		 		return !currentValue || belongsToRelationship.canonicalState.id !== currentValue.get('id') ;
		 	} else {
		 		return Boolean(currentValue);
		 	}
	 	}

	 	function isTheManegedEntityDirty(){
	 		return currentValue.get('isDirty');
	 	}
	 	return isManaged() ? isReferenceChanged() || isTheManegedEntityDirty() : isReferenceChanged();
	},

	_isHasManyDirty(hasManyRelationship){
		//Working just on async relations 
	 	let currentValue = this.get(hasManyRelationship.key).content;

	 	function isManaged(){
	 		return isRelationshipManaged(hasManyRelationship);
	 	}
	 	
	 	function isReferenceChanged(){
	 		return hasManyRelationship.canonicalState.length !== currentValue.length || Ember.A(hasManyRelationship.canonicalState).any((e, i) => e === currentValue[i]);
	 	}

	 	function isTheManegedEntityDirty(){

	 		return currentValue.any(model => model.get('isDirty') );
	 	}
	 	return isManaged() ? isReferenceChanged() || isTheManegedEntityDirty() : isReferenceChanged();

	 	
	},

	

});