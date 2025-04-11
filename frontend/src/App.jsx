import React, { useEffect, useState } from "react";
import styles from "./App.module.css";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const App = () => {
  const [tasks, setTasks] = useState({});
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [newCategoryMode, setNewCategoryMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [editing, setEditing] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const fetchTasks = async () => {
    const res = await fetch("http://127.0.0.1:8000/tasks");
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    fetchTasks();
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const getAllCategories = () => Object.keys(tasks);

  const handleAdd = async () => {
    const finalCategory = newCategoryMode ? customCategory : category;
    if (!text || !finalCategory) return;

    await fetch("http://127.0.0.1:8000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, category: finalCategory }),
    });

    setText("");
    setCategory("");
    setCustomCategory("");
    setNewCategoryMode(false);
    fetchTasks();
  };

  const handleVoice = () => {
    if (!recognition) return alert("Speech recognition not supported.");
    const recog = new recognition();
    recog.lang = "en-US";
    recog.onstart = () => setIsListening(true);
    recog.onend = () => setIsListening(false);
    recog.onresult = (e) => setText(e.results[0][0].transcript);
    recog.start();
  };

  const handleDelete = async (cat, index) => {
    tasks[cat].splice(index, 1);
    await fetch("http://127.0.0.1:8000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tasks),
    });
    fetchTasks();
  };

  const handleEdit = (cat, index) => {
    setEditing({ cat, index });
    setText(tasks[cat][index]);
    setCategory(cat);
  };

  const handleUpdate = async () => {
    const finalCategory = newCategoryMode ? customCategory : category;
    if (!editing || !finalCategory) return;

    const updatedTasks = { ...tasks };
    updatedTasks[editing.cat][editing.index] = text;

    await fetch("http://127.0.0.1:8000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTasks),
    });

    setEditing(null);
    setText("");
    setCategory("");
    setCustomCategory("");
    setNewCategoryMode(false);
    fetchTasks();
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const cat = source.droppableId;

    const reordered = Array.from(tasks[cat]);
    const [moved] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, moved);

    const updated = { ...tasks, [cat]: reordered };
    await fetch("http://127.0.0.1:8000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    fetchTasks();
  };

  return (
    <div className={styles.container}>
      <div className={styles.themeToggle}>
        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "🌞" : "🌙"}
        </button>
      </div>

      <h1 className={styles.title}>🎤 Voice To-Do Manager</h1>
      <p className={styles.subtitle}>Organize, speak, drag, check & edit!</p>

      <div className={styles.inputGroup}>
        <input
          placeholder="Task"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={styles.input}
        />

        <select
          className={styles.input}
          value={category}
          onChange={(e) => {
            if (e.target.value === "__new__") {
              setNewCategoryMode(true);
              setCategory("");
            } else {
              setNewCategoryMode(false);
              setCategory(e.target.value);
            }
          }}
        >
          <option value="">-- Select Category --</option>
          {getAllCategories().map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          <option value="__new__">➕ Add new category</option>
        </select>

        {newCategoryMode && (
          <input
            type="text"
            className={styles.input}
            placeholder="New category name"
            value={customCategory}
            onChange={(e) => {
              setCustomCategory(e.target.value);
              setCategory(e.target.value);
            }}
          />
        )}

        <button
          onClick={editing ? handleUpdate : handleAdd}
          className={styles.button}
        >
          {editing ? "💾 Update" : "➕ Add"}
        </button>
        <button
          onClick={handleVoice}
          className={styles.button}
          style={{ backgroundColor: isListening ? "#e74c3c" : undefined }}
        >
          {isListening ? "🎧 Listening" : "🎙️ Speak"}
        </button>
      </div>

      <div className={styles.taskColumn}>
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.entries(tasks).map(([cat, items]) => (
            <div key={cat} className={styles.card}>
              <h3 className={styles.cardTitle}>{cat}</h3>
              <Droppable droppableId={cat}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {items.map((task, i) => (
                      <Draggable key={`${cat}-${i}`} draggableId={`${cat}-${i}`} index={i}>
                        {(provided) => (
                          <div
                            className={styles.taskItem}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
                              <input type="checkbox" className={styles.checkbox} />
                              <input
                                readOnly
                                className={styles.taskInput}
                                value={task}
                              />
                            </div>
                            <div className={styles.taskActions}>
                              <button onClick={() => handleEdit(cat, i)}>✏️</button>
                              <button onClick={() => handleDelete(cat, i)}>🗑️</button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
};

export default App;
