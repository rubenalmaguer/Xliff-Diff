function getDiff(oldText, newText, unit) {
    let fragment = document.createDocumentFragment();
  
    /* Make array of words (' ') or characters ('') */
    oldText = oldText
              .replaceAll(' ', ' «space» ')
              .replaceAll('\n', ' \n ')
              .replace(/([^\w«»])/g, ' $1 ')
              .split(" ")
              .filter(x => x);

    newText = newText
              .replaceAll(' ', ' «space» ')
              .replaceAll('\n', ' \n ')
              .replace(/([^\w«»])/g, ' $1 ')
              .split(" ")
              .filter(x => x);
  
    /*Generate diff object*/
    let diff = patienceDiff(oldText, newText);
  
    /* In this case, the 'lines' property refers to words or characters */
    diff.lines.forEach((o) => {
    var color = "";
    var bg = "";
    var deco = "";
  
    /*Format*/
    /* if (o.line == '▶' || o.line == '◀') { color = 'purple' } */ //FIX: Only works when unit = 'char' (i.e. not ▶word◀)
  
    if (o.aIndex < 0) {
        /*INSERTION*/
        bg = '#e3fff6';
        color = 'dodgerblue';
        deco = 'underline';
        /*Show added line breaks*/
        if (o.line == "\n") {o.line = "\n[↵]"}  
  
    } else if (o.bIndex < 0) {
        /*DELETION*/
        bg = '#ffe8e6';
        color = '#cf0000';
        deco = 'line-through';
        /*Show removed lines breaks*/
        if (o.line == "\n") {o.line = "[↵]"}  
    } 
  
    span = document.createElement('span');
    span.style.backgroundColor = bg;
    span.style.color = color;
    span.style.textDecoration = deco;
    /* if (unit == 'word') */ o.line = o.line.replaceAll('«space»', ' ');
    span.appendChild(document.createTextNode(o.line));
    if (o.line == '[↵]\n' || o.line == '\n') span.appendChild(document.createElement('br')); /*Show ALL line breaks*/
    fragment.appendChild(span);
    });
  
    return fragment;
  }
  
  
  
  
  
  
  function patienceDiff(aLines, bLines, diffPlusFlag) {
    /*https://github.com/jonTrent/PatienceDiff/blob/dev/PatienceDiff.js*/
        function findUnique(arr, lo, hi) {
        
        var lineMap = new Map();
        
        for (let i = lo; i <= hi; i++) {
            let line = arr[i];
            if (lineMap.has(line)) {
            lineMap.get(line).count++;
            lineMap.get(line).index = i;
            } else {
            lineMap.set(line, {count:1, index: i});
            }  
        }
        
        lineMap.forEach((val, key, map) => {
            if (val.count !== 1) {
            map.delete(key);
            } else {
            map.set(key, val.index);
            }
        });
        
        return lineMap;
        }
    
        function uniqueCommon(aArray, aLo, aHi, bArray, bLo, bHi) {
        let ma = findUnique(aArray, aLo, aHi);
        let mb = findUnique(bArray, bLo, bHi);
        
        ma.forEach((val, key, map) => {
            if (mb.has(key)) {
            map.set(key, {indexA: val, indexB: mb.get(key)});
            } else {
            map.delete(key);
            }
        });
        
        return ma;
        }
    
        function longestCommonSubsequence(abMap) {
        
        var ja = [];
        
        abMap.forEach((val, key, map) => {
            let i = 0;
            while (ja[i] && ja[i][ja[i].length-1].indexB < val.indexB) {
            i++;
            }
            
            if (!ja[i]) {
            ja[i] = [];
            }
    
            if (0 < i) {
            val.prev = ja[i-1][ja[i-1].length - 1];
            }
    
            ja[i].push(val);
        });
        
        var lcs = [];
        if (0 < ja.length) {
            let n = ja.length - 1;
            var lcs = [ja[n][ja[n].length - 1]];
            while (lcs[lcs.length - 1].prev) {
            lcs.push(lcs[lcs.length - 1].prev);
            }
        }
        
        return lcs.reverse();
        }
        let result = [];
        let deleted = 0;
        let inserted = 0;	
        let aMove = [];
        let aMoveIndex = [];
        let bMove = [];
        let bMoveIndex = [];
        
        function addToResult(aIndex, bIndex) {
        
        if (bIndex < 0) {
            aMove.push(aLines[aIndex]);
            aMoveIndex.push(result.length);
            deleted++;
        } else if (aIndex < 0) {
            bMove.push(bLines[bIndex]);
            bMoveIndex.push(result.length);
            inserted++;
        }
    
        result.push({line: 0 <= aIndex ? aLines[aIndex] : bLines[bIndex], aIndex: aIndex, bIndex: bIndex});
        }
        
        function addSubMatch(aLo, aHi, bLo, bHi) {
        
        while (aLo <= aHi && bLo <= bHi && aLines[aLo] === bLines[bLo]) {
            addToResult(aLo++, bLo++);
        }
    
        let aHiTemp = aHi;
        while (aLo <= aHi && bLo <= bHi && aLines[aHi] === bLines[bHi]) {
            aHi--;
            bHi--;
        }
        
        let uniqueCommonMap = uniqueCommon(aLines, aLo, aHi, bLines, bLo, bHi);
        if (uniqueCommonMap.size === 0) {
            while (aLo <= aHi) {
            addToResult(aLo++, -1);
            }
            while (bLo <= bHi) {
            addToResult(-1, bLo++);
            }    
        } else {
            recurseLCS(aLo, aHi, bLo, bHi, uniqueCommonMap);
        }
        
        while (aHi < aHiTemp) {
            addToResult(++aHi, ++bHi);
        } 
        }
    
        function recurseLCS(aLo, aHi, bLo, bHi, uniqueCommonMap) {
        var x = longestCommonSubsequence(uniqueCommonMap || uniqueCommon(aLines, aLo, aHi, bLines, bLo, bHi));
        if (x.length === 0) {
            addSubMatch(aLo, aHi, bLo, bHi);
        } else {
            if (aLo < x[0].indexA || bLo < x[0].indexB) {
            addSubMatch(aLo, x[0].indexA-1, bLo, x[0].indexB-1);
            }
    
            let i;
            for (i = 0; i < x.length - 1; i++) {
            addSubMatch(x[i].indexA, x[i+1].indexA-1, x[i].indexB, x[i+1].indexB-1);
            }
            
            if (x[i].indexA <= aHi || x[i].indexB <= bHi) {
            addSubMatch(x[i].indexA, aHi, x[i].indexB, bHi);
            }
        }
        }
        
        recurseLCS(0, aLines.length-1, 0, bLines.length-1);
        
        if (diffPlusFlag) {
        return {lines: result, lineCountDeleted: deleted, lineCountInserted: inserted, lineCountMoved: 0, aMove: aMove, aMoveIndex: aMoveIndex, bMove: bMove, bMoveIndex: bMoveIndex};
        }
        
        return {lines: result, lineCountDeleted: deleted, lineCountInserted: inserted, lineCountMoved:0};
    }