$(document).ready(function () {
  $("#password").on("keydown", function (e) {
    if (e.key === "Enter") {
      tryLogin();
    }
  });

  $("#login").on("click", function (e) {
    tryLogin();
  });

  $(".change-password").on("click", function () {
    $("#passwordChangeModal").show();
  });

  $("#passwordChangeModal").on("hidden.bs.modal", function (e) {
    $("#currentPassword, #newPassword, #confirmNewPassword").val("");
  });
});

$("#submitPasswordChange").on("click", function (e) {
  e.preventDefault();

  const currentPassword = $("#currentPassword").val();
  const newPassword = $("#newPassword").val();
  const confirmNewPassword = $("#confirmNewPassword").val();

  if (newPassword !== confirmNewPassword) {
    $("#confirmNewPasswordHelp").text("Incorrect password");
    $("#confirmNewPasswordHelp").show();
    return;
  }

  if (currentPassword === newPassword && currentPassword === confirmNewPassword) {
    $("#currentPasswordHelp").text("현재 암호와 변경할 암호가 동일합니다");
    $("#currentPasswordHelp").show();
    return;
  } else {
    changePassword(currentPassword, newPassword);
  }
});

function tryLogin() {
  $.ajax({
    type: "post",
    url: "/auth/login",
    data: { password: $("#password").val() },
    dataType: "json",
    success: function (response) {
      if (response.success === true) {
        console.log("response: ", response);
        window.location.href = "/";
      } else {
        $("#currentPasswordLogin").show();
      }
    },
    error: (jqXHR, textStatus, errorThrown) => {
      console.error(textStatus, errorThrown);
    },
  });
}

function changePassword(currentPassword, newPassword) {
  $.ajax({
    url: "/auth/changePassword",
    type: "post",
    async: false,
    data: {
      currentPw: currentPassword,
      newPw: newPassword,
    },
    success: function (response) {
      if (response) {
        // bool = response.success;
        $("#passwordChangeModal").modal("hide");
        setTimeout(() => {
          $(".toast").toast("show");
        }, 0);
      } else {
        $("#currentPasswordHelp").show();
      }
    },
  });
}
