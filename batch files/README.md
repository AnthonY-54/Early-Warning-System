## What is a Batch File (.bat)?

A text file containing shell commands that execute sequentially when opened. Simply running the file automatically executes the script inside without requiring manual command input.

## Batch Files in This Project

### 1. `start-dwdm.bat` (Frontend + Backend)
Starts the standard web application stack:
- **Backend Server** (`http://localhost:5000`)
- **Frontend Server** (`http://localhost:5173`)

### 2. `start-dwdm-all.bat` (Frontend + Backend + Python ML Service)
Starts the full stack including the machine learning prediction engine:
- **Python FastAPI ML Service** (`http://localhost:8000`)
- **Backend Server** (`http://localhost:5000`)
- **Frontend Server** (`http://localhost:5173`)

---

### How to Use

1. **Double-click** either batch file from the root directory (or run from a terminal).
2. **Wait** for the terminal windows to open and initialize.
3. **Stop** by closing the terminal windows or pressing `Ctrl+C` in each window.

---

**Note**: The scripts use `%~dp0` to reference their location dynamically. Local root copies are ignored by Git via `.gitignore`.


