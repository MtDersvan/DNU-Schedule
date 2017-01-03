'use strict';

var groupsList = {};

/**
 * 
 */
function createGroupItem(groupsList, day, order, withRemove, defaultValue) {
  var item = document.createElement('li');
  var groupCode = document.createElement('input');
  var groupList = document.createElement('select');
  var itemIndex = document.querySelectorAll('[name^="gc-' + day + '-' + order + '"]').length;
  var listName = 'groups';

  groupCode.className = 'gc';
  groupList.name = listName;
  groupList.classList.add('form-control');
  fillList(groupList, groupsList);
  append([groupCode, groupList], item);

  groupCode.addEventListener('keypress', onGroupCodeKeypressHandler, false);
  groupCode.addEventListener('keydown', onGroupCodeKeydownHandler, false);
  groupCode.addEventListener('keyup', onGroupCodeKeyupHandler, false);

  if (withRemove) {
    var removeGroupBtn = createRemoveGroupBtn();
    item.insertBefore(removeGroupBtn, item.firstChild);
  } else {
    var addGroupBtn = createAddGroupBtn();
    item.appendChild(addGroupBtn);
  }

  if (defaultValue) {
    groupList.value = defaultValue;
  }

  return item;
}

function createAddGroupBtn() {
  var btn = document.createElement('span');

  btn.classList.add('icon', 'icon-plus', 'right');
  btn.addEventListener('click', onAddGroupClickHandler, false);

  return btn;
}

function createRemoveGroupBtn() {
  var btn = document.createElement('span');

  btn.classList.add('icon', 'icon-remove', 'left');
  btn.addEventListener('click', onRemoveGroupBtnHandler, false);

  return btn;
}

function onAddGroupClickHandler(evt) {
  let item = evt.target.parentNode;
  let list = item.parentNode;
  let day = parseInt(list.getAttribute('day'));
  let order = parseInt(list.getAttribute('order'));
  let newItem = createGroupItem(groupsList, day, order, true);

  let row = findParent(list, 'tr');
  if (row) {
    let countBox = row.querySelector('td.activity-type').children[1];
    countBox.value = parseInt(countBox.value) + 1;
  }

  list.appendChild(newItem);
}

function onRemoveGroupBtnHandler(evt) {
  let item = evt.target.parentNode;
  let list = item.parentNode;

  let row = findParent(list, 'tr');
  if (row) {
    let countBox = row.querySelector('td.activity-type').children[1];
    countBox.value = parseInt(countBox.value) - 1;
  }

  list.removeChild(item);
}

function loadGroups() {
  _requestGroupList('', function(data) {
    const {groups} = data;

    if (groups) {
      groups.forEach(group => {
        const groupName = group.name;

        groupsList[groupName] = groupName;
      })
    }
  });
}

/**
 * @param {function} cb - success callback
 */
function _requestGroupList(value, success) {
  $.ajax('/groups', {
    method: 'GET',
    data: {
      groupName: value
    },
    success: success,
    error: (err) => {
      console.log('ERROR!', err);
    }
  });
}