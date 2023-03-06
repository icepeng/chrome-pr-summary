chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  fetch(request.url, {
    method: "GET",
    headers: { "Content-Type": "text/plain" },
  })
    .then((res) => res.text())
    .then((res) => sendResponse(res));
  return true;
});
