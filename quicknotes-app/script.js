
const noteForm = document.querySelector("#note-form");
const noteInput = document.querySelector("#note-input");
const categorySelect = document.querySelector("#category-select");
const notesList = document.querySelector("#notes-list");
const noteCount = document.querySelector("#note-count");
const errorMessage = document.querySelector("#error-message");
const searchInput = document.querySelector("#search-input");

const STORAGE_KEY = "quicknotes-notes";

let notes = [];

// Save notes in the browser
function saveNotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// Display notes and update the count
function renderNotes() {
  notesList.innerHTML = "";

  const searchTerm = searchInput.value.trim().toLowerCase();

  const filteredNotes = notes.filter((note) =>
    note.text.toLowerCase().includes(searchTerm)
  );

  if (filteredNotes.length === 0 && searchTerm !== "") {
    const message = document.createElement("li");
    message.textContent = "No notes match your search.";
    notesList.appendChild(message);
  } else {
    filteredNotes.forEach((note) => {
      const noteCard = document.createElement("li");
      noteCard.classList.add(
        "note-card",
        `category-${note.category.toLowerCase()}`
      );

      const noteText = document.createElement("p");
      noteText.textContent = note.text;

      const categoryLabel = document.createElement("span");
      categoryLabel.classList.add("category-label");
      categoryLabel.textContent = note.category;

      const noteDate = document.createElement("span");
      noteDate.classList.add("note-date");
      noteDate.textContent = note.createdAt;

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("delete-btn");
      deleteButton.textContent = "Delete";
      deleteButton.type = "button";

      deleteButton.addEventListener("click", () => {
        notes = notes.filter((item) => item.id !== note.id);
        saveNotes();
        renderNotes();
      });

      noteCard.append(
        noteText,
        categoryLabel,
        noteDate,
        deleteButton
      );

      notesList.appendChild(noteCard);
    });
  }

  if (notes.length === 0) {
    noteCount.textContent = "You have no notes yet.";
  } else if (notes.length === 1) {
    noteCount.textContent = "You have 1 note.";
  } else {
    noteCount.textContent = `You have ${notes.length} notes.`;
  }
}

// Add a new note
noteForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = noteInput.value.trim();
  const category = categorySelect.value;

  if (text === "") {
    errorMessage.textContent = "Please type a note first.";
    return;
  }

  if (text.length > 200) {
    errorMessage.textContent =
      "Notes must be 200 characters or fewer.";
    return;
  }

  errorMessage.textContent = "";

  const note = {
    id: Date.now() + Math.random(),
    text: text,
    category: category,
    createdAt: new Date().toLocaleString()
  };

  notes.push(note);
  saveNotes();

  noteInput.value = "";
  renderNotes();
});

// Search notes as the user types
searchInput.addEventListener("input", renderNotes);

// Load saved notes when the page opens
try {
  const savedNotes = localStorage.getItem(STORAGE_KEY);

  if (savedNotes !== null) {
    const parsedNotes = JSON.parse(savedNotes);

    if (Array.isArray(parsedNotes)) {
      notes = parsedNotes;
    }
  }
} catch (error) {
  console.error("Could not load saved notes:", error);
}

renderNotes();
