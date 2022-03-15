import Db from './src/Db';
const connect = Db.connect({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'school',
})
connect.query('SELECT * FROM sc_admin')