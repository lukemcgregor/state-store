import _ from 'underscore';
import moment from 'moment';
import StoreItem from './storeItem.js';

export default function Store(options) {
	var store = {
		name: options.name,
		options: options,
		items: {},
		/*
			The next time this store is queried for this ID it will go to the server to fetch a new copy

			This is a soft invalidation (IE the data is still there), for a hard invalidation simply remove the object from the cache
		*/
		invalidate: function (id) {
			if (typeof (id) === 'object') {
				id = JSON.stringify(id);
			}
			if (this.items[id]) {
				this.items[id].invalidated = true;
			}
		},
		/*
			The hulksmash option where nothing in the cache should be returned anymore.
		*/
		clear: function () {
			this.items = { };
		},
		_logDebug: function (message) {
			console.log('Store ['+ this.name + ']: '+ message);
		},
		_error: function (message) {
			return new Error('Store ['+ this.name + ']: '+ message);
		},
		fetch: function (id, fetchOptions) {
			if (typeof (id) === 'object') {
				id = JSON.stringify(id);
			}
			if (this.options && this.options.loadFunc) {
				if (!this.items[id]) {
					this._logDebug('Creating stub and fetching entity for item ' + id);
					this.items[id] = new StoreItem(id);
					this.options.loadFunc(id, this, fetchOptions);
				}
				else if (this._needsFetchingFromServer(id, fetchOptions)) {
					this._logDebug('Refreshing item ' + id);
					this.items[id].loading = true;
					this.items[id].fetchTimestamp = moment();
					this.options.loadFunc(id, this, fetchOptions);
				}
				else if (fetchOptions && fetchOptions.onData) {
					fetchOptions.onData(this.items[id].data);
				}
			}
			else if (fetchOptions && fetchOptions.onData) {
				if(this.items[id]){
					fetchOptions.onData(this.items[id].data);
				}
			}
			this._logDebug('Returning ' + (this.items[id].loading ? 'unloaded' : 'loaded') + ' entity for ' + id + ' with ' + (this.items[id].data ? 'data' : 'no data'));
			return this.items[id];
		},
		fetchRange: function (ids, maxAge) {
			var results = [];
			_.each(ids, function (id) {
				results.push(this.fetch(id));
			}.bind(this));
			return results;
		},
		_needsFetchingFromServer: function (id, options) {
			if (this.items[id].loading) {
				//if this has a loading flag which is less than 5s old then the server mustnt have come back yet
				if(this.items[id].fetchTimestamp && moment().diff(this.items[id].fetchTimestamp, 'seconds') < 5){
					return false;
				}
				//if the loading flag is older than 5s assume something must have gone awol and re-request the data.
				return true;
			}
			//item has been cache invalidated.
			if (this.items[id].invalidated) {
				this._logDebug('item ' + id + ' was invalidated, re-requesting from the server');
				return true;
			}
			//Its too old
			if (options && typeof (options.maxAge) === 'number' && this.items[id].age) {
				if (moment().diff(this.items[id].age, 'milliseconds') > options.maxAge * 1000) {
					this._logDebug('item ' + id + ' aged ' + moment().diff(this.items[id].age, 'milliseconds') + 'ms is more than ' + options.maxAge + 's old, re-requesting it');
					return true;
				}
				else {
					this._logDebug('Item is ' + moment().diff(this.items[id].age, 'milliseconds') + 'ms old which is less than the maxAge ' + options.maxAge + 's');
				}
			}
			return false;
		},
		update: function (id, item) {
			if (typeof (id) === 'object') {
				id = JSON.stringify(id);
			}
			if (!this.items[id]) {
				this.add(id, item);
			}
			else {
				this.items[id].update(item);
			}
		},
		updateOptimistic: function (id, item) {
			if (typeof (id) === 'object') {
				id = JSON.stringify(id);
			}
			if (!this.items[id]) {
				this.add(id, item);
			}
			else {
				this.items[id].updateOptimistic(item);
			}
		},
		updateRemote: function (item, updateOptions) {
			if (!this.options || !this.options.updateFunc) {
				throw this._error('options.updateFunc must be defined to add an item to the server');
			}

			if (this.options.updateWithoutConfirmation) {
				this.updateFromRawData(item);
			}
			this.options.updateFunc(item, this, function (item) {
				if (item) {
					this.updateFromRawData(item);
				}
				if (updateOptions && updateOptions.onComplete) {
					updateOptions.onComplete(item);
				}
			}.bind(this), updateOptions);
		},
		updateFromRawData: function (data) {
			if (!this.options || !this.options.updateFromRawData) {
				throw this._error('updateFromRawData is not implemented');
			}
			this.options.updateFromRawData(data, this);
		},
		add: function (id, item) {
			if (typeof (id) === 'object') {
				id = JSON.stringify(id);
			}
			if (this.items[id]) {
				throw this._error('KeyConflict: An item with id ' + id + ' already exists, use .fetch(' + id + ').update(item) to update the entity');
			}
			this.items[id] = new StoreItem(id, item);
		},
		createRemote: function (item, createOptions) {
			if (!this.options || !this.options.createFunc) {
				throw this._error('options.createFunc must be defined to add an item to the server');
			}

			if (this.options.createWithoutConfirmation) {
				this.updateFromRawData(item);
			}
			this.options.createFunc(item, this,function (item) {
				if (item) {
					this.updateFromRawData(item);
				}
				if (createOptions && createOptions.onComplete) {
					createOptions.onComplete(item);
				}
			}.bind(this), createOptions);
		},
		remove: function (id) {
			if (typeof (id) === 'object') {
				id = JSON.stringify(id);
			}
			this.items[id] = undefined;
		},
		deleteRemote: function (id,  deleteOptions) {
			if (!this.options || !this.options.deleteFunc) {
				throw this._error('options.deleteFunc must be defined to delete an item on the server');
			}

			if (this.options.deleteWithoutConfirmation) {
				this.remove(id);
			}
			this.options.deleteFunc(id,this, function (id) {
				if (!this.options.deleteWithoutConfirmation) {
					this.remove(id);
				}
				if (deleteOptions && deleteOptions.onComplete) {
					deleteOptions.onComplete();
				}
			}.bind(this), deleteOptions);
		},
		toServerModel: function (clientModel) {
			if (!this.options || !this.options.toServerModel) {
				throw this._error('options.toServerModel must be defined to perform a stacked map');
			}
			return options.toServerModel(clientModel);
		},
		toClientModel: function (serverModel) {
			if (!this.options || !this.options.toClientModel) {
				throw this._error('options.toClientModel must be defined to perform a stacked map');
			}
			return options.toClientModel(serverModel);
		},
	};
	if (options && options.initialState) {
		_.each(options.initialState, function (item) {
			store.updateFromRawData(item);
		});
	}
	return store;
};
