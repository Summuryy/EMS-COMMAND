import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = process.env;
export const config = Object.freeze({
  root,
  dataDir: path.resolve(env.EMS_DATA_DIR || path.join(root,'var')),
  publicDir: path.join(root,'public'),
  host: env.EMS_HOST || '127.0.0.1',
  port: Number(env.EMS_PORT || 4783),
  origin: env.EMS_ORIGIN || `http://127.0.0.1:${env.EMS_PORT || 4783}`,
  secureCookies: env.EMS_SECURE_COOKIES === '1',
  maxUpload: 12 * 1024 * 1024,
  ocrPath: env.EMS_TESSERACT_PATH || 'tesseract',
  ocrEnabled: env.EMS_DISABLE_OCR !== '1',
  maxPixels: 24_000_000
});
if (!Number.isInteger(config.port) || config.port < 1024 || config.port > 65535) throw Error('Некорректный EMS_PORT');
if (!['127.0.0.1','localhost','::1'].includes(config.host) && (!config.secureCookies || !config.origin.startsWith('https://'))) {
  throw Error('Внешний доступ разрешён только с EMS_ORIGIN=https://... и EMS_SECURE_COOKIES=1 за TLS reverse proxy.');
}
