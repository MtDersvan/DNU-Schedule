'use strict';

(function() {
  var userId = null;
  var v = document.getElementById('validerr');
  var password = document.getElementById('password');
  var passconf = document.getElementById('passconf');

  window.onload = function(evt) {
    var resetPasswordButtons = document.getElementsByName('resetpassword');
    var adminCheckboxes = document.getElementsByName('isAdmin');
    var passform = document.getElementById('resetpassform');

    $('.remove-teacher').on('click', function(evt) {
      var teacher = $(evt.target).parents('tr').data('teacher'),
        a = confirm('Ви дійсно хочете видалити викладача?');
      if (a) {
        $.ajax('/teachers', {
          method: 'delete',
          data: {
            teacher: teacher
          },
          success: function() {
            window.location.reload();
          }
        });
      }
    });

    for (var i = 0; i < resetPasswordButtons.length; i++) {
      resetPasswordButtons[i].addEventListener('click', onResetPasswordModalClick, false);
    }

    for (i = 0; i < adminCheckboxes.length; i++) {
      adminCheckboxes[i].addEventListener('change', onAdminCBChange, false);
    }

    passform.addEventListener('submit', onPassformSubmit, false);
  }

  function onResetPasswordModalClick(evt) {
    fillResetModalWithData(evt.target);
    resetResetModal();
    $('#resetpasswordmodal').modal()[0];
  }

  function resetResetModal() {
    removeAllNodes(v);
    password.value = '';
    passconf.value = '';
  }

  function onAdminCBChange(evt) {
    userId = getUserId(evt.target.parentNode);
    var isAdmin = evt.target.checked;

    $.ajax('/users/setadmin', {
      method: 'PUT',
      data: {
        user: userId,
        admin: isAdmin
      },
      success: function(data) {
        console.log('ok');
      }
    });
  }

  function onPassformSubmit(evt) {
    removeAllNodes(v);

    function validate(data) {
      var error = '';
      if (data.password.trim() === '') {
        error = 'Пароль не повинен бути пустим';
      }

      if (data.passconf !== data.password) {
        error = 'Паролі не співпадають';
      }

      return error.length ? error : null;
    }

    var data = {
      password: password.value,
      passconf: passconf.value
    };

    var error = validate(data);
    if (error) {
      evt.preventDefault();
      var li = document.createElement('li');
      li.textContent = error;
      v.appendChild(li);
    }
  }

  function fillResetModalWithData(target) {
    userId = getUserId(target.parentNode);
    document.getElementById('userId').value = userId;
  }

  function getUserId(cell) {
    var parentRow = cell.parentNode;

    for (var i = 0; i < parentRow.childNodes.length; i++) {
      var node = parentRow.childNodes[i];
      if (node.matches('.username')) {
        return node.getAttribute('data-user');
      }
    }

    return undefined;
  }
})();