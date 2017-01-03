'use strict';

var teacherList,
  yearList,
  semesterList;

window.addEventListener('load', function() {
  teacherList = document.getElementById('teacherbox');
  yearList = document.querySelector('[name="year"]');
  semesterList = document.querySelector('[name="semester"]');

  teacherList.addEventListener('change', onTeacherChangeHandler);
  teacherList.addEventListener('change', updateReglament);
  yearList.addEventListener('change', updateReglament);
  semesterList.addEventListener('change', updateReglament);
}, false);

function updateReglament(evt) {
  var teacher = document.querySelector('[name="teacher"]').value,
    year = yearList.value,
    semester = semesterList.value,
    data = {
      teacher: teacher,
      year: year,
      semester: semester
    };

  $.ajax('/reglaments/new', {
    method: 'GET',
    data: data,
    success: rebuildTable
  });
}

function rebuildTable(data) {
  var days = data.activity;

  table.style.display = 'none';
  removeAllNodes(table);
  for (var dayIndex = 0, len = days.length; dayIndex < len; dayIndex++) {
    table.appendChild(createDay(dayIndex, days[dayIndex]));
  }
  table.style.display = 'table';

  updateRate();
  setHandlersToVacantCells();
}

function onTeacherChangeHandler(evt) {
  var box = document.querySelector('[name="teacher"]');
  box.value = teacherList.value;
  var positionBox = document.getElementById('position');
  positionBox.textContent = (positions[evt.target.value] + 'a ');
}

function createDay(dayIndex, dayData) {
  var dayContent = createHeader(dayIndex);

  for (var index = 0, len = timeOrders.length; index < len; index++) {
    var lessons = dayData[index].lessons;
    var lessonsLength = lessons.length;

    if (lessonsLength == 0) {
      dayContent.appendChild(createTopRow(dayIndex, index, -1, undefined));
    } else if (lessonsLength == 1) {
      var lesson = lessons[0];
      var numerator = parseInt(lesson.numerator);
      console.log(numerator);
      if (numerator == -1) {
        dayContent.appendChild(createTopRow(dayIndex, index, numerator, lesson));
      } else if (numerator == 0) {
        dayContent.appendChild(createTopRow(dayIndex, index, numerator, lesson));
        dayContent.appendChild(createBottomRow(dayIndex, index, undefined));
      } else if (numerator == 1) {
        console.log('blah blash');
        let topRow = createTopRow(dayIndex, index, numerator, undefined);
        // console.log(topRow);
        dayContent.appendChild(topRow);
        dayContent.appendChild(createBottomRow(dayIndex, index, lesson));
      }
    } else if (lessonsLength == 2) {
      dayContent.appendChild(createTopRow(dayIndex, index, 0, lessons[0]));
      dayContent.appendChild(createBottomRow(dayIndex, index, lessons[1]));
    }
  }

  return dayContent;
}

function createHeader(dayIndex) {
  var mainRow = document.createElement('tr');
  var dayInfoRow = document.createElement('tr');
  var jobTypeRow = document.createElement('tr');
  var frag = document.createDocumentFragment();

  mainRow.appendChild(createTd({
    textContent: weekDays[dayIndex],
    colSpan: 7,
    className: 'week-day center'
  }));

  dayInfoRow.classList.add('center', 'day-info');
  dayInfoRow.appendChild(createTd({
    textContent: '№',
    rowSpan: 2
  }));
  dayInfoRow.appendChild(createTd({
    textContent: 'Час',
    className: 'activity-time',
    rowSpan: 2
  }));
  dayInfoRow.appendChild(createTd({
    textContent: 'Част.',
    className: 'numerator',
    rowSpan: 2
  }));
  dayInfoRow.appendChild(createTd({
    textContent: 'Вид роботи',
    colSpan: 3
  }));
  dayInfoRow.appendChild(createTd({
    textContent: 'Місце роботи',
    rowSpan: 2,
    className: 'place'
  }));

  jobTypeRow.classList.add('day-info');
  jobTypeRow.appendChild(createTd({
    textContent: 'Тип',
    className: 'type'
  }));
  jobTypeRow.appendChild(createTd({
    textContent: 'Групи',
    className: 'groups'
  }));
  jobTypeRow.appendChild(createTd({
    textContent: 'Дисципліна',
    className: 'discipline'
  }));

  append([mainRow, dayInfoRow, jobTypeRow], frag);

  return frag;
}

function createTopRow(day, order, numerator, lesson) {
  var tr = document.createElement('tr'),
    index = createTd({
      textContent: order + 1,
      className: 'activity-index'
    }),
    rowDs = tr.dataset;

  rowDs.order = order;
  rowDs.day = day;
  rowDs.numerator = numerator;
  rowDs.status = lesson ? 'busy' : 'vacant';

  if (numerator === 0) {
    index.rowSpan = 2;
  }
  // console.log('hello');
  // console.log(index);
  append(index, tr);
  // console.log(tr);
  if (lesson) {
    appendTimeCell(order, lesson, tr);
  }
  setAdditionalsToRow(tr, lesson, day, order);

  return tr;
}

function createBottomRow(day, order, lesson) {
  var tr = document.createElement('tr'),
      rowDs = tr.dataset;

  rowDs.order = order;
  rowDs.day = day;
  rowDs.numerator = 1;
  rowDs.status = lesson ? 'busy' : 'vacant';

  if (lesson) {
    appendTimeCell(order, lesson, tr);
  }
  setAdditionalsToRow(tr, lesson, day, order);

  return tr;
}

function appendTimeCell(order, lesson, to) {
  var time = document.createElement('td');

  time.classList.add('activity-time');
  time.textContent = extendedOrders[order][lesson.timeStart] + ' - ' + extendedOrders[order][lesson.timeEnd];
  append(time, to);
}

function setAdditionalsToRow(to, lesson, day, order) {
  var numerators = ['Т', 'Ч', 'З'];
  var type = createTd({
    className: 'activity-type',
    colSpan: 3
  });


  if (lesson) {
    var  discipline = lesson.discipline,
      numerator = parseInt(lesson.numerator),
      lessonType = lesson.type,
      groups = lesson.groups,
      resultHTML = '';

    setStatus(to, 'busy');

    if (discipline) {
      resultHTML += '<span class="lesson-info">' + lesson.discipline + '</span><br />';
    }
    if (lessonType) {
      if (!discipline) {
        resultHTML = resultHTML + '<span class="lesson-info">' + jobTypes[lessonType] + '</span>';
      } else {
        resultHTML += jobTypes[lessonType];
      }
      resultHTML += '<br />';
    }
    if (groups && groups.length > 0) {
      resultHTML += groups.join(', ');
    }

    type.innerHTML = resultHTML;
    var numCell = createTd({
      textContent: numerators[numerator + 1],
      className: 'numerator'
    });
    var place = createTd({
      textContent: lesson.place,
      className: 'place'
    });

    append([numCell, type, place], to);
  } else {
    makeActivityVacant(to);
  }
}

function createTd(attr) {
  var td = document.createElement('td');
  if (attr) {
    for (var p in attr) {
      td[p] = attr[p];
    }
  }

  return td;
}