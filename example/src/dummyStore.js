var Stores = require('../../src/stores.js');
var Store = require('../../src/store.js');
var StoreItem = require('../../src/storeItem.js');

Stores.registerStore('dummy', new Store({
  loadFunc: function(id, store){
    setTimeout(function(){
        store.updateFromRawData({id: id, text: 'hello my id is ' + id + ' and the time is ' + new Date()});
    },1000);
  },
  updateFromRawData: function(entity, store){
    if(entity){
      store.update(entity.id, entity);
    }
  },
  initialState: [
    {id: 5, text: 'yolooooo'}
  ]
}));
