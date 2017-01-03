'use strict';

var previousTopicValue = '';

function createDisciplineInfoBox(discipline) {
  var box = document.createElement('div');

  box.id = 'discipline-info';
  box.classList.add('discipline-info-box');
  box.textContent = discipline;

  return box;
}

function onOpenTopicClick(evt) {
  var target = ('div' === evt.target.nodeName.toLowerCase()) ? evt.target : evt.target.parentNode;
  if (-1 !== target.lastChild.className.indexOf('topic-value')) {
    return false;
  }

  var topicNameContainer = target.lastChild,
    reglament = target.getAttribute('reglament');

  previousTopicValue = topicNameContainer.textContent;

  topicNameContainer.remove();

  var ti = createTopicInput(reglament, previousTopicValue);
  append(ti, target);
  ti.focus();
}

function createTopicInput(reglament, value) {
  var topicInput = document.createElement('input');

  topicInput.type = 'text';
  topicInput.classList.add('form-control', 'topic-value');
  topicInput.setAttribute('reglament', reglament);
  topicInput.value = value;

  topicInput.onblur = onTopicInputBlur;
  topicInput.onkeydown = onTopicInputSubmit;

  return topicInput;
}

function onTopicInputBlur(evt) {
  var container = evt.target.parentNode,
    topicValueBox = document.createElement('span');

  evt.target.remove();
  topicValueBox.textContent = previousTopicValue;
  topicValueBox.classList.add('lesson-topic');
  append(topicValueBox, container);
  previousTopicValue = '';
}

function onTopicInputSubmit(evt) {
  const { target } = evt;
  const reglament = target.getAttribute('reglament');
  const openLesson = target.value;

  console.log(reglament, openLesson);

  if (13 === evt.keyCode) {
    $.ajax('/reglaments/editopentopic', {
      method: 'PUT',
      data: {
        reglament,
        openLesson
      },
      success: function(data) {
        previousTopicValue = openLesson;
        evt.target.blur();
      }
    });
  }
}