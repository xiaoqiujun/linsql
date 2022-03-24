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
        expect(db.getAST().table).toEqual(['t_table3']);
        expect(db.getAST().alias).toEqual({});
    })
    test('db.name(["table1"]).where("id",1) 监测生成table1.id = 1', () => {
        db.name(['table1']).where('id',1)
        console.log(db.getEscapMap())
        const map = db.getEscapMap()
        expect(map.sql).toBe("SELECT * FROM t_table1 WHERE `id` = ?")
    })

    test("db.name('admin').where({username: '1',})", () => {
        db.name('admin').where({
            username: "1",
        })
        console.log(db.getEscapMap())
        const map = db.getEscapMap()
        expect(map.sql).toBe("SELECT * FROM t_admin WHERE `username` = ?")
    })
})
