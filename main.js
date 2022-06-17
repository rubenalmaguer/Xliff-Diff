let SOURCE_FILES = [];
let TARGET_FILES = [];
let COMPARISONS = [];
let REPORTS_COUNTER = 0;

/* SCHEMA
COMPARISONS = [
  { name1: '',
    name2: '',
    changedRows: '0',
    rows: [
    [['id'], ['source'], ['translation'], ['revision']],
    [['id'], ['source'], ['translation'], ['revision']],
    ]
  },
  { // },
]
*/

function processFiles(files, fileDisplayArea) {
  // Validate
  if (!files.length) return

  let isNotXliff = file => (file.name.substring(file.name.length - 9) != '.sdlxliff')
  if (files.some(isNotXliff)) {
    alert('File type not supported')
    return
  }

  // Add to previously-chosen files, if any
  if (fileDisplayArea.closest('#drop-area-1')) { 
    SOURCE_FILES = [...SOURCE_FILES, ...files] } else { TARGET_FILES = [...TARGET_FILES, ...files] }

  // Log as cards
  files.forEach(file => {
    let card = Object.assign(document.createElement('div'), { classList: 'card' });
    card.textContent = file.name;
    fileDisplayArea.append(card);
  });

  // Hide uploader
  fileDisplayArea.parentNode.querySelector('.uploader').classList.add('disabled');

  // Enable GO button
  if (SOURCE_FILES.length && TARGET_FILES.length) goBtn.removeAttribute('disabled');;
}

/* ///////////////////// */

function go() {

  //Remove singletons
  SOURCE_FILES = SOURCE_FILES.filter((_, i) => { return (TARGET_FILES[i]) });
  
  //Kick off all reports
  SOURCE_FILES.forEach( (_, i) => { readPairOfFiles(SOURCE_FILES[i], TARGET_FILES[i]) });

  //Make each report
  function readPairOfFiles(sourceFile, targetFile) {
    const reader = new FileReader();
    const reader2 = new FileReader();
    let xmlString1, xmlString2;
    
    reader.readAsText(sourceFile, "UTF-8");
    reader.onload = e => {
        xmlString1 = e.target.result;
  
        reader2.readAsText(targetFile, "UTF-8");
        reader2.onload = e => {
            xmlString2 = e.target.result;

            makeReportHTML(xmlString1, xmlString2, sourceFile.name, targetFile.name)

        };
    };
  }
}


function makeReportHTML(xmlString1, xmlString2, name1, name2) {
  //References
  const parser = new DOMParser();
  const xmlDOM1 = parser.parseFromString(xmlString1, 'application/xml');
  const xmlDOM2 = parser.parseFromString(xmlString2, 'application/xml');
  const srcSegments1 = xmlDOM1.querySelectorAll('seg-source mrk[mtype="seg"]');
  const srcSegments2 = xmlDOM2.querySelectorAll('seg-source mrk[mtype="seg"]');
  const checkBoxes = document.querySelectorAll('[type="checkbox"]');
  const showIdenticals = (checkBoxes[0].checked);

  //Get array of unique segment ids (including split segments)
  let uniqueSegmentIds = getUniqueIds(srcSegments1, srcSegments2);

  //Make report containing HTML table
  let report = Object.assign(document.createElement('div'), {
    classList: 'report-div',
    innerHTML: `
      <div class="table-summary">
        <p><b>File 1:</b> <span>${name1}</span></p>
        <p><b>File 2:</b> <span>${name2}</span></p>
      </div>
      <table>
        <thead>
            <tr>
                <th class="row-show">ID</th>
                <th class="row-show">Source</th>
                <th class="row-show">File 1</th>
                <th class="row-show">File 2</th>
                <th class="row-show">Changes</th>
            </tr>                
        </thead>
        <tbody></tbody>
      </table>
  `});
  document.querySelector('#reports-area').appendChild(report);

  //Headers' visibility
  document.querySelectorAll('th').forEach(h => h.classList.add('column-show'));

  //Populate Rows
  for (let id of uniqueSegmentIds) {
      let newRow = document.createElement('tr');

      // Segment ID
      let cell = document.createElement('td');
      cell.innerText = id.replace('_x0020_', '_'); //Split segments: 12_x0020_b → 12_b
      /* if (checkBoxes[0].checked) */ cell.classList.add('column-show') //Col visibility
      newRow.appendChild(cell);

      // Source
      cell = document.createElement('td');
      let taggedText = xmlDOM1.querySelectorAll(`[mid="${id}"]`)[0]?.innerHTML;
      if (taggedText === undefined) { taggedText = xmlDOM2.querySelectorAll(`[mid="${id}"]`)[0]?.innerHTML; } /* Segment id exists in target only (due to splitting) */
      let detaggedText = (taggedText) ? styleTagsAllaTrados(taggedText) : '';
      cell.innerHTML = detaggedText;
      /* if (checkBoxes[1].checked) */ cell.classList.add('column-show') //Col visibility
      newRow.appendChild(cell);

      // OG Translation
      cell = document.createElement('td');
      taggedText = xmlDOM1.querySelectorAll(`[mid="${id}"]`)[1]?.innerHTML; //Assumes 2nd "mid" is target (1st being source)
      detaggedText = (taggedText) ? styleTagsAllaTrados(taggedText) : '';
      cell.innerHTML = detaggedText;
      /* if (checkBoxes[2].checked) */ cell.classList.add('column-show') //Col visibility
      newRow.appendChild(cell);

      // Revised Translation
      cell = document.createElement('td');
      taggedText = xmlDOM2.querySelectorAll(`[mid="${id}"]`)[1]?.innerHTML;
      detaggedText = (taggedText) ? styleTagsAllaTrados(taggedText) : '';
      cell.innerHTML = detaggedText;
      /* if (checkBoxes[3].checked) */ cell.classList.add('column-show') //Col visibility
      newRow.appendChild(cell);

      // Diff
      cell = document.createElement('td');
      let r1 = newRow.children[2];
      let r2 = newRow.children[3];
      let txt1 = r1.innerText;
      let txt2 = r2.innerText;
      if (txt1 != txt2) {
          cell.append(getDiff(txt1, txt2,'auto'))
      } else { 
          cell.append(r2.innerHTML);
      }
      
      /* if (checkBoxes[4].checked) */ cell.classList.add('column-show') //Col visibility
      newRow.appendChild(cell);
      
      //Row visibility 
      [...newRow.querySelectorAll('td')].forEach(td => { 
          if (txt1 != txt2) {
            td.classList.add('row-show')
          }
          else {
            (showIdenticals) ? td.classList.add('identical', 'row-show') : td.classList.add('identical');
          }
          
      })

      //Append row to table
      report.children[1].appendChild(newRow);
  }
  
  // Count non-identicals
  let identicalsCount = report.querySelectorAll('.identical:last-child').length;
  let nonIdenticalsCount = uniqueSegmentIds.length - identicalsCount;
  let tableSummaries = document.querySelectorAll('.table-summary');
  let thisSummary = tableSummaries[tableSummaries.length-1];
  thisSummary.innerHTML += `
  <p><b>Edited segments:</b>
    <span style="color: ${(nonIdenticalsCount == 0) ? 'red' : 'black'}">${nonIdenticalsCount}</span>
  </p>`

  // SET VIEW (show header with xlBtn, gsBtn, etc.)
  document.getElementById('sticky-menu').style.display = 'flex';
  document.getElementsByTagName('main')[0].style.display = 'none';

  // Make POST request
  REPORTS_COUNTER++
  if (REPORTS_COUNTER == SOURCE_FILES.length) autoRequest();
  
}


function getUniqueIds(srcSegments1, srcSegments2) {
  let uniqueSegmentIds = [];
  for (seg of srcSegments1) {
      let id = seg.getAttribute('mid');
      uniqueSegmentIds.push(id)
  }

  for (seg of srcSegments2) {
      let id = seg.getAttribute('mid');
      if (uniqueSegmentIds.indexOf(id) === -1) { uniqueSegmentIds.push(id) } //Add only if not duplicate
  }

  uniqueSegmentIds.sort((a, b) => {
      a = a.replace('_x0020_', '_').replace(/\D/g,''); //Before comparing numerically (not alphabetically) remove
      b = b.replace('_x0020_', '_').replace(/\D/g,''); //x0020 is hex for space, used for split segments i.e. "11_a"
      return a - b;
  });

  return uniqueSegmentIds
}

  
function styleTagsAllaTrados(xmlString) {
  console.log(xmlString)
  xmlString = xmlString
  .replace(/<g[^>]+id="([^>]+)">/g, '<span tag-id="$1" style="color:purple">▶</span>')
  .replace(/<\/g>/g, '<span style="color:purple">◀</span>')
  .replace(/<x[^>]+id="([^>]+)"\/>/g, '<span placeholder-id="$1" style="color:purple">▰</span>')

  console.log(xmlString)
  return xmlString
}

function makeIntoSpreadsheet(action) {
  spinner.showModal();
  if (!window.INTERVAL_ID) {
    window.INTERVAL_ID = setInterval(checkForResponse, 200);
  }
  
  function checkForResponse() {
    if (window.PRIOR_RESPONSE) {
      if (window.PRIOR_RESPONSE == 'error') {
        alert('Something went wrong.')
      }
      else {
        let url = `https://docs.google.com/spreadsheets/d/${PRIOR_RESPONSE}${(action == 'open') ? '/edit' : '/export'}`;
        window.open(url);
      }
      clearInterval(INTERVAL_ID);
      INTERVAL_ID = null;
      spinner.close();
    }
  }
}

function autoRequest() {
  //FYI: Folder/Script URL: https://drive.google.com/drive/u/1/folders/1DSPhBQ_0h-wzBPYMdgzfeg5t70bB71-J
  let DEPLOYMENT_URL = 'https://script.google.com/macros/s/AKfycbxDJ01NFxYiaT1lPhMuvTwXPrc23gEe3N22WdKpt8lseRF6EzZm3RJKNSMMrg68QYi1Zw/exec';

  let data = getTableDataAsJSON();
  data = JSON.stringify(data);

  let options = {
    method: 'POST',
    body: data,
    headers: { 'Content-Type': 'text/plain;charset=utf-8', }
  }

  fetch(DEPLOYMENT_URL, options)
  .then(response => {
    if (!response.ok) /* status code ≠ 200-299) */ { throw new Error(`Request failed with status ${response.status}`) }
    return response.text()
  })
  .then(responseAsText => {
    window.PRIOR_RESPONSE = responseAsText; //SAVE AS GLOBAL!!!!!!!!!!!!!!!!!!!!
    let url = `https://docs.google.com/spreadsheets/d/${PRIOR_RESPONSE}`;
    console.log(url);
  })
  .catch(error => {
    console.log(error);
    window.PRIOR_RESPONSE = 'error'
  });
}


function getTableDataAsJSON() {
  json = {};
  json.ssName = 'Diff Reports';
  json.fileTuples = [];

  const reports = [...document.querySelectorAll('.report-div')];

  reports.forEach(rep => {
    const summaryItems = rep.querySelectorAll('.table-summary p span');
    const allCells = [...rep.querySelectorAll('td')];

    let tableAsArray = [];
    let oneRow = [];
    allCells.forEach( (td, i) => {
      let isFifthColumn = ((i + 1) % 5  == 0)
      if (td.matches('.column-show.row-show')) {

        if (!isFifthColumn) {
          oneRow.push(td.textContent)
        }
        else {
          tableAsArray.push(oneRow);
          oneRow = [];
        }

      }
    });

    let tuple = {
      srcName: summaryItems[0].textContent,
      tarName: summaryItems[1].textContent,
      changeCount: summaryItems[2].textContent,
      table: tableAsArray,
    };

    json.fileTuples.push(tuple);

  });

  return json
}




