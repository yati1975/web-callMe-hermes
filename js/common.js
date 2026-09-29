function todayYYYYMMDD() {
    const d = new Date();
    return (
        d.getFullYear() * 10000 +
        (d.getMonth() + 1) * 100 +
        d.getDate()
    );
}
function isToday(d){
  const target = Number(d);
  const today = todayYYYYMMDD();

  if (target === today) return true;
  return false;
}
const isEmpty = (obj) => Object.keys(obj).length === 0;

function prefixNumberString(num, numLimit, prefixMap, prefixFlag,padZero=true){
    let numString = "";
    let numlen = checkNumberLength(numLimit);
    // console.log('prefixNumberString:', num);
    if(num !== null){
        if(padZero===false){
            numString = num.toString();
        }else{
            if(numlen >= 4){
                numString = String(num).padStart(numlen, '0');
            }else{
                numString = String(num).padStart(3, '0');
            }
        }
        if(prefixFlag === true){
            let key = prefixMap[numString[0]];
            if(key){
                numString= key + numString.substring(1); 
            }
        }
    }
    
    // console.log(numString);
    return numString;
}
function parsePrefixNumberString(numString, prefixMap, prefixFlag){
    let str0 = numString[0];
    let newStr = null;
    if(prefixFlag === true){
        for(const key in prefixMap){
            if(prefixMap[key]=== str0){
                newStr= key + numString.substring(1); 
                break;
            }
        }
    }
    // console.log(numString, prefixMap, prefixFlag);
    // console.log(newStr);
    if(newStr === null){
        newStr = numString;
    }
    return Number(newStr);
}

function checkNumberLength(num){
    if(num===undefined || num === null){
        return 3;
    }
    let str = num.toString();
    //console.log(str, str.length);
    return str.length;
}


/**
 * 用 POLICY 算出：
 * - expiryMs：要塞進 expiry_time 的時間戳
 * - nextRefreshMs：倒數要倒到的下一次 dailyRefresh（例如 19:00）
 *
 * 規則（你描述的 v0120）：
 * dailyRefresh=19:00, TTL=1740分鐘
 * - 若現在 < 19:00：視為「昨天19:00那一輪」=> expiry 到今天 23:59:59
 * - 若現在 >= 19:00：視為「今天19:00那一輪」=> expiry 到明天 23:59:59
 */
function computePolicyTimes(now, policy) {
    // === 沒 POLICY → fallback 舊行為（今天 23:59:59）
    if (!policy) {
        const endToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23, 59, 59, 999
        ).getTime();

        return {
        expiryMs: null,
        nextRefreshMs: null
        };
    }

    const TTLmin = Number(policy.TTL || 0);
    const TTLms = Math.max(0, TTLmin) * 60 * 1000-1000;

    // === 1️⃣ dailyRefresh 模式（例如 v0120 / 展覽）
    if (policy.dailyRefresh) {
        const m = /^(\d{1,2}):(\d{2})$/.exec(policy.dailyRefresh);
        if (!m) {
        console.warn("⚠️ dailyRefresh 格式錯誤，改用 interval 模式");
        } else {
        const h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);

        const todayRefresh = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            h, min, 0, 0
        );

        const isAfter = now >= todayRefresh;

        const serviceStart = isAfter
            ? todayRefresh
            : new Date(todayRefresh.getTime() - 86400000);

        const expiryMs = serviceStart.getTime() + TTLms;

        const nextRefreshMs = isAfter
            ? new Date(todayRefresh.getTime() + 86400000).getTime()
            : todayRefresh.getTime();

        return { expiryMs, nextRefreshMs };
        }
    }

    // === 2️⃣ refreshInterval 模式（吃的、快速流動）
    const intervalMin = Number(policy.refreshInterval || 0);

    if (intervalMin > 0) {
        const intervalMs = intervalMin * 60 * 1000;

        const nowMs = now.getTime();
        const nextRefreshMs = nowMs + intervalMs;
        const expiryMs = nowMs + TTLms;

        return {
        expiryMs,
        nextRefreshMs
        };
    }

    // === 3️⃣ 都沒設定 → fallback
    const endToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23, 59, 59, 999
    ).getTime();

    return {
        expiryMs: endToday,
        nextRefreshMs: endToday
    };
}