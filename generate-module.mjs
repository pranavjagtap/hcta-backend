// generate-module.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const moduleName = process.argv[2];
if (!moduleName) {
  console.error("❌ Please provide a module name");
  process.exit(1);
}

const pascalName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

const files = [
  {
    path: `src/models/${moduleName}.ts`,
    content: `// ${pascalName} Model\nimport mongoose from "mongoose";\n\nconst ${moduleName}Schema = new mongoose.Schema({}, { timestamps: true });\n\nexport const ${pascalName} = mongoose.model("${pascalName}", ${moduleName}Schema);`,
  },
  {
    path: `src/types/${moduleName}.ts`,
    content: `// ${pascalName} Types\nexport interface ${pascalName}Input {\n  // define fields\n}`,
  },
  {
    path: `src/validators/${moduleName}.ts`,
    content: `// ${pascalName} Validator\nimport { z } from "zod";\n\nexport const ${moduleName}Schema = z.object({\n  // define validations\n});`,
  },
  {
    path: `src/services/${moduleName}.ts`,
    content: `// ${pascalName} Service\nexport const exampleService = async () => {\n  // service logic\n};`,
  },
  {
    path: `src/controllers/${moduleName}.ts`,
    content: `// ${pascalName} Controller\nimport { Request, Response } from "express";\n\nexport const exampleController = async (req: Request, res: Response) => {\n  res.send("Controller works!");\n};`,
  },
  {
    path: `src/routes/${moduleName}.ts`,
    content: `// ${pascalName} Routes\nimport { Router } from "express";\nimport { exampleController } from "../controllers/${moduleName}.controller";\nimport { authenticate } from "../middlewares/auth";\n\nconst router = Router();\nrouter.use(authenticate);\nrouter.get("/", exampleController);\n\nexport default router;`,
  },
];

for (const file of files) {
  const fullPath = path.join(__dirname, file.path);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, file.content);
  console.log(`✅ Created: ${file.path}`);
}

console.log("🎉 Module setup complete!");
