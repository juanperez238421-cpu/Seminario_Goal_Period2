const requestedEntry = new URLSearchParams(window.location.search).get("entry");
let lastStudentId = "";

function priorityValue(card) {
  const chip = card.querySelector(".status-chip");
  const status = [...(chip?.classList || [])].find((name) => name.startsWith("status-")) || "";
  const order = {
    "status-blocked": 0,
    "status-initial": 1,
    "status-partial": 2,
    "status-functional": 3,
    "status-complete": 4,
  };
  const percentText = card.querySelector(".progress-label strong")?.textContent || "100";
  const percent = Number.parseInt(percentText, 10) || 0;
  return [order[status] ?? 5, percent];
}

function selectPriorityActivity() {
  if (requestedEntry) return;
  const selectedStudent = document.querySelector(".student-item.is-selected")?.dataset.studentId || "";
  if (!selectedStudent || selectedStudent === lastStudentId) return;
  const cards = [...document.querySelectorAll("#activityList [data-activity-path]")];
  if (!cards.length) return;
  cards.sort((a, b) => {
    const [statusA, percentA] = priorityValue(a);
    const [statusB, percentB] = priorityValue(b);
    return statusA - statusB || percentA - percentB;
  });
  lastStudentId = selectedStudent;
  cards[0].click();
}

const studentList = document.querySelector("#studentList");
const activityList = document.querySelector("#activityList");
if (studentList) {
  new MutationObserver(() => window.setTimeout(selectPriorityActivity, 40)).observe(studentList, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });
}
if (activityList) {
  new MutationObserver(() => window.setTimeout(selectPriorityActivity, 40)).observe(activityList, { childList: true, subtree: true });
}
window.setTimeout(selectPriorityActivity, 250);
