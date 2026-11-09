import {db} from '../server/db.mjs';
process.stdout.write(db.prepare('SELECT COUNT(*) AS n FROM users WHERE role=?').get('admin').n?'YES':'NO');
db.close();
