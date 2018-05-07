/*
  订阅-发布模式封装，用于页面间通信等

  声明在app.js文件中，例：App({ event: new Event() })

  使用示例：
    
  发送：
  app.event.emit('load', {a: 1}, 1000);
    
  接收：
  app.event.on('load', function(data){ 
    
    //销毁
    app.event.off('load');
  });

  注：delay传入number，如 1000, 表示1000ms后只执行一次;

      delay传入object，如 { repeat: 10, delay: 100}, 循环10次，每次间隔100ms，
        循环过程中若找到事件，则执行后立即终止循环;
        
      delay不传，则立即执行。
*/



class Event {
    constructor () {
        this._stores = {};
    }

    on (event, fn, ctx) {
        if (typeof fn != "function") {
            return;
        }
        
        this._stores[event] = this._stores[event] || [];
        this._stores[event].push({cb: fn, ctx: ctx});
    }
    emit (event, data = {}, delay) {
        let self = this;
        let store = null;
        
        if(delay && typeof delay == 'number') {
            setTimeout(() => {
                store = self._stores[event];
                self._emitData(store, data);

            }, delay);

        }else if(delay && typeof delay == 'object') {
            let repeat = delay.repeat || 20;
            let time = delay.time || 100;
            let count = 0;

            let timer = setInterval(() => {
                if(count == repeat) return clearInterval(timer);

                store = self._stores[event];
                self._emitData(store, data, timer);

                count++;

            }, time);

        }else {
            store = self._stores[event];
            self._emitData(store, data);
        }
    }

    _emitData (store, data, timer) {
        if(!store) return;
        if(!store.length) return;

        store = store.slice(0);
        store.forEach(item => {
            item.cb.call(item.ctx, data);
        });

        if(timer) {
            clearInterval(timer);
        }
    }

    off (event, fn) {
        // all
        if (!arguments.length) {
            this._stores = {};
            return;
        }
        // specific event
        let store = this._stores[event];
        if (!store) return;

        // remove all handlers
        if (arguments.length === 1) {
            delete this._stores[event];
            return;
        }

        // remove specific handler
        let cb;
        for (let i = 0, len = store.length; i < len; i++) {
            cb = store[i].cb;
            if (cb === fn) {
                store.splice(i, 1);
                break;
            }
        }
        return;
    }   
}

module.exports = Event;