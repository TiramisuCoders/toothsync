# 🦷 ToothSync - Capstone Project

ToothSync is a web-based system developed using **Next.js**, **Tailwind CSS**, and **TypeScript**. It is designed to support clinical operations in a dentistry laboratory. This guide helps your group set up and run the project using **GitHub Desktop**, **PowerShell**, and **Visual Studio Code** on Windows.

---

## 📦 Requirements

Ensure each team member has the following installed:

- ✅ [Node.js (v18 or later)](https://nodejs.org/)
- ✅ [Visual Studio Code](https://code.visualstudio.com/)
- ✅ [GitHub Desktop](https://desktop.github.com/)
- ✅ [Git CLI](https://git-scm.com/) *(optional but helpful)*

---

## 🛠️ Project Setup (PowerShell)

### 1. Clone the Repository

1. Open **GitHub Desktop**
2. Click **File > Clone Repository...**
3. Paste the GitHub repo link
4. Choose a local path (e.g., `D:\UST\Capstone\toothsync`)
5. Click **Clone**

---

### 2. Open in VS Code

In GitHub Desktop, click **"Open in Visual Studio Code"**  
—or manually open the cloned `toothsync` folder in VS Code.

---

### 3. Clean Project (Recommended)

In the **PowerShell terminal** inside VS Code:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm cache clean --force
````

---

### 4. Install Dependencies

```powershell
npm install
```

---

### 5. Start Development Server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ✅ Tailwind CSS Check

Open `app/page.tsx` and paste this:

```tsx
<div className="text-3xl font-bold text-red-500">
  If this is red and bold, Tailwind is working!
</div>
```

---

## 📁 Folder Structure

```
toothsync/
├── app/              → Main routing pages
├── public/           → Assets like favicon.ico
├── styles/
│   └── globals.css   → Tailwind base file
├── tailwind.config.js
├── postcss.config.js
├── package.json
```

✅ Ensure `globals.css` contains:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## ⚙️ Helpful PowerShell Commands

| Action                   | Command                                    |
| ------------------------ | ------------------------------------------ |
| Clean cache              | `npm cache clean --force`                  |
| Remove old dependencies  | `Remove-Item -Recurse -Force node_modules` |
| Delete lock file         | `Remove-Item -Force package-lock.json`     |
| Install dependencies     | `npm install`                              |
| Start development server | `npm run dev`                              |

---

## 🧠 GitHub Collaboration Tips

* Always run `git pull` before making changes
* Commit regularly with short clear messages
* Use GitHub Desktop or run:

  ```bash
  git add .
  git commit -m "Add feature XYZ"
  git push origin main
  ```

---

## 🧪 Common Fixes

* ❌ **Tailwind styles not working**

  * Make sure `globals.css` is imported in `app/layout.tsx`
  * Confirm `tailwind.config.js` and `postcss.config.js` exist

* ❌ **Command not found (e.g., `tailwindcss`)**

  * Reinstall with:
    `npm install -D tailwindcss postcss autoprefixer`
  * Then run:
    `npx tailwindcss init -p`

* ❌ **Module casing issues**

  * Check folder names: `ToothSync` vs `toothsync` (Windows is case-insensitive, but tools are not)

---

## 📄 License

This project is for educational purposes only and was developed as part of a university capstone.
