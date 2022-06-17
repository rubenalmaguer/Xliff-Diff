function getRichDiff(oldText, newText, unit) {
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


    // Generate diff object
    let diff = patienceDiff(oldText, newText);


    // Define formatting
    const addition = SpreadsheetApp.newTextStyle()
                      .setBold(true)
                      .setForegroundColor('dodgerblue')
                      .setUnderline(true)
                      .setStrikethrough(false)
                      .build();
    const deletion = SpreadsheetApp.newTextStyle()
                      .setBold(true)
                      .setForegroundColor('indianred')
                      .setUnderline(false)
                      .setStrikethrough(true)
                      .build();
    const identical = SpreadsheetApp.newTextStyle()
                      .setBold(false)
                      .setForegroundColor('black')
                      .setUnderline(false)
                      .setStrikethrough(false)
                      .build();

    // Loop through 'lines' (actually, words/chars) to concatenate final string AND build array of arrays holding the style of each 'run'
    let finalText = '';
    let styleRuns = [];

    diff.lines.forEach(o => {
      const isAddition = (o.aIndex < 0);
      const isDeletion = (o.bIndex < 0);

      /* if (unit == 'word') */ o.line = o.line.replaceAll('«space»', ' '); /* Recover spaces */

      if (isAddition) {
        if (o.line == "\n") {o.line = "\n[↵]"} /*Show added line breaks*/
        if (o.line != '') styleRuns = [...styleRuns, [finalText.length, (finalText.length + o.line.length), addition]];

      } else if (isDeletion) {
        if (o.line == "\n") {o.line = "[↵]"} /*Show removed lines breaks*/
        if (o.line != '') styleRuns = [...styleRuns, [finalText.length, (finalText.length + o.line.length), deletion]];

      } else /* isIdentical */ {
        if (o.line != '') styleRuns = [...styleRuns, [finalText.length, (finalText.length + o.line.length), identical]];
                    
      }

      finalText += o.line;

    });

    // Initialize Rich Text
    let richText = SpreadsheetApp.newRichTextValue();
    
    // Build Rich Text
    richText.setText(finalText);

    [...styleRuns].forEach(run => {
      richText.setTextStyle(run[0], run[1], run[2])
    });

    return richText.build()

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
