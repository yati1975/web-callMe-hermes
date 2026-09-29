(function (window) {

    class WSHandlers{
        constructor (options) {

            options = options || {};
            this.id = options.id;
            this.store = options.store;
            this.commands = options.commands || null;

            if (!this.store) {
                throw new Error('WSHandlers requires a store');
            }
        }
        handleMessage(packet) {
            console.log(packet);
            //這裏沒有切csv跟json.
            this.store.set('ws.lastPacket', packet.payload);    
            switch(packet.type){
                case "login":
                    this.handleLogin(packet.payload);
                    break;
                case "send":
                    this.handleCallNumber(packet.payload);
                    break;
                case "update":
                    this.handleCallNumber(packet.payload); 
                    break;   
                case "get":
                    this.handleLastGetNumber(packet.payload);
                    break;
                case "get_num_info":
                    this.handleGetNumberInfo(packet.payload);
                    break;
                case "get_num_status":
                    this.handleGetNumberStatus(packet.payload);
                    break;
                case "get_num_switch":
                    this.handleGetNumberSwitch(packet.payload);
                    break;
                case "user_get_num":
                    this.handleUserGetNumber(packet.payload); 
                    break;
                case "set_time_period":
                    this.handleSetTimePeriod(packet.payload);
                    break;
                case "set_params":
                    this.handleSetParams(packet.payload);
                    break;
                case "web_cancel_get_num":
                    this.handleWebCancelGetNumber(packet.payload);
                    break;
                case "remove_number":
                    this.handleRemoveNumber(packet.payload);
                    break;
                case "new_get_num":
                    this.handleNewGetNumber(packet.payload);
                    break;
                case "cancel_get_num":
                    this.handleCancelGetNumber(packet.payload);
                    break;
                case "reserve_number":
                    this.handleReserveNumber(packet.payload);
                    break;

                //預約資料.    
                case "booking_data":
                    this.handleBookingData(packet.payload);
                    break;  
                //叫號機(實體機 wifi設定).    
                case "wifi_get_status":
                    this.handleWifiGetStatus(packet.payload);
                    break;
                case "wifi_scan_list":
                    this.handleWifiScanList(packet.payload);
                    break;  
                case "wifi_get_profiles":
                    this.handleWifiGetProfiles(packet.payload);
                    break;
                case "wifi_add_profile":
                    this.handleWifiAddProfile(packet.payload);
                    break;
                case "wifi_delete_profile":
                    this.handleWifiDeleteProfile(packet.payload);
                    break;

                //web reset caller.    
                case "web_reset_caller":
                    this.handleWebResetCaller(packet.payload);
                    break;    

            }
        }
        handleLogin(data){
            if (data.result === "OK") {
                let storename=data.caller_name;
                let callername=null;
                if(data.caller_name.indexOf(';;') !== -1){
                    let str2=data.caller_name.split(';;');
                    storename = str2[0];
                    callername = str2[1];
                } 
                //let callMeDef = getConfig(data.caller_id);
                let callMeDef = null;
                this.store.patch({
                    auth: {
                        status: "success",
                        user: data.user || null
                    },
                    user: {
                        callerID: data.caller_id,
                        agentName: data.caller_name,
                    },
                    title: {
                        storename: storename,
                        callername: callername
                    },
                    queue:{
                        curr_num: data.curr_num,                    // 目前號碼
                        last_get_num: data.last_get_num,            // 最後取號 (若不支援取號服務，此欄為"")
                        get_num_item_type: data.get_num_item_type,   // 取號項目型別 (若不支援"選擇取號項目", 此欄為"")
                        get_num_item_data: data.get_num_item_data, 	//(取號項目號碼資料)(用來取代 get_num_item_queue)
                        get_num_item_names: data.get_num_item_names,// 取號項目名稱
                        get_num_item_queue: data.get_num_item_queue,// 取號項目號碼佇列
                        get_num_notes: data.get_num_notes,          // 取號需知 (若不顯示取號需知，此欄設為"")(若不支援取號服務，此欄為"")
                        item_call_num: data.item_call_num           // 各項目當前叫號 (若不支援"分段取號"，此欄為"")
                    },
                    total_count:{
                        total_call_num: data.total_call_num,       // 取號總數 (若不支援取號服務，此欄為"") //new.
                        total_get_num: data.total_get_num         // 叫號總數 (若不支援取號服務，此欄為"") //new.  
                    },                
                    config: {
                        hardware: data.hardware,				// 有無實體取號機 (true/fasle).
                        support_get_num: data.support_get_num,      // 支援取號 (true/false)
                        get_num_switch: data.get_num_switch,       // 取號開關 ("on"/"off") (若不支援取號服務，此欄為"")
                        support_reserve_num: data.support_reserve_num,  // 支援到號保留 (true/false)(若不支援取號服務，此欄為false)
                        reserve_time_limit: data.reserve_time_limit, 	// (到號保留期限)
                        reserve_time_limit_c: data.reserve_time_limit_c, 	// 確認保留時間(分鐘)(reserved 狀態)(若不支援"確認保留"，此欄為"") new.
                        reset_time:data.reset_time,			// (重置時間)
                        support_set_params:data.support_set_params,	// 支援參數設定 ({}詳見備註2)(若不支援任何參數設定，此欄為"")
                        curr_time_period: data.curr_time_period,		// 目前時段 (若不支援設定時段，此欄為"")
                        time_period_items: data.time_period_items,	// 時段項目 (若不支援設定時段，此欄為"")
                        caller_num_limit: data.caller_num_limit,     // 叫號機號碼上限(999 或 9999 ...)
                        num_prefix: data.num_prefix,           // 號碼字首 (若不支援，此欄為"") num_prefix & perfix_alias 要一起參照...
                        prefix_alias: data.prefix_alias,         // 字首別名 (若不支援，此欄為"") num_prefix & perfix_alias 要一起參照...
                        scan_qr_code_check: data.scan_qr_code_check,   // (true/false) 掃描 QR-Code 時，是否需檢查 sign
                        web_get_num_check: data.web_get_num_check   // (true/false) 網頁取號，是否需檢查 sign
                    },
                    page:{
                        callMeDef: callMeDef
                    }
                });
                if((data.get_num_item_names) && (data.get_num_item_names !== "")){
                    this.store.initItemGroup(data.get_num_item_names,data.get_num_item_data);
                }
                //todo:測試用.

                
                //console.log('wshandler.js handlelogin');
            } else {
                this.store.commit("auth/error", data);
            }
        }
        handleCallNumber(data){
            let num = Number(data[2]);

            if(num === 0){
                console.log('handleCallNumber',data[2]);
                let status = this.store.get('reset.status');

                this.store.patch({
                    queue:{
                        curr_num: 0,
                        last_get_num: 0
                    },
                    data:{
                        itemGroup:[],
                        sectionCount:[],
                        countWait:0
                    }
                });
                let item_names = this.store.get('queue.get_num_item_names');
                let item_call_num = this.store.get('queue.item_call_num');
                if((item_names) && (item_names !== "")){
                    // let count=[];
                    // for(let i=0, len = item_names.length; i<len; i++){
                    //     count.push(0);
                    // }
                    // this.store.patchPath('data.sectionCount',count);
                    this.store.resetData();
                    if((item_call_num) && (item_call_num !== "")){
                        let newitems=[];
                        for(let i=0, len = item_names.length; i<len; i++){
                            newitems.push(0);
                        }
                        this.store.patchPath('queue.item_call_num',newitems);
                    }
                }
                if(status === 'loading') {
                    this.store.commit('reset/success');
                }       
                if(this.commands){
                    setTimeout(() => {
                        this.commands.getNumInfo();
                    }, 300);
                }  
            }else{
                let support_reserve_num = this.store.get('config.support_reserve_num');
                let type = this.store.get('queue.get_num_item_type');
                if((type) && (type !== "")){
                    this.store.callingNumItem(num);
                    if(support_reserve_num === false){
                        if(this.commands){
                            setTimeout(() => {
                                this.commands.removeNumber(num);
                            }, 300);
                        }
                    }
                }
                
                this.store.set('queue.curr_num',num);
            }
            //todo: 待補完功能.
            //叫號若為分組, 且無保留功能.
            //則接著送出remove_num
            //叫號若為分組, 且具有保留功能, 則需進行分組資料處理...轉成叫號
            //若收到update(0).則之reset功能...
        }
        handleLastGetNumber(data){
            this.store.patch({
                queue:{
                    last_get_num: Number(data[2])
                }
            });        
        }
        handleGetNumberInfo(data){
            if (data.result === "OK") {
                this.store.patch({
                    queue:{
                        curr_num: data.call_num,                    // 目前號碼, 跟login那裏命名不一致.
                        last_get_num: data.curr_num,                // 最後取號, 跟login那裏命名不一致.
                        get_num_item_type:data.get_num_item_type,   // 取號項目型別 (若不支援"選擇取號項目", 此欄為"")
                        get_num_item_data: data.get_num_item_data, 	//(取號項目號碼資料)(用來取代 get_num_item_queue)
                        get_num_item_names: data.get_num_item_names,// 取號項目名稱
                        get_num_item_queue: data.get_num_item_queue,// 取號項目號碼佇列
                        get_num_notes: data.get_num_notes,          // 取號需知 (若不顯示取號需知，此欄設為"")(若不支援取號服務，此欄為"")
                        item_call_num: data.item_call_num           // 各項目當前叫號 (若不支援"分段取號"，此欄為"")
                    },
                    total_count:{
                        total_call_num: data.total_call_num,       // 取號總數 (若不支援取號服務，此欄為"") //new.
                        total_get_num: data.total_get_num         // 叫號總數 (若不支援取號服務，此欄為"") //new.  
                    },                
                    config: {
                        hardware: data.hardware,				// 有無實體取號機 (true/fasle).
                        support_get_num: data.support_get_num,      // 支援取號 (true/false)
                        get_num_switch: data.get_num_switch,       // 取號開關 ("on"/"off") (若不支援取號服務，此欄為"")
                        support_reserve_num: data.support_reserve_num,  // 支援到號保留 (true/false)(若不支援取號服務，此欄為false)
                        reserve_time_limit: data.reserve_time_limit, 	// (到號保留期限)
                        reserve_time_limit_c: data.reserve_time_limit_c, // 確認保留時間(分鐘)(reserved 狀態)(若不支援"確認保留"，此欄為"") new.
                        reset_time:data.reset_time,			// (重置時間)
                        support_set_params:data.support_set_params,	// 支援參數設定 ({}詳見備註2)(若不支援任何參數設定，此欄為"")
                        curr_time_period: data.curr_time_period,		// 目前時段 (若不支援設定時段，此欄為"")
                        time_period_items: data.time_period_items,	// 時段項目 (若不支援設定時段，此欄為"")
                        caller_num_limit: data.caller_num_limit,     // 叫號機號碼上限(999 或 9999 ...)
                        num_prefix: data.num_prefix,           // 號碼字首 (若不支援，此欄為"") num_prefix & perfix_alias 要一起參照...
                        prefix_alias: data.prefix_alias,         // 字首別名 (若不支援，此欄為"") num_prefix & perfix_alias 要一起參照...
                        scan_qr_code_check: data.scan_qr_code_check,   // (true/false) 掃描 QR-Code 時，是否需檢查 sign
                        web_get_num_check: data.web_get_num_check   // (true/false) 網頁取號，是否需檢查 sign

                    }                
                });
                if((data.get_num_item_names) && (data.get_num_item_names !== "")){
                    this.store.initItemGroup(data.get_num_item_names,data.get_num_item_data);
                }
            } else {
                //this.store.commit("auth/error");
                console.warn(data.result);
            }
        }
        handleGetNumberStatus(data){
            this.store.patch({
                config:{
                    get_num_switch: data.switch 
                }
            });  
        }
        handleGetNumberSwitch(data){
            this.store.patch({
                config:{
                    get_num_switch: data.switch 
                }
            });  
        }
        handleUserGetNumber(data){
            console.log('web取號.');
            //需拆解, 待修.
            const old = this.store.get('user_get_num');
            if (JSON.stringify(old) === JSON.stringify(data)) {
                return;
            }
            
            const currPeriod = this.store.get('config.curr_time_period');
            const scheduleWeek = this.store.get('config.support_set_params')?.schedule_week;

            let isCurrent = true;

            if ((data.date && !isToday(data.date)) ||
                (data.time_period && data.time_period !== currPeriod) ||
                !data.get_num) {
                isCurrent = false;
            }     
            if((isCurrent === true) && (data.result==="OK")){
                this.store.patch({
                    queue:{
                        last_get_num : data.get_num
                    }
                });
                if((data.get_num_item_id !== null)  && (data.get_num_item_id !== "")){
                    this.store.addItemGroup(data);
                }
            }
            if (isCurrent || scheduleWeek || data.result !=='OK') {
                this.store.set('user_get_num', data);
            }

        }
        handleWebCancelGetNumber(data){
            console.log('web取消取號.');
            const old = this.store.get('cancel_get_num');
            if (JSON.stringify(old) !== JSON.stringify(data)) {
                if(data.result==="OK"){
                    const currPeriod = this.store.get('config.curr_time_period');
                    const scheduleWeek = this.store.get('config.support_set_params')?.schedule_week;
                    if(!data.cancel_num){
                        return;
                    }
                    let isCurrent = true;
                    if ((data.date && !isToday(data.date)) ||
                        (data.time_period && data.time_period !== currPeriod) ||
                        !data.cancel_num) {
                        isCurrent = false;
                    }      
                    if(isCurrent === true) {
                        let bremove = this.store.cancelItemGroup(Number(data.cancel_num));
                        if(bremove === true){
                            if(this.commands){
                                setTimeout(() => {
                                    this.commands.removeNumber(Number(data.cancel_num));
                                }, 300);  
                            }
                        }
                    }
                    if (isCurrent || scheduleWeek) {
                        this.store.set('cancel_get_num', data);
                    }
                }
            }    
            //這裏需要加入判斷.若是取消號在分組情況下且尚未被叫號, 則需要送remove
        } 
        handleCancelGetNumber(data){
            console.log('line取消取號.');
            //需拆解, 待修.
    
            const old = this.store.get('cancel_get_num');
            if (JSON.stringify(old) !== JSON.stringify(data)) {
                //if(data.result==="OK"){
                    const currPeriod = this.store.get('config.curr_time_period');
                    const scheduleWeek = this.store.get('config.support_set_params')?.schedule_week;
                    if(!data.cancel_num){
                        return;
                    }
                    let isCurrent = true;
                    if ((data.date && !isToday(data.date)) ||
                        (data.time_period && data.time_period !== currPeriod) ||
                        !data.cancel_num) {
                        isCurrent = false;
                    }              
                    if(isCurrent){
                        let bremove = this.store.cancelItemGroup(Number(data.cancel_num));
                        if(bremove === true){
                            if(this.commands){
                                setTimeout(() => {
                                    this.commands.removeNumber(Number(data.cancel_num));
                                }, 300);  
                            }
                        }
                    }
                    if (isCurrent || scheduleWeek) {
                        this.store.set('cancel_get_num', data);
                    }
                //}
            }           
                
            //這裏需要加入判斷.若是取消號在分組情況下且尚未被叫號, 則需要送remove
        }     
        handleRemoveNumber(data){
            console.log('移除號碼.');
            const old = this.store.get('remove_num');

            if (JSON.stringify(old) !== JSON.stringify(data)) {
                if(data.result==="OK"){
                    const currPeriod = this.store.get('config.curr_time_period');
                    const scheduleWeek = this.store.get('config.support_set_params')?.schedule_week;
                    if(!data.remove_num){
                        return;
                    }
                    let isCurrent = true;
                    if ((data.date && !isToday(data.date)) ||
                        (data.time_period && data.time_period !== currPeriod) ||
                        !data.remove_num) {
                        isCurrent = false;
                    }
                    if(isCurrent === true){
                        this.store.removeItemGroup(data.remove_num);
                    }
                    if (isCurrent || scheduleWeek) {
                        this.store.set('remove_num', data);
                    }
                }
            }           
        }
        handleReserveNumber(data){
            console.log('到號保留.');
            //需拆解, 待修.
            const old = this.store.get('reserve_num');

            if (JSON.stringify(old) !== JSON.stringify(data)) {
                const currPeriod = this.store.get('config.curr_time_period');
                const scheduleWeek = this.store.get('config.support_set_params')?.schedule_week;
                if(!data.number){
                    return;
                }
                let isCurrent = true;
                if ((data.date && !isToday(data.date)) ||
                    (data.time_period && data.time_period !== currPeriod) ||
                    !data.number) {
                    isCurrent = false;
                }  
                if(isCurrent){            
                    this.store.reserveItemGroup(data);
                }
                if (isCurrent || scheduleWeek) {
                    this.store.set('reserve_num', data);
                }
            }else{
                return;
            }        
        }    
        handleNewGetNumber(data){
            console.log('line取號.');
            const old = this.store.get('new_get_num');
            if (JSON.stringify(old) === JSON.stringify(data)) {
                return;
            }
            const scheduleWeek = this.store.get('config.support_set_params')?.schedule_week;
            const currPeriod = this.store.get('config.curr_time_period');
            if(!data.curr_num){
                return;
            }
            let isCurrent = true;
            if ((data.date && !isToday(data.date)) ||
                (data.time_period && data.time_period !== currPeriod) ||
                !data.curr_num) {
                isCurrent = false;
            }              
            if(isCurrent === true){
                if((data.get_num_item_id !== null)  && (data.get_num_item_id !== "")){
                    this.store.addItemGroup(data);
                }
                this.store.patch({
                    queue:{
                        last_get_num : Number(data.curr_num)
                    }
                });    
            }
            if (isCurrent || scheduleWeek) {
                // 只要 isCurrent 為 true，或者 scheduleWeek 有內容（非空、非 null），就會執行
                this.store.set('new_get_num', data);
            }
            
        }  
            
        handleSetTimePeriod(data){
            if(data.result === "OK"){
                this.store.patch({
                    config:{
                        curr_time_period: data.time_period
                    }
                });     
            }else{
                console.warn(data.result);
            }
        }
        handleSetParams(data){

            if(data.result === "OK"){
                this.store.patch({
                    config:{
                        support_set_params: data.params
                    }
                }); 
                const reservetimelimit = data?.params?.reserve_time_limit;
                const reservetimelimitc = data?.params?.reserve_time_limit_c;

                if(reservetimelimit !== undefined && reservetimelimit !== null && reservetimelimit !==""){
                    this.store.patch({
                        config:{
                            reserve_time_limit: reservetimelimit
                        }
                    });             
                }  
                if(reservetimelimitc !== undefined && reservetimelimitc !== null && reservetimelimitc !==""){
                    this.store.patch({
                        config:{
                            reserve_time_limit_c: reservetimelimitc
                        }
                    });             
                }          
            }else{
                console.warn(data.result);
            }
        }   
        handleBookingData(data){
            if(data.result === 'OK'){
                this.store.commit('booking_data/success');
                this.store.patch({
                    booking_data:{
                        data: data.booking_data
                    }
                });          
            }else{
                this.store.commit('booking_data/error',data);
            }
        }
        

        handleWifiGetStatus(data){
            if(data.result === "OK"){
                let obj = this.store.get('wifi.status');
                console.warn(obj);
                this.store.commit('wifi/success');
                this.store.patchPath('wifi.status',{
                    current_ssid: data.data.current_ssid,
                    password:data.data.password,
                    wifi_connected:data.data.wifi_connected,
                    rssi:data.data.rssi                    
                });   
                console.warn(this.store.get('wifi.status'));
            }else{
            this.store.commit('wifi/error',data);  
            }
        }
        handleWifiScanList(data){
            if(data.result === "OK"){
                this.store.commit('wifi/success');
                this.store.patch({
                    wifi:{
                        networks: data.data.networks
                    }
                });   
            }else{
            this.store.commit('wifi/error',data);  
            }
        }
        handleWifiGetProfiles(data){
            if(data.result === "OK"){
                this.store.commit('wifi/success');
                this.store.patch({
                    wifi:{
                        credentials: data.data.credentials
                    }
                });   
            }else{
                this.store.commit('wifi/error',data);  
            }    
        }
        handleWifiAddProfile(data){
            if(data.result === "OK"){
                this.store.commit('wifi/success');
            }else{
                this.store.commit('wifi/error',data);  
            }    
        }
        handleWifiDeleteProfile(data){
            //console.log("wifi delete profile:",data);
            if(data.result === "OK"){
                this.store.commit('wifi/success');
                if(this.commands){
                    this.commands.getWifiGetProfiles();
                }
            }else{
                this.store.commit('wifi/error',data);  
            }          
        }
        handleWebResetCaller(data){
            if(data.result !== 'OK'){
                this.store.commit('reset/error');
            }
        }        
    }

    window.App = window.App || {};

    window.App.WSHandlers = WSHandlers;

})(window);
