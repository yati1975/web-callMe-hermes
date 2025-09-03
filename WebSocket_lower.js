// 確保 window.WebSocket 存在，否則在不支援 WebSocket 的環境下會報錯
if (typeof window.WebSocket === 'undefined') {
    console.error("This browser does not support WebSockets.");
}

// --- WebSocketFactory 的替代品：建構函式 ---
function WebSocketFactory(url, protocols) {
    var self = this; // 儲存 this 的引用，以在內部函式中使用正確的上下文

    self._url = url;
    self._protocols = protocols;
    self._id = 'v0001';
    self._ws = null; // 原生 WebSocket 實例
    self._timer = null; // 心跳定時器

    // 使用陣列來儲存多個回呼函式，以模擬 addEventListener 的行為
    self._callbacks = {
        open: [],
        message: [],
        error: [],
        close: []
    };

    // 用於儲存 `onopen`, `onmessage` 等屬性設定的主要回呼
    self._mainCallbacks = {
        open: null,
        message: null,
        error: null,
        close: null
    };

    self._connect(); // 自動建立連線
}

// 將方法添加到 WebSocketFactory 的原型鏈上
WebSocketFactory.prototype._connect = function() {
    var self = this;
    self._ws = new window.WebSocket(self._url, self._protocols);

    // 使用傳統 function 綁定事件，確保 this 指向 self
    self._ws.onopen = function() {
        console.log('已連線');
        self._startHeart();

        // 觸發主要回呼
        if (typeof self._mainCallbacks.open === 'function') {
            self._mainCallbacks.open();
        }
        // 觸發 addEventListener 註冊的回呼
        for (var i = 0; i < self._callbacks.open.length; i++) {
            self._callbacks.open[i]();
        }
    };

    self._ws.onmessage = function(event) {
        var e = event; // 為了保持與原程式碼的變數名一致
        self._resetHeart();

        // 心跳判斷
        if (e.data === '3' || e.data === 'pong') {
            return;
        }

        var isJsonString = function(str) {
            try {
                var parsed = JSON.parse(str);
                return typeof parsed === 'object' && parsed !== null;
            } catch (jsonError) {
                return false;
            }
        };

        var data;
        // 確保 e.data 是字串才嘗試解析 JSON 或 CSV
        if (typeof e.data === 'string') {
            if (isJsonString(e.data)) {
                data = JSON.parse(e.data); // json
            } else {
                data = e.data.split(','); // csv
            }
        } else {
            data = e.data; // 如果不是字串（例如 Blob, ArrayBuffer），直接傳遞
        }

        // 觸發主要回呼
        if (typeof self._mainCallbacks.message === 'function') {
            self._mainCallbacks.message(data);
        }
        // 觸發 addEventListener 註冊的回呼
        for (var i = 0; i < self._callbacks.message.length; i++) {
            self._callbacks.message[i](data);
        }
    };

    self._ws.onerror = function(e) {
        console.log("連線有錯誤", e);
        // 觸發主要回呼
        if (typeof self._mainCallbacks.error === 'function') {
            self._mainCallbacks.error(e);
        }
        // 觸發 addEventListener 註冊的回呼
        for (var i = 0; i < self._callbacks.error.length; i++) {
            self._callbacks.error[i](e);
        }
    };

    self._ws.onclose = function() {
        console.log('連線已斷開');
        self._stopHeart();

        // 觸發主要回呼
        if (typeof self._mainCallbacks.close === 'function') {
            self._mainCallbacks.close();
        }
        // 觸發 addEventListener 註冊的回呼
        for (var i = 0; i < self._callbacks.close.length; i++) {
            self._callbacks.close[i]();
        }

        self.removeAllEventListeners();
    };
};

WebSocketFactory.prototype._startHeart = function() {
    var self = this;
    self._stopHeart();
    self._timer = setTimeout(function() {
        // 使用字串串聯代替模板字串
        self.send(self._id + ',PING');
    }, 60000);
};

WebSocketFactory.prototype._resetHeart = function() {
    this._startHeart();
};

WebSocketFactory.prototype._stopHeart = function() {
    clearTimeout(this._timer);
    this._timer = null;
};

// send 方法
WebSocketFactory.prototype.send = function(data) {
    if (!this._ws) {
        console.error('Send失敗，WebSocket is undefined');
        return false;
    }

    if (this._ws.readyState === WebSocketFactory.CONNECTING) {
        console.error('Send失敗，WebSocket正在連線中');
        return false;
    }

    if (this._ws.readyState === WebSocketFactory.CLOSING) {
        console.error('Send失敗，WebSocket連線正在關閉中');
        return false;
    }

    if (this._ws.readyState === WebSocketFactory.CLOSED) {
        console.error('Send失敗，WebSocket連線已關閉或無法開啟。');
        return false;
    }

    this._ws.send(data);
    return true;
};

// close 方法
WebSocketFactory.prototype.close = function() {
    // 避免使用可選鏈操作符，改為條件判斷
    if (this._ws) {
        this._ws.close();
    }
};

// reconnect 方法
WebSocketFactory.prototype.reconnect = function() {
    this.close(); // 關閉現有連線
    this._connect(); // 重新建立連線
};


// Getter/Setter 的替代方案 (使用 Object.defineProperty)
Object.defineProperty(WebSocketFactory.prototype, 'id', {
    get: function() {
        return this._id;
    },
    set: function(value) {
        this._id = value;
    }
});

Object.defineProperty(WebSocketFactory.prototype, 'onopen', {
    get: function() {
        return this._mainCallbacks.open;
    },
    set: function(callback) {
        this._mainCallbacks.open = callback || function(){}; // 確保是函式
    }
});

Object.defineProperty(WebSocketFactory.prototype, 'onmessage', {
    get: function() {
        return this._mainCallbacks.message;
    },
    set: function(callback) {
        this._mainCallbacks.message = callback || function(){};
    }
});

Object.defineProperty(WebSocketFactory.prototype, 'onerror', {
    get: function() {
        return this._mainCallbacks.error;
    },
    set: function(callback) {
        this._mainCallbacks.error = callback || function(){};
    }
});

Object.defineProperty(WebSocketFactory.prototype, 'onclose', {
    get: function() {
        return this._mainCallbacks.close;
    },
    set: function(callback) {
        this._mainCallbacks.close = callback || function(){};
    }
});

// addEventListener 方法
WebSocketFactory.prototype.addEventListener = function(type, callback) {
    callback = callback || function(){}; // 預設參數
    if (this._callbacks[type]) {
        this._callbacks[type].push(callback);
    } else {
        console.error('addEventListener 事件類型錯誤: ' + type);
    }
};

// removeEventListener 方法
WebSocketFactory.prototype.removeEventListener = function(type, callback) {
    callback = callback || function(){}; // 預設參數
    if (this._callbacks[type]) {
        var index = this._callbacks[type].indexOf(callback);
        if (index !== -1) {
            this._callbacks[type].splice(index, 1);
        }
    } else {
        console.error('removeEventListener 事件類型錯誤: ' + type);
    }
};

WebSocketFactory.prototype.removeAllEventListeners = function() {
    for (var type in this._callbacks) {
        if (this._callbacks.hasOwnProperty(type)) {
            this._callbacks[type] = [];
        }
    }
};

// readyState getter
Object.defineProperty(WebSocketFactory.prototype, 'readyState', {
    get: function() {
        return (this._ws && typeof this._ws.readyState !== 'undefined') ? this._ws.readyState : window.WebSocket.CLOSED;
    }
});

// 靜態屬性，從原生 WebSocket 繼承
WebSocketFactory.CONNECTING = window.WebSocket ? window.WebSocket.CONNECTING : 0;
WebSocketFactory.OPEN = window.WebSocket ? window.WebSocket.OPEN : 1;
WebSocketFactory.CLOSING = window.WebSocket ? window.WebSocket.CLOSING : 2;
WebSocketFactory.CLOSED = window.WebSocket ? window.WebSocket.CLOSED : 3;


// --- MyWebSocket 的替代品：建構函式 ---
function MyWebSocket(url, protocols) {
    var self = this; // 儲存 this 的引用

    self._ws = new WebSocketFactory(url, protocols); // 建立 WebSocketFactory 實例

    self._id = 'v0001';
    // 這些列表在 MyWebSocket 中可能不再需要，因為 WebSocketFactory 內部已經處理了多個回呼。
    // 但為了保持原始結構，暫時保留。
    self._cbOnopenList = [];
    self._cbOnmessageList = [];
    self._cbOnerrorList = [];
    self._cbOncloseList = [];

    // 主要回呼的儲存
    self._cbOnopenMain = function(){};
    self._cbOnmessageMain = function(){};
    self._cbOnerrorMain = function(){};
    self._cbOncloseMain = function(){};

    self._url = url;
    self._protocols = protocols;

    // 將 WebSocketFactory 的 onopen/onmessage/onerror/onclose 轉發到 MyWebSocket 的主要回呼
    self._ws.onopen = function() {
        self._cbOnopenMain.apply(self, arguments); // 使用 apply 傳遞所有參數
    };
    self._ws.onmessage = function() {
        self._cbOnmessageMain.apply(self, arguments);
    };
    self._ws.onerror = function() {
        self._cbOnerrorMain.apply(self, arguments);
    };
    self._ws.onclose = function() {
        self._cbOncloseMain.apply(self, arguments);
    };
}

// 將方法添加到 MyWebSocket 的原型鏈上

// 靜態屬性
MyWebSocket.CONNECTING = WebSocketFactory.CONNECTING;
MyWebSocket.OPEN = WebSocketFactory.OPEN;
MyWebSocket.CLOSING = WebSocketFactory.CLOSING;
MyWebSocket.CLOSED = WebSocketFactory.CLOSED;

// Getter/Setter 的替代品
Object.defineProperty(MyWebSocket.prototype, 'id', {
    get: function() {
        return this._id;
    },
    set: function(value) {
        this._id = value;
        if (this._ws) {
            this._ws.id = this._id;
        }
    }
});

Object.defineProperty(MyWebSocket.prototype, 'onopen', {
    get: function() {
        return this._cbOnopenMain;
    },
    set: function(callback) {
        this._cbOnopenMain = callback || function(){};
        if (this._ws) {
            this._ws.onopen = this._cbOnopenMain;
        }
    }
});

Object.defineProperty(MyWebSocket.prototype, 'onmessage', {
    get: function() {
        return this._cbOnmessageMain;
    },
    set: function(callback) {
        this._cbOnmessageMain = callback || function(){};
        if (this._ws) {
            this._ws.onmessage = this._cbOnmessageMain;
        }
    }
});

Object.defineProperty(MyWebSocket.prototype, 'onerror', {
    get: function() {
        return this._cbOnerrorMain;
    },
    set: function(callback) {
        this._cbOnerrorMain = callback || function(){};
        if (this._ws) {
            this._ws.onerror = this._cbOnerrorMain;
        }
    }
});

Object.defineProperty(MyWebSocket.prototype, 'onclose', {
    get: function() {
        return this._cbOncloseMain;
    },
    set: function(callback) {
        this._cbOncloseMain = callback || function(){};
        if (this._ws) {
            this._ws.onclose = this._cbOncloseMain;
        }
    }
});

Object.defineProperty(MyWebSocket.prototype, 'readyState', {
    get: function() {
        // 確保 _ws 存在，並取得其 readyState
        return this._ws ? this._ws.readyState : MyWebSocket.CLOSED;
    }
});

// Getter for cbOnopenList etc. (保留原有屬性，但實際功能由 WebSocketFactory 處理)
Object.defineProperty(MyWebSocket.prototype, 'cbOnopenList', { get: function() { return this._cbOnopenList; } });
Object.defineProperty(MyWebSocket.prototype, 'cbOnmessageList', { get: function() { return this._cbOnmessageList; } });
Object.defineProperty(MyWebSocket.prototype, 'cbOnerrorList', { get: function() { return this._cbOnerrorList; } });
Object.defineProperty(MyWebSocket.prototype, 'cbOncloseList', { get: function() { return this._cbOncloseList; } });

// addEventListener 的實現
MyWebSocket.prototype.addEventListener = function(cmd, callback) {
    callback = callback || function(){}; // 預設參數
    // 將 addEventListener 委派給內部的 WebSocketFactory 實例
    this._ws.addEventListener(cmd, callback);

    // 原始程式碼會將回呼存儲到 this._cbOnopenList[0] 等，這會覆蓋之前的。
    // 為了保持這個「只存一個」的邏輯，但又兼容 `forEach`，我們將它存為陣列的第一個元素。
    switch (cmd) {
        case 'open':
            this._cbOnopenList[0] = callback;
            break;
        case 'message':
            this._cbOnmessageList[0] = callback;
            break;
        case 'error':
            this._cbOnerrorList[0] = callback;
            break;
        case 'close':
            this._cbOncloseList[0] = callback;
            break;
        default:
            console.error('addEventListener 參數錯誤');
            break;
    }
};

// reconnecting 方法
MyWebSocket.prototype.reconnecting = function() {
    var self = this;
    self._ws.reconnect(); // 呼叫 WebSocketFactory 的 reconnect 方法

    // 重新設定主要回呼 (確保在 reconnect 後仍然有效)
    self.onopen = self._cbOnopenMain;
    self.onmessage = self._cbOnmessageMain;
    self.onerror = self._cbOnerrorMain;
    self.onclose = self._cbOncloseMain;

    // 重新綁定 addEventListener 的回呼
    // 這裡 foreach 迴圈在舊版瀏覽器需要 polyfill，或改用 for 迴圈
    // 為了兼容性，建議改為 for 迴圈
    var i;
    for (i = 0; i < self._cbOnopenList.length; i++) {
        self.addEventListener('open', self._cbOnopenList[i]);
    }
    for (i = 0; i < self._cbOnmessageList.length; i++) {
        self.addEventListener('message', self._cbOnmessageList[i]);
    }
    for (i = 0; i < self._cbOnerrorList.length; i++) {
        self.addEventListener('error', self._cbOnerrorList[i]);
    }
    for (i = 0; i < self._cbOncloseList.length; i++) {
        self.addEventListener('close', self._cbOncloseList[i]);
    }
};

// send 方法
MyWebSocket.prototype.send = function(data) {
    // 這裡直接呼叫內層的 WebSocketFactory 的 send 方法
    return this._ws.send(data);
};

// close 方法
MyWebSocket.prototype.close = function() {
    // 這裡直接呼叫內層的 WebSocketFactory 的 close 方法
    this._ws.close();
};

// 暴露 MyWebSocket 到 window 物件，以便外部呼叫
window.MyWebSocketLow = MyWebSocket;