# TaskPro - Full-Stack Task Management Application

A modern, responsive, and full-stack task management application built with Django and vanilla JavaScript. TaskPro allows users to register, log in, and manage personal tasks in a clean, intuitive interface.

[TaskPro Demo](https://drive.google.com/file/d/1hE4J06iH3e2SfvgnRbX42yVyZoE-FJZP/view?usp=drive_link)
---

## 🚀 Key Features

* **Secure JWT Authentication:** Users can register and log in securely using JSON Web Tokens. Login is supported with either username or email.
* **Full CRUD Functionality:** Create, Read, Update, and Delete tasks seamlessly without page reloads.
* **Single-Page Application (SPA):** A fast, modern user experience powered by client-side routing with the History API. No page refreshes!
* **Dynamic Filtering & Searching:** Instantly filter tasks by status (All, Pending, Completed) and search tasks by title.
* **Professional UI/UX:** Built with Tailwind CSS, featuring a custom landing page, animated modals, and toast notifications for user feedback.


### Prerequisites
* Python 3.10+
* MySQL Server
* Git

**Run the development server:**
    ```sh
    python manage.py runserver
    ```
    The application will be available at `http://127.0.0.1:8000/`.