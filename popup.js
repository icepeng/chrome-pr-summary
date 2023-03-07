const runEl = document.getElementById("run");
const inputEl = document.getElementById("apiKey");
const statusEl = document.getElementById("status");

async function requestSummary(diff, apiKey) {
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Create an outline for an pull request about the diff below in the described format.

        Diff:"""
        ${diff}
        """
        Format:"""
        1. What Changed
            - < sub section >
            - < sub section >
            - < sub section >
        2. Impact
            - < sub section >
            - < sub section >
            - < sub section >
        3. Testing
            - < sub section >
            - < sub section >
            - < sub section >`,
        },
      ],
    }),
  })
    .then((res) => res.json())
    .then((res) => res.choices[0].message.content.trim());
}

async function fillComment(summary) {
  const commentEl = document.getElementById("new_comment_field");
  commentEl.value = summary;

  ["focus", "input"].forEach((e) => {
    const event = new InputEvent(e);
    commentEl.dispatchEvent(event);
  });
}

runEl.addEventListener("click", async () => {
  runEl.setAttribute("disabled", "");
  try {
    const apiKey = inputEl.value;
    await chrome.storage.sync.set({ apiKey });

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    statusEl.innerText = "Requesting Diff...";

    const diff = await new Promise((resolve) =>
      chrome.runtime.sendMessage({ url: tab.url + ".diff" }, resolve)
    );

    statusEl.innerText = "Requesting Summary...";

    const summary = await requestSummary(diff, apiKey);

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: fillComment,
      args: [summary],
    });

    statusEl.innerText = "Done!";
  } catch (err) {
    console.error(err);
    statusEl.innerText = "Error, check console.";
  } finally {
    runEl.removeAttribute("disabled");
  }
});

async function init() {
  const { apiKey } = await chrome.storage.sync.get("apiKey");
  inputEl.value = apiKey ?? "";
}

init();
