var Stores = require('../../src/stores.js');
var moment = require('moment');

module.exports = {
  start: function(){
    var i = 0;
    var setText = function(item){
      document.getElementById('test').innerHTML = 'item (' + i + ') has value: ' + (item.data ? item.data.text : 'undefined') + ' and is ' + (item.loading ? 'loading': 'not loading')  + ' age: ' + moment().diff(moment(item.age), 'seconds');
    };
    var sub = function(){
        var item = Stores.dummy.fetch(i);
        setText(item);
    };
    setInterval(function(){
      var oldItem = Stores.dummy.fetch(i);
      oldItem.unsubscribe(sub);
      i++;
      if(i === 10) i = 0;
      var item = Stores.dummy.fetch(i, {maxAge:30});
      item.subscribe(sub);
      setText(item);
    },2000);
  }
}
