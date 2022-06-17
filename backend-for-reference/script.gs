//Folder/Script URL: https://drive.google.com/drive/u/1/folders/1DSPhBQ_0h-wzBPYMdgzfeg5t70bB71-J

const FOLDER_ID = '156i5IMzoxmIDVmkrsUnVzGnOWZ76aMrO';
const TEMPLATE_ID = '1NdUMLhz3_LcNywo2EqoZEJWobRs_KaWKhhcD7wY8anw';

function doPost(e) {
  let request = e.postData.contents;
  let data = JSON.parse(request);
  let response = main(data); //<-- MAIN returns sheet ID
  return ContentService.createTextOutput(response).setMimeType(ContentService.MimeType.TEXT)
}

function main(data) {
  //Make spreadsheet (workbook)
  let file = makeNewSpreadsheetFromTemplate(TEMPLATE_ID, FOLDER_ID, data.ssName); // Alternatively: makeNewSpreadsheetInFolder(FOLDER_ID/* , ssName */)

  //Open it
  ss = SpreadsheetApp.open(file);
  let s1 = ss.getSheets()[0];

  //Make one sheet per pair of files
  data.fileTuples.forEach((tuple, i) => {
    let sheetName = `Report ${i+1}`
    let newSheet = s1.copyTo(ss).setName(sheetName);

    //Add summary to A1
    let summaryAsRichText = arrayToRichSummary(['File 1:',tuple.srcName, 'File 2:',tuple.srcName, 'Changed segments:', tuple.changeCount]);
    newSheet.getRange('A1').setRichTextValue(summaryAsRichText);

    if (tuple.table.length) {
      //Populate A3:D with data
      let rowOffset = 3;
        newSheet.getRange(`A${rowOffset}:D${tuple.table.length - 1 + rowOffset}`).setValues(tuple.table);

      //Put diff in col E
      let diffColumn = tuple.table.map(row => { return [ getRichDiff(row[2], row[3], 'auto') ] });
      newSheet.getRange(`E${rowOffset}:E${diffColumn.length - 1 + rowOffset}`).setRichTextValues(diffColumn);
    }
  });

  ss.deleteSheet(s1)
  
  return ss.getId();
}




/* 
//////////////////////////////////////////////////
/////////////////////  AUX  //////////////////////
//////////////////////////////////////////////////
 */

function arrayToRichSummary(arr) {
  let value = arr.reduce(
  (previousValue, currentValue, i) => {
    let isCurrentEven = (i % 2)
    if ( i == 0 ) return previousValue += currentValue; //First: no leading space
    else if (isCurrentEven) return previousValue += ' ' + currentValue;
    else return previousValue +=  '\n' + currentValue;
  }, '');

  let richText = SpreadsheetApp.newRichTextValue().setText(value);
  let bold = SpreadsheetApp.newTextStyle().setBold(true).build();
  let red = SpreadsheetApp.newTextStyle().setBold(false).setForegroundColor('red').build();
  let skipCharCount = 0;
  arr.forEach((item, i) => {

    let isCurrentEven = (i % 2)
    if (!isCurrentEven) {
      let fromHere = skipCharCount;
      let toHere = skipCharCount + item.length;
      richText.setTextStyle(fromHere, toHere, bold)
    }

    if (i + 1 == arr.length && item == '0') {
      let fromHere = skipCharCount;
      let toHere = skipCharCount + item.length;
      richText.setTextStyle(fromHere, toHere, red)
    }

    skipCharCount += item.length + 1 // one for space/new line

  });

  return richText.build();

}

function makeNewSpreadsheetInFolder(folderId, name = 'Your Report') {
  let ss = SpreadsheetApp.create(name);
  let newFile = DriveApp.getFileById(ss.getId());

  newFile.moveTo(DriveApp.getFolderById(folderId));
  newFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);

  return newFile;
}


function makeNewSpreadsheetFromTemplate(templateId, targetFolderId, name = 'Your Report') {
  const template = DriveApp.getFileById(templateId);
  const folder = DriveApp.getFolderById(targetFolderId);

  let newFile = template.makeCopy(name, folder);
  newFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);

  return newFile
}



/* 
**********************
For testing
**********************
 */
const TEST_DATA = {"ssName":"Diff Reports","fileTuples":[{"srcName":"DataValidation.KOR.udn.txt.sdlxliff","tarName":"DataValidation.KOR.udn.txt.sdlxliff","changeCount":"0","table":[]},]}

function testMain() {
  main(TEST_DATA)
}

function pretendPost(){
  // Make a POST request with a JSON payload.
  let options = {
    'method' : 'post',
    'contentType': 'text/plain;charset=utf-8',
    'payload' : JSON.stringify(TEST_DATA)
  };
  UrlFetchApp.fetch('https://script.google.com/macros/s/AKfycbyZVIrG3jsDr-uyNFuAJdYq9olJTCkfoJzWe-RCnqPyFZV-6nO4RdL6eft5dZnygbhYVQ/exec', options);
  // Probably outdated URL ☝️ (Re-deploy and paste new one)
}


