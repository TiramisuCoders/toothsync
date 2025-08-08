import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export async function POST(req: NextRequest) {
  console.log("API route /api/upload-csv received a request.");
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("No file uploaded.");
      return NextResponse.json({ message: "No file uploaded." }, { status: 400 });
    }

    console.log(`File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const tempPath = path.join(os.tmpdir(), tempFileName);

    console.log(`Attempting to save file to temporary path: ${tempPath}`);
    fs.writeFileSync(tempPath, buffer);
    console.log("File saved successfully to temp path.");

    const pythonScriptPath = path.join(process.cwd(), "etl", "main.py");
    console.log(`Looking for Python script at: ${pythonScriptPath}`);

    if (!fs.existsSync(pythonScriptPath)) {
      console.error("Python ETL script not found at specified path.");
      fs.unlinkSync(tempPath);
      return NextResponse.json({ message: "Python ETL script not found on server." }, { status: 500 });
    }

    const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python3';
    console.log(`DEBUG: process.env.PYTHON_EXECUTABLE is: ${process.env.PYTHON_EXECUTABLE}`);
    // --- ADDED THESE NEW DEBUG LOGS ---
    console.log(`DEBUG: process.env.NEXT_PUBLIC_SUPABASE_URL is: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET'}`);
    console.log(`DEBUG: process.env.SUPABASE_SERVICE_ROLE_KEY is: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'}`);
    // --- END NEW DEBUG LOGS ---
    console.log(`Spawning Python process using interpreter: ${pythonExecutable}`);

    const pythonEnv = {
      ...process.env, // Inherit all existing environment variables
      PYTHONUNBUFFERED: "1", // Ensure unbuffered output for real-time logs
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL, // Pass Supabase URL
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY, // Pass Supabase Service Role Key
    };

    const result = await new Promise<string>((resolve, reject) => {
      const python = spawn(pythonExecutable, [pythonScriptPath, tempPath], {
        env: pythonEnv, // Use the new pythonEnv object
      });

      let stdout = "";
      let stderr = "";

      python.stdout.on("data", (data) => {
        stdout += data.toString();
        console.log("Python stdout chunk:", data.toString().trim());
      });
      python.stderr.on("data", (data) => {
        stderr += data.toString();
        console.error("Python stderr chunk:", data.toString().trim());
      });

      python.on("close", (code) => {
        console.log(`Python process closed with exit code: ${code}`);
        fs.unlink(tempPath, (err) => {
          if (err) console.error("Failed to delete temp file:", err);
          else console.log("Temporary file deleted successfully.");
        });

        if (code === 0) {
          console.log("Python script succeeded. Full stdout:", stdout.trim());
          resolve(stdout.trim());
        } else {
          console.error("Python script failed. Full stderr:", stderr.trim());
          reject(stderr.trim() || "ETL script failed with an unknown error.");
        }
      });

      python.on("error", (err) => {
        console.error("Failed to spawn Python process:", err.message);
        fs.unlink(tempPath, (unlinkErr) => {
          if (unlinkErr) console.error("Failed to delete temp file on spawn error:", unlinkErr);
        });
        reject("Python execution failed: " + err.message);
      });
    });

    console.log("Python script execution completed. Returning success JSON response.");
    return NextResponse.json({ message: `Success:\n${result}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    console.error("Upload error caught in API route's catch block:", message);
    return NextResponse.json({ message: `Server error: ${message}` }, { status: 500 });
  }
}
