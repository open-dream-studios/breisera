import { spawn } from "child_process";

export const usePython = async (input, inputType, fileName) => {
  function runPythonScript(input, fileName) {
    return new Promise((resolve, reject) => {
      const py = spawn("python3", [fileName, input]);

      let data = "";
      let error = "";

      py.stdout.on("data", (chunk) => {
        data += chunk.toString();
      });

      py.stderr.on("data", (chunk) => {
        error += chunk.toString();
      });

      py.on("close", (code) => {
        if (code === 0) {
          resolve(data.trim());
        } else {
          reject(new Error(`Python script exited with code ${code}: ${error}`));
        }
      });
    });
  }

  if (inputType === "string") {
    try {
      const result = await runPythonScript(input, "python/" + fileName);
      return result;
    } catch (err) {
      console.error("Python error:", err);
      return false;
    }
  } else {
    return false;
  }
};
