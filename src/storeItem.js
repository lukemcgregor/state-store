import _ from 'underscore';
import moment from 'moment';

export default function StoreItem(key, initialState) {
	var cacheItem = {
		key: key,
		data: null,
		loading: true,
		fetchTimestamp: moment(),
		invalidated: false,
		version: 0,
		age: null,
		subscribers: [],
		subscribe: function (onChange) {
			this.subscribers.push(onChange);
			return function () {
				this.unsubscribe(onChange);
			}.bind(this);
		},
		unsubscribe: function (onChange) {
			var index = this.subscribers.indexOf(onChange);
			if (index > -1) {
				this.subscribers.splice(index, 1);
			}
		},
		update: function (data) {
			var oldData = this.data;
			this.data = data;
			this.loading = false;
			this.invalidated = false;
			this.version++;
			this.age = moment();
			_.each(this.subscribers, function (onChange) {
				if (!_.isEqual(oldData, data)) {
					onChange(!_.isEqual(oldData, data), oldData, data);
				}
			}.bind(this));
		},
		updateOptimistic: function (data) {
			this.pesimisticData = this.data;
			this.data = data;
			_.each(this.subscribers, function (onChange) {
				if (!_.isEqual(this.pesimisticData, data)) {
					onChange(this.pesimisticData, data);
				}
			}.bind(this));
		},
		revertOptimistic: function () {
			var oldData = this.data;
			this.data = this.pesimisticData;
			_.each(this.subscribers, function (onChange) {
				if (!_.isEqual(oldData, data)) {
					onChange(oldData, data);
				}
			}.bind(this));
		}
	};

	if (initialState) {
		cacheItem.update(initialState);
	}
	return cacheItem;
};
