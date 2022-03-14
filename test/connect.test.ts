import Db from '../src/Db';
describe('连接mysql', () => {
	it("example_1:", () => {
        const connect = Db.connect({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'school',
            charset:"utf8_general_ci"
        })
        console.log(connect)
	})
})
