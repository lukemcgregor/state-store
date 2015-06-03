# state-store [![NPM version][npm-image]][npm-url]


State store is a clientside caching library designed to simplify interaction between a clientside application and data on the server.

## Installation
```sh
$ npm install state-store --save
```

###Why should I care

If you are building a single page app, you likely have a simple relationship with the server. You request some data, you display some data, you send some data back.

When your app gets bigger server data will probably be used in multiple places.

This tool helps you keep one consistent cache of the server so that your app displays consistent data everywhere. In addition it reduces network overhead by only fetching data from the server if the cache is out of date.

###What is a store

A store is a wrapper around a type of data. For example you might have a userProfileStore which holds profile data for users of your site

eg.

```javascript
new Store({
	updateFromRawData: function (data, store) {
		if (data) {
			store.update(data.Id, {
				id: data.Id,
				name: data.Name,
				website: data.Website,
				joinDate: data.JoinDate,
				location: data.Location,
				company: data.Company,
				email: data.Email,
				largePictureUrl: data.LargePictureUrl,
				smallPictureUrl: data.SmallPictureUrl
			});
		}
	}
});
```

> Each store **must** have an `updateFromRawData` method, this maps data to your client side model and extracts an Id from the data.

###Fetching data
To retrieve data from a store simply use the fetch method.

```javascript
var item = myStore.fetch(id);
```

This will return an object which wraps the data you put in (`item.data`) and has useful information like the age of the data (`item.age`) and if there is a current request pending for that data (`item.loading`)

###What if the Id isn't cached yet?
Stores can be plugged into your backend system by specifying a `loadFunc`

eg.

```javascript
new Store({
	updateFromRawData: function (data, store, options) {
		//...
	},
	loadFunc: function(id, store){
		var xhr = ajaxRequest('GET', '/user/' + id + '/profile', function (data) {
			if(options && options.onData){
				options.onData(store.fetch(id).data);
			}
		});
		xhr.send();
	}
});
```

The `loadFunc` will be executed when you fetch data which is not cached or not up to date.

> NOTE: if you fetch data which is not cached you will immediately be returned an object with no data and a loading state.

###Tell me when my new data arrives
When calling fetch you can specify an onData callback. This will be called immediately if data exists and passed into your loadFunc on the options object for post-request execution.

```javascript
var item = myStore.fetch(id, {
	onData: function(d){
		//...
	}
});
```

> TODO: improve this interaction.

###Tell me when the data changes
Data can change for lots of reasons, If you weren't the one to request the change you can subscribe to the object to get a callback whenever that data is updated.

```javascript
var item = myStore.fetch(id);
var unsubscribe = item.subscribe(function(oldData, newData){
	//...
});
```
This means you can do stuff when your item is changed.

> TODO: optionally back this into localStorage so it also works across windows.

###I want it fresh

Making sure that your data is recent is important. You can use maxage to trigger a reload of the data if its older than the specified time (in seconds)

```javascript
var item = myStore.fetch(id, { maxAge: 30 });
```

> NOTE: you will be given the older data first with a loading flag if a reload is required, use this in conjunction with one of the above notification methods.

###I know something is out of date

If you want the item to be refreshed on next request (but don't want to do it optimistically) you can use `item.invalidate()` this will trigger a reload on next request.

###Stores object
You can keep track of all your stores using the Stores object.

Simply register them at appStart and then use them off the Stores object. This will make sure when data changes its correctly propagated across your app.

```javascript
Stores.registerStore('UserProfile', new Store({
	//...
}));

var userOne = Stores.UserProfile.fetch(1);
```

###I want to boss the server round
Options are also available to create (createRemote), update (updateRemote) and delete (deleteRemote) on the server.

Like loading data these functions require the implementation of a specific action method.

###The real magic
Subscribing to change events is a pain, a far better way is to automate this.

By using state-store-mixin (reactJS) you can automate the process of subscribing to changes and triggering updates. This mixin auto subscribes you to anything you fetch, and re-renders when the data is changed.

[npm-image]: https://img.shields.io/npm/v/state-store.svg?style=flat-square
[npm-url]: https://npmjs.org/package/state-store
