// class WebSocketFactory extends window.WebSocket {
//     constructor (url, protocols) {
//         super(url, protocols);
//         super.onopen = () => {
//             console.log('已連線');

//             this.startHeart();
//         };
//         super.onmessage = () => {
//             this.resetHeart();
//         };
//         super.onerror = (e) => {
//             console.log("連線有錯誤", e);
//         };
//         super.onclose = () => {
//             console.log('連線已斷開');

//             this.stopHeart();
//         };

//         this._id = 'v0001';
//         this._cbOnopenMain = ()=>{};
//         this._cbOnmessageMain = ()=>{};
//         this._cbOnerrorMain = ()=>{};
//         this._cbOncloseMain = ()=>{};
//         this._cbOnopenSub = ()=>{};
//         this._cbOnmessageSub = ()=>{};
//         this._cbOnerrorSub = ()=>{};
//         this._cbOncloseSub = ()=>{};
//     }

//     set id (value) {
//         this._id = value;
//     }

//     set onopen (callback = ()=>{}) {
//         this._cbOnopenMain = callback;
//         super.addEventListener('open', () => {
//             callback();
//             this._cbOnopenSub();
//         });
//     }

//     set onmessage (callback = ()=>{}) {
//         this._cbOnmessageMain = callback;
//         super.addEventListener('message', (e) => {
//             //  Heart beat
//             if (e.data === '3' || e.data === 'pong') {
//                 return;
//             }
//             let isJsonString=(str)=> {
//                 try {
//                     const parsed = JSON.parse(str);
//                     // 檢查解析後是否為物件或陣列，且不是 null
//                     return typeof parsed === 'object' && parsed !== null;
//                 } catch (e) {
//                     return false;
//                 }
//             };
//             let bJson = isJsonString(e.data);
//             let data;
//             if(bJson === true){
//                 data = JSON.parse(e.data); // json.
//             }else{
//                 data = e.data.split(',');       //  csv解法
//             }
//             // if (typeof e.data === 'string') {
//             //     data = e.data.split(',');       //  csv解法
//             // } else {
//             //     data = JSON.parse(e.data);
//             // }
            
//             callback(data);
//             this._cbOnmessageSub(data);
//         });
//     }
//     set onerror (callback = ()=>{}) {
//         this._cbOnerrorMain = callback;
//         super.addEventListener('error', (e) => {
//             callback(e);
//             this._cbOnerrorSub(data);
//         });
//     }
//     set onclose (callback = ()=>{}) {
//         this._cbOncloseMain = callback;
//         super.addEventListener('close', () => {
//             callback();
//             this._cbOncloseSub();
//         });
//     }

//     get cbOnopenList () {
//         return this._cbOnopenList;
//     }
//     get cbOnmessageList () {
//         return this._cbOnmessageList;
//     }
//     get cbOnerrorList () {
//         return this._cbOnerrorList;
//     }
//     get cbOncloseList () {
//         return this._cbOncloseList;
//     }

//     addEventListener (cmd, callback = () => {}) {
//         switch (cmd) {
//             case 'open': {
//                 this._cbOnopenSub = callback;
//                 break;
//             }
//             case 'message': {
//                 this._cbOnmessageSub = callback;
//                 break;
//             }
//             case 'error': {
//                 this._cbOnerrorSub = callback;
//                 break;
//             }
//             case 'close': {
//                 this._cbOncloseSub = callback;
//                 break;
//             }
//             default: {
//                 console.error('addEventListener 參數錯誤');
//                 break;
//             }
//         }
//     }

//     removeEventListener (cmd, callback = () => {}) {
//         switch (cmd) {
//             case 'open': {
//                 this.removeFromArray(this._cbOnopenList, callback);
//                 break;
//             }
//             case 'message': {
//                 this.removeFromArray(this._cbOnmessageList, callback);
//                 break;
//             }
//             case 'error': {
//                 this.removeFromArray(this._cbOnerrorList, callback);
//                 break;
//             }
//             case 'close': {
//                 this.removeFromArray(this._cbOncloseList, callback);
//                 break;
//             }
//             default: {
//                 console.error('removeEventListener 參數錯誤');
//                 break;
//             }
//         }
//     }

//     removeFromArray (array, wantRemoveFunction) {
//         const indexToRemove = array.indexOf(wantRemoveFunction);
//         if (indexToRemove !== -1) {
//             array.splice(indexToRemove, 1);
//         }
//     }

//     startHeart () {
//         this._timer = setTimeout(() => {
//             super.send(`${this._id},PING`);
//         }, 60000);
//     }

//     stopHeart () {
//         clearTimeout(this._timer);
//     }

//     resetHeart () {
//         this.stopHeart();
//         this.startHeart();
//     }
// }
class WebSocketFactory {
    constructor(url, protocols) {
        this._url = url;
        this._protocols = protocols;
        this._id = 'v0001';
        this._ws = null;
        this._timer = null;

        this._callbacks = {
            open: [],
            message: [],
            error: [],
            close: [],
        };

        this._mainCallbacks = {
            open: null,
            message: null,
            error: null,
            close: null,
        };

        this._connect();
    }

    _connect() {
        this._ws = new WebSocket(this._url, this._protocols);

        this._ws.addEventListener('open', () => {
            console.log('已連線');
            this._startHeart();

            if (typeof this._mainCallbacks.open === 'function') {
                this._mainCallbacks.open();
            }
            this._callbacks.open.forEach(cb => cb());
        });

        this._ws.addEventListener('message', (e) => {
            // 心跳判斷
            if (e.data === '3' || e.data === 'pong') return;
            this._resetHeart();

            let data;
            try {
                data = JSON.parse(e.data);
            } catch {
                data = e.data.split(',');
            }

            if (typeof this._mainCallbacks.message === 'function') {
                this._mainCallbacks.message(data);
            }
            this._callbacks.message.forEach(cb => cb(data));
        });

        this._ws.addEventListener('error', (e) => {
            if (typeof this._mainCallbacks.error === 'function') {
                this._mainCallbacks.error(e);
            }
            this._callbacks.error.forEach(cb => cb(e));
        });

        this._ws.addEventListener('close', () => {
            console.log('連線已斷開');
            this._stopHeart();

            if (typeof this._mainCallbacks.close === 'function') {
                this._mainCallbacks.close();
            }
            this._callbacks.close.forEach(cb => cb());
        });
    }

    _startHeart() {
        this._stopHeart();
        this._timer = setTimeout(() => {
            this.send(`${this._id},PING`);
        }, 60000);
    }

    _resetHeart() {
        this._startHeart();
    }

    _stopHeart() {
        clearTimeout(this._timer);
        this._timer = null;
    }

    send(data) {
        if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
            console.error('WebSocket 尚未開啟或已關閉，無法發送資料');
            return false;
        }
        this._ws.send(data);
        return true;
    }

    close() {
        this._ws?.close();
    }

    reconnect() {
        this.close();
        this._connect();
    }

    set id(value) {
        this._id = value;
    }

    set onopen(callback) {
        this._mainCallbacks.open = callback;
    }

    set onmessage(callback) {
        this._mainCallbacks.message = callback;
    }

    set onerror(callback) {
        this._mainCallbacks.error = callback;
    }

    set onclose(callback) {
        this._mainCallbacks.close = callback;
    }

    addEventListener(type, callback) {
        if (this._callbacks[type]) {
            this._callbacks[type].push(callback);
        } else {
            console.error(`addEventListener 事件類型錯誤: ${type}`);
        }
    }

    removeEventListener(type, callback) {
        if (this._callbacks[type]) {
            const index = this._callbacks[type].indexOf(callback);
            if (index !== -1) this._callbacks[type].splice(index, 1);
        } else {
            console.error(`removeEventListener 事件類型錯誤: ${type}`);
        }
    }

    get readyState() {
        return (this._ws && typeof this._ws.readyState !== 'undefined')
            ? this._ws.readyState
            : WebSocket.CLOSED;
    }    
}
WebSocketFactory.CONNECTING = WebSocket.CONNECTING;
WebSocketFactory.OPEN = WebSocket.OPEN;
WebSocketFactory.CLOSING = WebSocket.CLOSING;
WebSocketFactory.CLOSED = WebSocket.CLOSED;


class MyWebSocket {
    // static CONNECTING = WebSocketFactory.CONNECTING;
    // static OPEN = WebSocketFactory.OPEN;
    // static CLOSING = WebSocketFactory.CLOSING;
    // static CLOSED = WebSocketFactory.CLOSED;

    constructor (url, protocols) {
        this._ws = new WebSocketFactory(url, protocols);

        this._id = 'v0001';
        this._cbOnopenList = [];
        this._cbOnmessageList = [];
        this._cbOnerrorList = [];
        this._cbOncloseList = [];
        this._cbOnopenMain = ()=>{};
        this._cbOnmessageMain = ()=>{};
        this._cbOnerrorMain = ()=>{};
        this._cbOncloseMain = ()=>{};
        this._url = url;
        this._protocols = protocols;
    }

    set id (value) {
        this._id = value;
        this._ws.id = this._id;
    }

    set onopen (callback = ()=>{}) {
        this._cbOnopenMain = callback;
        this._ws.onopen = this._cbOnopenMain;
    }
    set onmessage (callback = ()=>{}) {
        this._cbOnmessageMain = callback;
        this._ws.onmessage = this._cbOnmessageMain;
    }
    set onerror (callback = ()=>{}) {
        this._cbOnerrorMain = callback;
        this._ws.onerror = this._cbOnerrorMain;
    }
    set onclose (callback = ()=>{}) {
        this._cbOncloseMain = callback;
        this._ws.onclose = this._cbOncloseMain;
    }

    get readyState () {
        return this._ws.readyState;
    }

    get cbOnopenList () {
        return this._cbOnopenList;
    }
    get cbOnmessageList () {
        return this._cbOnmessageList;
    }
    get cbOnerrorList () {
        return this._cbOnerrorList;
    }
    get cbOncloseList () {
        return this._cbOncloseList;
    }

    addEventListener (cmd, callback = () => {}) {
        switch (cmd) {
            case 'open': {
                this._ws.addEventListener(cmd, callback);
                this._cbOnopenList[0] = callback;
                break;
            }
            case 'message': {
                this._ws.addEventListener(cmd, callback);
                this._cbOnmessageList[0] = callback;
                break;
            }
            case 'error': {
                this._ws.addEventListener(cmd, callback);
                this._cbOnerrorList[0] = callback;
                break;
            }
            case 'close': {
                this._ws.addEventListener(cmd, callback);
                this._cbOncloseList[0] = callback;
                break;
            }
            default: {
                console.error('addEventListener 參數錯誤');
                break;
            }
        }
    }

    reconnecting () {
        this._ws = new WebSocketFactory(this._url, this._protocols);

        // this._id = 'v0001';

        this.onopen = this._cbOnopenMain;
        this.onmessage = this._cbOnmessageMain;
        this.onerror = this._cbOnerrorMain;
        this.onclose = this._cbOncloseMain;

        const cbOnopenList = this._cbOnopenList;
        const cbOnmessageList = this._cbOnmessageList;
        const cbOnerrorList = this._cbOnerrorList;
        const cbOncloseList = this._cbOncloseList;

        cbOnopenList.forEach((cb) => {
            this.addEventListener('open', cb);
        });
        cbOnmessageList.forEach((cb) => {
            this.addEventListener('message', cb);
        });
        cbOnerrorList.forEach((cb) => {
            this.addEventListener('error', cb);
        });
        cbOncloseList.forEach((cb) => {
            this.addEventListener('close', cb);
        });
    }

    send (data) {
        if (!this._ws) {
            console.error('Send失敗，WebSocket is undefined');
            return false;
        }
        
        if (this._ws.readyState === WebSocket.CONNECTING) {
            console.error('Send失敗，WebSocket正在連線中');
            return false;
        }
        
        if (this._ws.readyState === WebSocket.CLOSING) {
            console.error('Send失敗，WebSocket連線正在關閉中');
            return false;
        }
        
        if (this._ws.readyState === WebSocket.CLOSED) {
            console.error('Send失敗，WebSocket連線已關閉或無法開啟。');
            return false;
        }

        this._ws.send(data);
        return true;
    }

    close () {
        this._ws.close();
    }
}
MyWebSocket.CONNECTING = WebSocketFactory.CONNECTING;
MyWebSocket.OPEN = WebSocketFactory.OPEN;
MyWebSocket.CLOSING = WebSocketFactory.CLOSING;
MyWebSocket.CLOSED = WebSocketFactory.CLOSED;
window.MyWebSocket = MyWebSocket;
