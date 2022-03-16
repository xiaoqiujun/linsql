import { text } from 'node:stream/consumers';
import Query from '../src/Query';
const db = new Query({
    host: "localhost",
    user: "root",
    password: "root",
    database: "school",
    prefix:"t_"
});
describe('Query', () => {
    it('table name', () => {
        db.name('table1 a')
        expect(db.getAST().table).toEqual(['t_table1']);
        expect(db.getAST().alias).toEqual({a:'t_table1'});
    })
    test('table names', () => {
        db.name(['table1 a', 'table2 b']).name('table3')
        console.log(db.getAST())
        expect(db.getAST().table).toEqual(['t_table3']);
        expect(db.getAST().alias).toEqual({});
    })
})
