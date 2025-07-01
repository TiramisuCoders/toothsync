# 🦷 ToothSync - Capstone Project

ToothSync is a Next.js web application built as a capstone project. This guide explains how to set up the project using the **Visual Studio Code terminal**.

---

## 📦 Requirements

- [Node.js v18+](https://nodejs.org/)
- Visual Studio Code

---

## 🛠️ Setup Instructions (VS Code Terminal)

### 1. Open the Project Folder

1. Open **Visual Studio Code**.
2. Click **File > Open Folder**, and choose the cloned `ToothSync` project.

---

### 2. Open Terminal in VS Code

- Press <kbd>Ctrl</kbd> + <kbd>`</kbd> *(backtick)*  
  or  
- Click **Terminal > New Terminal**

---

### 3. Install Dependencies

In the terminal that opened at the bottom of VS Code, run:

```bash
npm install --legacy-peer-deps
````

> This will install all required packages and avoid React version conflicts.

---

### 4. Start the Development Server

Once installation is complete, run:

```bash
npm run dev
```

Then open your browser and go to:
👉 [http://localhost:3000](http://localhost:3000)

---

## ✅ Notes

* If you get an error like `'next' is not recognized`, it usually means `npm install` hasn't finished yet or was skipped.
* If you want better compatibility, you can downgrade React:

```bash
npm install react@18.2.0 react-dom@18.2.0
npm install
```

---

## 📁 Common VS Code Shortcuts

| Action               | Shortcut             |
| -------------------- | -------------------- |
| Open Terminal        | \`Ctrl + \`\`        |
| Format Code          | `Shift + Alt + F`    |
| Open Command Palette | `Ctrl + Shift + P`   |
| Install Extensions   | Go to Extensions tab |

---

## 📄 License

For educational use only. Not for production deployment.