import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const envCandidates = [
    path.resolve(moduleDir, '../../../.env'),
    path.resolve(moduleDir, '../../.env'),
    path.resolve(process.cwd(), '.env'),
];
for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        break;
    }
}
//# sourceMappingURL=load-env.js.map