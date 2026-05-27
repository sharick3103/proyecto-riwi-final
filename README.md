# RiwiFlow - Kanban Task Management System

RiwiFlow is a professional Single Page Application (SPA) designed to manage task workflows using a Kanban board. It allows different user roles (Admin and Coder) to organize, track, and update the status of tasks in real-time.

## 🎯 Project Objective
The goal of the application is to provide a visual workspace where users can manage the flow of work through four main stages: **To Do**, **In Progress**, **In Review**, and **Done**.

---

## 🛠 Installation & Setup

To run this project locally, you will need **Node.js** installed on your machine.

### 1. Install Dependencies
Open your terminal in the project root folder and run the following command to install the required development tools (including `json-server`):

```bash
npm install
```

### 2. Start the Backend Server
The application relies on a simulated REST API to manage the data stored in `db.json`. Start the server by running:

```bash
npm start
```
*Alternatively, you can use: `npx json-server --watch db.json --port 3000`*

**Note:** Keep this terminal window open. The server must be running for the application to load and save data.

### 3. Launch the Application
Once the server is active:
- Navigate to the project root folder.
- Open the `index.html` file in any modern web browser (Chrome, Firefox, Edge).

-

## 👥 User Roles & Permissions

The system implements Role-Based Access Control (RBAC) to manage permissions:

| Role | Permissions |
| :--- | :--- |
| **Admin** | Full access: can create new tasks, edit any task, and assign tasks to users. |
| **Coder** | Restricted access: can view all tasks and edit only those specifically assigned to them. |

---

## 📁 Project Structure

proyecto-sharick/
├── node_modules/          # External libraries & dependencies
├── src/                   # Application source code
│   ├── components/        # Reusable UI components
│   │   ├── taskCard.js    # Task card layout and logic
│   │   ├── taskModal.js   # Task creation and edit modal
│   │   └── toast.js       # Notification system
│   ├── views/             # Page views and rendering
│   │   ├── board.js       # Kanban board view logic
│   │   └── login.js       # Login view logic
│   ├── api.js             # API client for data communication
│   ├── app.js             # Application entry point
│   ├── auth.js            # Session and role management
│   └── router.js          # SPA routing and navigation
├── db.json                # Local JSON database
├── index.html            # Main application entry point
├── package.json           # Project metadata and scripts
├── package-lock.json      # Exact dependency versions
└── README.md              # Project documentation and setup guide
```

## 🚀 Quick Start Tips
- **Authentication:** Use the credentials found in `db.json` to log in.
- **Kanban Flow:** Use the "Edit" button on any task card to change its status and move it between columns.
- **Data Persistence:** All changes are saved automatically to `db.json` via the API.
