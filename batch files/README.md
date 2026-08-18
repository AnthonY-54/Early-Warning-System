## What is a Batch File (.bat)?

A text file containing shell commands that execute sequentially when opened. Simply running the file automatically executes the script inside without requiring manual command input.

## Purpose in This Project

This batch file - start-dwdm.bat - automates the development workflow by simultaneously starting both the **backend** and **frontend** servers on your local machine. It eliminates the need to manually open terminals and run commands, improving developer convenience.

### What It Does

When you run `start-dwdm.bat`, it:

1. Opens the **Backend Server** in a new terminal window and runs `npm run dev` from the `backend` folder
2. Opens the **Frontend Server** in a new terminal window and runs `npm run dev` from the `frontend` folder
3. Displays both server URLs for quick access



### How to Use

1. **Place** this file in the ROOT directory of your project (same level as the `backend` and `frontend` folders)
2. **Double-click** the file to run it (or execute from a terminal)
3. **Wait** for both server windows to open and initialize
4. **Stop** by closing the terminal windows or pressing `Ctrl+C` in each window

\---

**Note**: The script uses `%\~dp0` to reference the script's location, making it work regardless of where you run it from.

