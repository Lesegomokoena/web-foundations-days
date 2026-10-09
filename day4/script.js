
const textarea = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

const DRAFT_KEY = "quicknotes-draft";
const THEME_KEY = "quicknotes-theme";

// Update the character and word counters
function updateCounts() {
  const text = textarea.value;
  const characters = text.length;

  const trimmedText = text.trim();
  const words = trimmedText === ""
    ? 0
    : trimmedText.split(/\s+/).length;

  charCount.textContent = `${characters} / 200 characters`;
  wordCount.textContent = `${words} words`;

  charCount.classList.remove("warning", "over");

  if (characters > 200) {
    charCount.classList.add("over");
  } else if (characters > 180) {
    charCount.classList.add("warning");
  }
}

// Save the draft
function saveDraft() {
  localStorage.setItem(DRAFT_KEY, textarea.value);
}

// Restore the saved draft
const savedDraft = localStorage.getItem(DRAFT_KEY);

if (savedDraft !== null) {
  textarea.value = savedDraft;
}

// Update counts and save whenever the user types
textarea.addEventListener("input", () => {
  updateCounts();
  saveDraft();
});

// Clear the text and saved draft
function clearDraft() {
  textarea.value = "";
  localStorage.removeItem(DRAFT_KEY);
  updateCounts();
  textarea.focus();
}

clearBtn.addEventListener("click", clearDraft);

// Clear when Escape is pressed inside the textarea
textarea.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearDraft();
  }
});

// Restore the saved theme
const savedTheme = localStorage.getItem(THEME_KEY);

if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "Light mode";
}

// Switch between light and dark mode
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";

  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
});

// Set the correct counters when the page loads
updateCounts();
