(function (window) {
    const itemStatus={
        NONE: 0,
        NORMAL: 1,
        CLICKED: 2,
        CALLING: 3,
        RESERVED: 4,
        INVALID: 5,
        UNRESERVE: 6,
        REMOVE: 7  
    };
    const initialState = {
        auth: {
            status: 'idle',
            user: null
        },
        env: 'prod',
        ws: {
            reconnected: false,
            connected: false,
            lastPacket: null
        },  
        user: {
            callerID: null, //caller_id.
            agentName: "",  //caller_name.
        }, 
        title: {
            storename: null,
            callername: null
        },            
        queue:{
            curr_num: null,             // 目前號碼
            last_get_num: null,         // 最後取號 (若不支援取號服務，此欄為"")
            get_num_item_type:null,     // 取號項目型別 (若不支援"選擇取號項目", 此欄為"")
            get_num_item_data: null,	//(取號項目號碼資料)(用來取代 get_num_item_queue)
            get_num_item_names: null, 	// 取號項目名稱
            get_num_item_queue: null,   // 取號項目號碼佇列
            get_num_notes: null,        // 取號需知 (若不顯示取號需知，此欄設為"")(若不支援取號服務，此欄為"")
            item_call_num: null         // 各項目當前叫號 (若不支援"分段取號"，此欄為"")
        },
        total_count:{
            total_call_num: null,       // 取號總數 (若不支援取號服務，此欄為"") //new.
            total_get_num: null         // 叫號總數 (若不支援取號服務，此欄為"") //new.  
        },
        reset: {
            status: 'idle'
        },
        user_get_num:{},                //web使用者取號.
        new_get_num:{},                 //line使用者取號.    
        cancel_num: {},                 //取消取號.
        reserve_num: {},                //到號保留.
        remove_num:{},                  //移除號碼.
        booking_data:{
            status: 'idle',
            data:{}                     //預約資料.
        },              
        config: {
            hardware: null,				// 有無實體取號機 (true/fasle).
            support_get_num: null,      // 支援取號 (true/false)
            get_num_switch: null,       // 取號開關 ("on"/"off") (若不支援取號服務，此欄為"")
            support_reserve_num: null,  // 支援到號保留 (true/false)(若不支援取號服務，此欄為false)
            reserve_time_limit: null, 	// (到號保留期限)
            reserve_time_limit_c: null, // 確認保留時間(分鐘)(reserved 狀態)(若不支援"確認保留"，此欄為"") new.
            reset_time:null,			// (重置時間)
            support_set_params:null,	// 支援參數設定 ({}詳見備註2)(若不支援任何參數設定，此欄為"")
            curr_time_period: null,		// 目前時段 (若不支援設定時段，此欄為"")
            time_period_items: null,	// 時段項目 (若不支援設定時段，此欄為"")
            caller_num_limit: null,     // 叫號機號碼上限(999 或 9999 ...)
            num_prefix: null,           // 號碼字首 (若不支援，此欄為"") num_prefix & perfix_alias 要一起參照...
            prefix_alias: null,         // 字首別名 (若不支援，此欄為"") num_prefix & perfix_alias 要一起參照...
            scan_qr_code_check: null,   // (true/false) 掃描 QR-Code 時，是否需檢查 sign
            web_get_num_check: null     // (true/false) 網頁取號，是否需檢查 sign
        },
        wifi:{
            state:{
                status:'idle',
                errorMsg:''
            },
            status:{
                current_ssid:null,
                password:null,
                wifi_connected:null,
                rssi:null
            },
            networks:null,
            credentials:null
        },  
        page:{
            version: "",
            callMeDef: null,
            currentPage:"",
            isOnlineGet:true,
            isMuted: false,
            isMultLang:true
        },
        data:{
            sectionCount:[],
            itemGroup:[],
            countWait:0
        }    
    };    
    function deepMerge(target, source) {

        for (var key in source) {

            if (
                source[key] &&
                typeof source[key] === "object" &&
                !Array.isArray(source[key])
            ) {

                if (!target[key]) {
                    target[key] = {};
                }

                deepMerge(target[key], source[key]);

            } else {
                target[key] = source[key];
            }
        }

        return target;
    }

    function deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    class AppStore {
        constructor (options) {

            options = options || {};

            this.id = options.id || null;

            this.state = deepClone(initialState);

            this.listeners = [];
        }
   
        // 讀取全部 state
        getState  () {
            return deepClone(this.state);
        }
    // 支援 user.callerID 這種路徑
        get (path) {

            var keys = path.split(".");
            var result = this.state;

            for (var i = 0; i < keys.length; i++) {
                if (result == null) return undefined;
                result = result[keys[i]];
            }

            return result;
        }

        // 深層 set
        set  (path, value) {

            var obj = this.state;
            //if(path.indexOf('.')!==-1){
                var keys = path.split(".");
                for (var i = 0; i < keys.length - 1; i++) {

                    if (!obj[keys[i]]) {
                        obj[keys[i]] = {};
                    }

                    obj = obj[keys[i]];
                }

                obj[keys[keys.length - 1]] = value;
            // }else{
            //     obj[path] = value;
            // }

            this.notify();
        }

        // 深層 patch（推薦用這個）
        patch  (obj) {

            deepMerge(this.state, obj);

            this.notify();
        }
        // 清空
        clear  () {
            this.state = {};
            this.notify();
        }   
        subscribe = function (fn) {
            this.listeners.push(fn);
        };
        patchPath (path,obj){

            var target = this.get(path);

            if(!target) return;

            for(var k in obj){
                target[k] = obj[k];
            }

            this.notify();
        }    
        subscribePath (path, callback){

            var self = this;
            var prev = JSON.stringify(self.get(path));

            return this.subscribe(function(){

                var value = self.get(path);
                var next = JSON.stringify(value);

                if(prev === next) return;

                prev = next;

                callback(value);

            });

        }
        unsubscribe (fn) {
            this.listeners = this.listeners.filter(function (listener) {
                return listener !== fn;
            });
        }


        notify  () {
            for (var i = 0; i < this.listeners.length; i++) {
                this.listeners[i](this.state);
            }
        }

        reset () {
            let keepPage = JSON.stringify(this.state.page);
            let keepEnv = JSON.stringify(this.state.env);
            let keepWS = JSON.stringify(this.state.ws);
            this.state = JSON.parse(JSON.stringify(initialState));
            let page = JSON.parse(keepPage);
            this.state.page = page;
            this.state.env = JSON.parse(keepEnv);
            this.state.ws = JSON.parse(keepWS);
            this.notify();
        }

        commit  (type, payload) {

            switch (type) {
                case 'auth/loading':
                    this.state.auth.status = 'loading';
                    this.state.auth.user=null;
                    break;
                case 'auth/success':
                    this.state.auth.status = 'success';
                    this.state.auth.user = payload?.result;
                    break;
                case 'auth/error':
                    this.state.auth.status = 'error';
                    this.state.auth.user = this.parsingResultMessage(payload.result,payload.action);
                    break;
                case 'reset/loading':
                    this.state.reset.status = 'loading';
                    break;                
                case 'reset/success':
                    this.state.reset.status = 'success';
                    break;
                case 'reset/error':
                    this.state.reset.status = 'error';
                    break;
                case 'wifi/loading':
                    this.state.wifi.state.status = 'loading';
                    break;
                case 'wifi/scan':
                    this.state.wifi.state.status = 'scan';
                    break;
                case 'wifi/scan':
                    this.state.wifi.state.status = 'profiles';
                    break;
                case 'wifi/add':
                    this.state.wifi.state.status = 'add';
                    break;
                case 'wifi/delete':
                    this.state.wifi.state.status = 'delete';
                    break;
                case 'wifi/success':
                    this.state.wifi.state.status = 'success';
                    break;
                case 'wifi/error':  
                    this.state.wifi.state.status = 'error';
                    const msg = this.parsingResultMessage(payload.result,payload.action);
                    this.state.wifi.state.errorMsg = msg;
                    console.log('wifi error',msg);
                    break;
                case 'booking_data/loading':
                    this.state.booking_data.status = 'loading';
                    break;                
                case 'booking_data/success':
                    this.state.booking_data.status = 'success';
                    break;
                case 'booking_data/error':
                    this.state.booking_data.status = 'error';
                    break;
            }

            this.notify();
        }
        resetData  (){
            var self = this;
            self.state.data.itemGroup=[];
            self.state.data.sectionCount=[];
            self.state.data.countWait = 0;
            for(let i=0;i<self.state.queue.get_num_item_names.length; i++){
                self.state.data.sectionCount.push(0);
            }
        }
        sortItemGroup(){
            var self = this;
            self.state.data.itemGroup.sort((a,b)=>{
                if(a.sort_status === b.sort_status) {
                    if(a.timestamp> b.timestamp) return 1;
                    if(a.timestamp < b.timestamp) return -1;
                    if(a.timestamp === b.timestamp) {
                        if(a.get_num_time> b.get_num_time) return 1;
                        if(a.get_num_time < b.get_num_time) return -1;
                        if(a.get_num_time === b.get_num_time) {
                            if(a.turn === b.turn){
                                if(a.num > b.num)return 1;
                                if(a.num < b.num)return -1;
                                return 0;
                            }else{
                                if(a.turn > b.turn) return 1;
                                if(a.turn < b.turn) return -1;
                            }
                        }
                    }
                }else {
                    if(a.sort_status > b.sort_status) return -1;
                    if(a.sort_status < b.sort_status) return 1;
                }  
            });
        }
        resetItemGroupRank (){
            var self = this;
            let i = 0;
            self.state.data.itemGroup.forEach((obj)=>{
                if(obj.status === itemStatus.NORMAL){
                    obj.rank = i+1;
                    obj.color = 1;
                    i++;
                }else{
                    obj.rank = null;
                }
            });         
        }
        initItemGroup  (itemName, inData) {
            var self = this;
            let count = 0;
            let countWait = 0;
            self.state.data.sectionCount=[];
            self.state.data.itemGroup=[];
            for (const key in itemName){
                self.state.data.sectionCount.push(0);
            }        
            for (const key in inData ){
                let numItemData = inData[key];
                if((numItemData.state) && (numItemData.state !== "removed")){
                    let obj = {
                        section: null,
                        num: null,
                        color: null,
                        rank: null,
                        status: null,
                        sort_status: null,//用來排序用.
                        for_customer: null,
                        get_from_web: null,
                        get_num_time: null,
                        turn: 0,
                        timestamp: null
                    };
                    obj.section = Number(numItemData.get_num_item_id);
                    obj.num = Number(key);
                    obj.for_customer = numItemData.for_customer;
                    obj.get_from_web = numItemData.get_from_web;
                    obj.get_num_time = numItemData.get_num_time;
                    if(numItemData.state === "waiting"){
                        obj.color = 1;
                        obj.rank = countWait+1;
                    }else{
                        obj.color = 1;
                        obj.rank = null;
                    }
                    if(numItemData.turn !== undefined && numItemData.turn !==""){
                    obj.turn = numItemData.turn;     
                    }
                    obj.status = itemStatus.NORMAL;
                    obj.sort_status = itemStatus.NORMAL;
                    

                    obj.timestamp = null;
                    if((numItemData.called_time) && (numItemData.called_time!="")){
                        obj.timestamp = numItemData.called_time;                            
                    }
                    if((numItemData.state) && (numItemData.state!="")){
                        if(numItemData.state === "waiting"){
                            obj.status = itemStatus.NORMAL;   
                            obj.sort_status = itemStatus.NORMAL;
                            countWait++; 
                            self.state.data.sectionCount[obj.section]++;
                        }else if(numItemData.state === "called"){
                            obj.status = itemStatus.CALLING;
                            obj.sort_status = itemStatus.CALLING;
                            obj.color = 5;
                        }else if(numItemData.state === "reserved"){
                            obj.status = itemStatus.RESERVED;
                            obj.sort_status = itemStatus.CALLING;
                            obj.color = 5;                        
                        }else if(numItemData.state === "cancelled"){
                            obj.status = itemStatus.UNRESERVE;
                            obj.sort_status = itemStatus.UNRESERVE;
                            obj.color = 6;
                        }
                    }
                    //console.log('setNumItemData()'+ obj.num + ' obj.status:'+obj.status);
                    
                    self.state.data.itemGroup.push(obj);
                    count++;
                }
            } 
            self.state.data.countWait = countWait;
            self.sortItemGroup();  
            self.resetItemGroupRank();     
        }
        itemGroupFind (num) {
            let self=this;
            return nowItemObj = self.state.data.itemGroup.find(it => it.num === num);
        }
        itemGroupFindIndex  (num) {
            let self=this;
            return nowItemObj = self.state.data.itemGroup.findIndex(it => it.num === num);
        }   
        modifyItemGroupInvalid  (num) {
            let self=this;
            let obj = self.state.data.itemGroup.find(item => item.num === num);
            if(obj){
                obj.rank = null;
                obj.status = itemStatus.INVALID;
                obj.sort_status = itemStatus.INVALID;
                obj.color = 6;
            }
        }
        modifyItemGroupCount(){
            let self = this;
            let cntQueue=0;
            let countarr=[];
            for(let i=0;i<self.state.data.sectionCount.length; i++){
                countarr.push(0);
            }
            self.state.data.itemGroup.forEach((obj)=>{
                if(obj.status === itemStatus.NORMAL){
                    cntQueue++;
                    countarr[obj.section]++;
                }
            });            
            for(let i=0;i<countarr.length; i++){
                self.state.data.sectionCount[i] = countarr[i];
            }
            self.state.data.countWait = cntQueue;
            console.log('modifyItemGroupCount() countWait:'+cntQueue);
            return cntQueue;
        }
        addItemGroup  (obj) {
            let self = this;
            let addnum = null;
            if((obj.get_num !== null) && (obj.get_num !== "") && (obj.get_num !== undefined)){
                addnum = Number(obj.get_num);
                //console.log('get_num:'+obj.get_num, addnum);
            }else if((obj.curr_num !== null) && (obj.curr_num !== "") && (obj.curr_num !== undefined)){
                addnum = Number(obj.curr_num);
                //console.log('curr_num:'+obj.curr_num, addnum);
            }
            if(addnum === null){
                return;
            }
            
            if(obj.get_num_item_id !== "" && obj.get_num_item_id !== null && obj.get_num_item_id !== undefined){
                let cnt = self.state.data.itemGroup.length;
                let itemobj = {
                    section: Number(obj.get_num_item_id),
                    num: addnum,
                    color: 1,
                    rank: cnt+1,
                    for_customer: obj.for_customer || false,
                    get_from_web: obj.get_from_web || false,
                    get_num_time: obj.get_num_time,
                    turn: 0,
                    status: itemStatus.NORMAL,
                    sort_status: itemStatus.NORMAL,
                    timestamp: null
                };
                if(obj.turn !== null && obj.turn !== ""){
                    itemobj.turn = obj.turn;
                }
                //todo:
                //先檢查號碼是否存在, 若存在, 先移除, 再加入. 2025/12/16變更.
                let popIdx = self.state.data.itemGroup.findIndex(item=>item.num === addnum);
                if(popIdx !== -1){
                    self.state.data.itemGroup.splice(popIdx,1);
                }
                self.state.data.itemGroup.push(itemobj);
                self.sortItemGroup();
                self.resetItemGroupRank(); 
                self.modifyItemGroupCount();
                //console.warn(self.state.data.itemGroup);
            }
        }
        callingNumItem (num) {
            let self = this;
            let itemGroup = self.state.data.itemGroup;
            let support_reserve_num = self.state.config.support_reserve_num;
            if((itemGroup)&&(itemGroup.length>0)){
                let popIdx = itemGroup.findIndex(item => item.num === num);
                if(popIdx!==-1){
                    if(itemGroup[popIdx].timestamp !== "" && itemGroup[popIdx].timestamp !== null){
                        return;
                    }
                    if(support_reserve_num === true){
                        let nowtime = new Date().getTime();
                        itemGroup[popIdx].rank = null;
                        itemGroup[popIdx].status = itemStatus.CALLING;
                        itemGroup[popIdx].sort_status = itemStatus.CALLING;
                        itemGroup[popIdx].timestamp =nowtime;
                        itemGroup[popIdx].color = 5;
                    }else{
                        itemGroup.splice(popIdx,1);
                    }
                    self.sortItemGroup();
                    self.resetItemGroupRank(); 
                    self.modifyItemGroupCount();
                }
            }
        };
        removeItemGroup  (num) {
            let self = this;
            let itemGroup = self.state.data.itemGroup;
            //console.log('removeItemGroup',num);
            //console.log(JSON.stringify(self.state.data.itemGroup));

            if((itemGroup)&&(itemGroup.length>0)){
                let popIdx = itemGroup.findIndex(item => item.num === num);
                if(popIdx!==-1){
                    itemGroup.splice(popIdx,1);
                    self.sortItemGroup();
                    self.resetItemGroupRank(); 
                    self.modifyItemGroupCount();
                }
            }
            //console.warn(self.state.data.itemGroup);
        }
        reserveItemGroup (inData) {
            let self = this;
            let itemGroup = self.state.data.itemGroup;
            let num = Number(inData.number);
            console.log(JSON.stringify(itemGroup));
            if((itemGroup)&&(itemGroup.length>0)){
                let popIdx = itemGroup.findIndex(item => item.num === num);
                console.log("before",num,popIdx,JSON.stringify(itemGroup[popIdx]));
                if(popIdx!==-1){
                    if(itemGroup[popIdx].status === itemStatus.CALLING){
                        // if(inData.reserve === false){
                        //     itemGroup[popIdx].rank = null;
                        //     itemGroup[popIdx].status = itemStatus.UNRESERVE;
                        //     itemGroup[popIdx].color = 6;
                        //     self.sortItemGroup();     
                        //     self.resetItemGroupRank();                
                        // }else{
                        itemGroup[popIdx].rank = null;
                        itemGroup[popIdx].status = itemStatus.RESERVED;
                        itemGroup[popIdx].sort_status = itemStatus.CALLING;
                        itemGroup[popIdx].color = 5;
                        //}    
                    }
                }
                console.log("after",num,popIdx,JSON.stringify(itemGroup[popIdx]));
            }
        }  
        cancelItemGroup (num) {
            let self = this;
            let itemGroup = self.state.data.itemGroup;
            let bRemove =false;

            if((itemGroup)&&(itemGroup.length>0)){
                let popIdx = itemGroup.findIndex(item => item.num === num);
                //console.log('cancelItemGroup:'+popIdx+' num:'+num);
                if(popIdx!==-1){
                    if(itemGroup[popIdx].status === itemStatus.NORMAL){
                        itemGroup.splice(popIdx,1);
                        self.modifyItemGroupCount();
                        bRemove = true;
                    }else if((itemGroup[popIdx].status === itemStatus.CALLING) ||(itemGroup[popIdx].status === itemStatus.RESERVED)){
                        itemGroup[popIdx].rank = null;
                        itemGroup[popIdx].status = itemStatus.UNRESERVE;
                        itemGroup[popIdx].sort_status = itemStatus.UNRESERVE;
                        itemGroup[popIdx].color = 6;
                    }
                    self.sortItemGroup();
                    self.resetItemGroupRank(); 
                }
            }
            return bRemove;
        }
        parsingResultMessage (msg, action) {
            let errorMsg={
                action: action,
                codeNum: "",
                msg: ""
            };
            if(!msg){
                console.warn(msg, action);
                return;
            }        
            let errCode = msg.split(/[,:]/);
            if(errCode[0] ==='Fail'){
                let codeNum = errCode[1].trim();
                errorMsg.codeNum = codeNum;
                errorMsg.msg = errCode[2];
            }
            return errorMsg;
        }
    }
    window.App = window.App || {};
    window.App.AppStore = AppStore;

})(window);