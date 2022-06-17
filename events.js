// References also used by main.js, don't delete
const dropAreas = [...document.querySelectorAll('.drop-area')];
const uploadButtons = [...document.querySelectorAll('.drop-area input')];
const clearButtons = [...document.querySelectorAll('.clear-button')];
const goBtn = document.querySelector('#go-button');
const spinner = document.querySelector('#modal');

// Clicks
uploadButtons.forEach(b => b.addEventListener('change', handleBrowse));
clearButtons.forEach(b => b.addEventListener('click', clearFileList));

//Drag n Drop
['dragenter', 'dragover', 'dragleave', 'drop']
.forEach(eventName => window.addEventListener(eventName, preventDefaults));

['dragenter', 'dragover']
.forEach(eventName => addEventToBothAreas(eventName, highlight));

['dragleave', 'drop']
.forEach(eventName => addEventToBothAreas(eventName, unhighlight));

addEventToBothAreas('drop', handleDrop)

function addEventToBothAreas(eventName, callback) {
  dropAreas[0].addEventListener(eventName, callback);
  dropAreas[1].addEventListener(eventName, callback);
}

function preventDefaults (e) {
  e.preventDefault()
  e.stopPropagation()
  if (!e.target.closest('.drop-area')) {
    /* e.dataTransfer.effectAllowed = 'none'; */
    e.dataTransfer.dropEffect = 'none';
  }
}

function highlight(e) {
  e.target.closest('.drop-area').classList.add('highlight')
}

function unhighlight(e) {
  e.target.closest('.drop-area').classList.remove('highlight')
}

/* ----------------------------------- */

// Two ways to get files:
  
function handleDrop(e) {
  let dt = e.dataTransfer
  let files = [...dt.files];
  let sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));
  let fileDisplayArea = e.target.closest('.drop-area').querySelector('.cards');

  processFiles(sortedFiles, fileDisplayArea)
}

function handleBrowse(e) {
  let inputElement = e.target;
  let files = [...inputElement.files];
  let sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));
  let fileDisplayArea = inputElement.closest('.drop-area').querySelector('.cards');

  processFiles(sortedFiles, fileDisplayArea)
}
/* ----------------------------------- */

function clearFileList(e) {
  // Clear visually
  let parentDropArea = e.target.closest('.drop-area');
  parentDropArea.querySelector('.uploader').classList.remove('disabled');
  [...parentDropArea.querySelectorAll('.card')].forEach(c => c.remove());

  // Clear actual data
  if (parentDropArea.closest('#drop-area-1')) {
      SOURCE_FILES = [] } else { TARGET_FILES = [] }

  // Disable main button
  goBtn.setAttribute('disabled', true);
}


// Called from in-line attribute
function traverseReports(direction) {
  const HEADER_OFFSET = 75;
  const reports = [...document.querySelectorAll('.report-div')];
  let firstVisible = reports.find(el => isElementInViewport(el));

  if (direction == 'next' && firstVisible.nextElementSibling) {
    scrollToTargetAdjusted(firstVisible.nextElementSibling)
  }
  else if (direction == 'next') {
    window.scrollTo({ top: document.body.clientHeight, behavior: 'smooth' });
  }
  else if (direction == 'previous' && firstVisible.previousElementSibling) {
    if (firstVisible.getBoundingClientRect().top < 0 ) { //IF the top of 1st visible report is hidden above
      scrollToTargetAdjusted(firstVisible)
    }
    else { scrollToTargetAdjusted(firstVisible.previousElementSibling)}
  }
  else if (direction == 'previous') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function isElementInViewport(el) {
    let myElementHeight = el.offsetHeight;
    let myElementWidth = el.offsetWidth;
    let rect = el.getBoundingClientRect();

    return (rect.top >= -myElementHeight 
        && rect.left >= -myElementWidth
        && rect.right <= (window.innerWidth || document.documentElement.clientWidth) + myElementWidth
        && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + myElementHeight)  
  }

  function scrollToTargetAdjusted(element) {
    let elementPosition = element.getBoundingClientRect().top;
    let offsetPosition = elementPosition + window.pageYOffset - HEADER_OFFSET;
  
    window.scrollTo({
         top: offsetPosition,
         behavior: "smooth"
    });
  }

}