'use strict';

var jobTypes = {
    lecture: 'Лекція',
    practice: 'Практика',
    laboratory: 'Лабораторна',
    consultation: 'Консультація',
    classHour: 'ОВР',
    sci_work: 'Наукова робота'
};

var numeratorsList = {
    '-1': 'Щотижня',
    '0': 'Чисельник',
    '1': 'Знаменник'
};

var extendedOrders = [['08:00', '08:10', '08:20', '08:30', '08:40', '08:50', '09:00', '09:10', '09:20', '09:30'], ['09:30', '09:40', '09:50', '10:00', '10:10', '10:20', '10:30', '10:40', '10:50', '11:00'], ['11:10', '11:20', '11:30', '11:40', '11:50', '12:00', '12:10', '12:20', '12:30', '12:40'], ['12:40', '12:50', '13:00', '13:10', '13:20', '13:30', '13:40', '13:50', '14:00', '14:10'], ['14:10', '14:20', '14:30', '14:40', '14:50', '15:00', '15:10', '15:20', '15:30', '15:40'], ['15:40', '15:50', '15:00', '16:10', '16:20', '16:30', '16:40', '16:50', '17:00', '17:10'], ['17:10', '17:20', '17:30', '17:40', '17:50', '18:00', '18:10', '18:20', '18:30', '18:40'], ['18:40', '18:50', '19:00', '19:10', '19:20', '19:30', '19:40', '19:50', '20:00', '20:10']];

function onCreateTeacherClick() {
    var modal = $('#createTeacher').modal()[0];
}
/**
 * @param {} value 
 */
function createOption(value, text) {
    var option = document.createElement('option');
    option.value = value;
    option.textContent = text;

    return option;
}

function append(what, to) {
    if (!what.length) {
        what = [what];
    }

    if (to) {
        for (var i = 0; i < what.length; i++) {
            to.appendChild(what[i]);
        }
    }
}

function appendChildren(what, to) {
    for (var i = 0; i < what.length; i++) {
        to.appendChild(what[i]);
    }
}

function removeAllNodes(element, startIndex) {
    while (element && element.firstChild) {
        element.firstChild.remove();
    }
}

function removeChildren(element, startIndex, count) {
    if (element) {
        if (!startIndex) {
            startIndex = 0;
        }
        var children = element.children;
        var _count = _count ? _count : children.length - startIndex;
        while (_count) {
            children[startIndex].remove();
            _count--;
        }
    } else {
        console.error('Remove children: NOT_ELEMENT_FOUND;');
    }
}

function createJobTypesList(weekDay, time) {
    var selName = setName('type', weekDay, time),
        selType = createSelect(selName);

    fillList(selType, jobTypes);

    selType.addEventListener('change', onJobTypeChange, false);

    return selType;
}

/**
 * @param {Object} data - simple JavaScrip object 
 */
function fillList(list, data, dataStartValue, valueToSet) {
    var options = [];
    removeAllNodes(list);
    dataStartValue = !isNaN(parseInt(dataStartValue)) ? dataStartValue : 0;
    for (var p in data) {
        var n = p;
        if (!isNaN(parseInt(p)) && typeof dataStartValue === 'number') {
            p = parseInt(p) + dataStartValue;
        }
        options.push(createOption(p, data[n]));
    }
    if (options.length !== 0) {
        append(options, list);
    }

    if (valueToSet) {
        list.value = valueToSet;
    }
}

function onStartTimeChange(evt) {
    var target = evt.target,
        endTime = target.nextSibling,
        startValue = parseInt(target.value) + 1,
        endValue = parseInt(endTime.value),
        order = parseInt(target.getAttribute('order')),
        timesValue = extendedOrders[order].slice(startValue, extendedOrders[order].length);

    removeAllNodes(endTime);
    fillList(endTime, timesValue, startValue);

    var newEndValue = startValue + timesValue.length - 1;
    if (startValue < endValue) {
        newEndValue = endValue;
    }

    endTime.value = newEndValue;
}

function findParent(element, selector) {
    var parent = element;
    while (parent && !parent.matches(selector)) {
        parent = parent.parentNode;
        if (parent === document.body) {
            console.error('NO_ELEMENT_PARENT_WITH_SELECTOR:', selector);

            return null;
        }
    }

    return parent;
}

function toArray(nodeList) {
    var tmp = [];
    for (var i = 0, len = nodeList.length; i < len; i++) {
        tmp.push(nodeList[i]);
    }

    return tmp;
}

function getAttribute(element, attribute) {
    return element.getAttribute(attribute);
}

function hasClass(element, className) {
    return element.classList.contains(className);
}

function findChild(element, childSelector) {
    return element.querySelector(childSelector);
}

function toInt(obj, prop) {
    if (obj[prop]) {
        obj[prop] = parseInt(obj[prop]);
    }
}
