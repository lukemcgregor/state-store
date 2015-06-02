'use strict';

var api = {
	registerStore: function (name, store) {
		if (api[name]) {
			throw new Error('store with name ' + name + ' already registered');
		}
		if (!store) {
			throw new Error('store not specified');
		}

		if (!store.fetch || typeof (store.fetch) !== 'function') {
			throw new Error('store is missing a fetch function');
		}
		if (!store.name) {
			store.name = name;
		}
		api[name] = store;
	},
	purgeAll: function () {
		for (var prop in api) {
			if (typeof (api[prop]) === 'object') {
				delete api[prop];
			}
		}
	}
};

module.exports = api;
