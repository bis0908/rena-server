$(document).ready(function () {
  getServerStatus();

  $("#serverStatus").on("click", ".change-server-name", function () {
    console.log("clicked");
    const serverName = $(this).closest("td").find("span:first-child");
    console.log("serverList: ", serverName.text());
    const name = serverName.text();
    console.log(serverName.data("no"));

    const inputElement = $("<input>")
      .attr("type", "text")
      .attr("value", name)
      .addClass("form-control");
    const saveButton = $("<button>").attr("type", "button").addClass("btn btn-danger").text("Save");
    const cancelButton = $("<button>")
      .attr("type", "button")
      .addClass("btn btn-success ml-2")
      .text("Cancel");

    serverName.html(inputElement);
    const span = $(this).parent("span");
    span.html(saveButton);
    span.append(cancelButton);

    saveButton.on("click", function () {
      const newSenderName = inputElement.val().trim();
      const message = `서버 이름 변경\n${name} --> ${newSenderName}?`;
      if (confirm(message)) {
        const no = serverName.data("no");
        updateServerName(newSenderName, String(no));
      }
    });

    cancelButton.on("click", function () {
      // Replace the input element with the original list item
      getServerStatus();
    });
  });

  $("#serverStatus").on("click", ".delete-server-name", function () {
    const serverName = $(this).closest("tr").find("td:first-child span[data-no]").text();
    if (confirm(`서버 ${serverName}가 목록에서 삭제됩니다`)) {
      const no = String($(this).data("no"));
      deleteServerName(no);
    }
  });
});

function showLoading() {
  $("body").append("<div class='overlay'></div>");
  $("body").css("pointer-events", "none");
  $("body").append(
    `<div class="spinner-border text-primary" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>`
  );
}

function hideLoading() {
  $(".overlay").remove();
  $(".spinner-border").remove();
  $("body").css("pointer-events", "auto");
}

async function getServerStatus() {
  showLoading();
  try {
    const result = await $.ajax({
      type: "post",
      url: "/api/mail_server_status",
      dataType: "json",
    });
    // console.log(result);
    const listItems = generateServerStatusList(result);
    $("#serverStatus").html(listItems);
    hideLoading();
  } catch (error) {
    console.error(error);
  }
}

function generateServerStatusList(serverStats) {
  let list = "";
  serverStats.forEach((serverInfo) => {
    list += makeList(serverInfo);
  });
  return `<table class="table table-striped table-hover align-middle" >
    <thead>
      <tr>
        <th>Name</th>
        <th>Status</th>
        <th>Last Update</th>
      </tr>
    </thead>
    <tbody class="table-group-divider">
      ${list}
    </tbody>
  </table>`;
}

function dateCompare(server_last_update) {
  const serverLastUpdateDate = new Date(server_last_update);
  const currentDate = new Date();

  return timeDifference(currentDate, serverLastUpdateDate);
}

function makeList(serverInfo) {
  const { server_name, server_status, server_last_update, no } = serverInfo;
  let statusTag = "";

  const timeDiff = calculateTimeDifference(server_last_update);

  switch (server_status) {
    case "0":
      statusTag = '<i class="bi bi-database-slash text-danger" style="font-size: 36px;"></i>';
      break;
    case "1":
      if (timeDiff > 60) {
        statusTag =
          '<i class="bi bi-database-exclamation text-danger" style="font-size: 36px"></i>';
      } else if (timeDiff > 5) {
        statusTag = '<i class="bi bi-database-slash text-warning" style="font-size: 36px;"></i>';
      } else {
        statusTag = '<i class="bi bi-database-check text-success" style="font-size: 36px"></i>';
      }
      break;
    case "2":
      statusTag = '<i class="bi bi-database-exclamation text-warning" style="font-size: 36px"></i>';
      break;
    default:
      statusTag = '<i class="bi bi-database-lock" style="font-size: 36px"></i>';
      break;
  }

  return `
  <tr>
    <td>
      <div class="d-flex justify-content-between">
        <span data-no="${no}">${server_name}</span>
        <span><button id="${no}" type="button" class="btn btn-primary change-server-name">서버 이름 변경</button></span>
      </div>
    </td>
    <td style="text-align-last: center;">${statusTag}</td>
    <td>
    <div class="d-flex justify-content-between">
      <span>${dateCompare(server_last_update)}</span>
      <span>
        <button id="delete-${server_name}" type="button" class="btn btn-danger delete-server-name" data-no="${no}">
          <i class="bi bi-x-circle"></i>
        </button>
      </span>
    </div>
    </td>
  </tr>`;
}

function calculateTimeDifference(serverLastUpdate) {
  const now = new Date();
  const serverUpdateTime = new Date(serverLastUpdate);
  const diffInMilliseconds = now.getTime() - serverUpdateTime.getTime();
  const diffInMinutes = diffInMilliseconds / (1000 * 60);

  return diffInMinutes;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const amPm = hours >= 12 ? "오후" : "오전";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  hours = String(hours).padStart(2, "0");

  return `${year}-${month}-${day} ${amPm} ${hours}:${minutes}:${seconds} `;
}

function timeDifference(current, previous) {
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  const elapsed = current - previous;

  if (elapsed < msPerMinute) {
    return Math.round(elapsed / 1000) + "초 전";
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + "분 전";
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + "시간 전";
  } else if (elapsed < msPerMonth) {
    return Math.round(elapsed / msPerDay) + "일 전";
  } else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerMonth) + "개월 전";
  } else {
    return Math.round(elapsed / msPerYear) + "년 전";
  }
}

function updateServerName(newSenderName, rowNo) {
  $.ajax({
    type: "post",
    url: "/db/updateServerName",
    data: { newSenderName, rowNo },
    dataType: "json",
    success: function (response) {
      console.log("response: ", response);
      if (response === true) {
        getServerStatus();
      } else {
        alert("서버 이름 변경 실패");
      }
    },
    error: (xhr, status, error) => {
      alert("이름 변경 실패. 자세한 내용은 에러 내용을 참조하세요");
      console.error(error);
    },
  });
}

function deleteServerName(rowNo) {
  $.ajax({
    type: "post",
    url: "/db/deleteServerName",
    data: { rowNo },
    dataType: "json",
    success: function (response) {
      console.log("response: ", response);
      if (response === true) {
        getServerStatus();
      } else {
        alert("서버 이름 변경 실패");
      }
    },
    error: (xhr, status, error) => {
      alert("이름 변경 실패. 자세한 내용은 에러 내용을 참조하세요");
      console.error(error);
    },
  });
}

$("#logout").on("click", function () {
  $.post("/logout").then((res) => {
    window.location.href = "/login";
  });
});
