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
        expect(db.getCollection().table).toEqual(['t_table1']);
        expect(db.getCollection().alias).toEqual({a:'t_table1'});
    })
    test('table names', () => {
        db.name(['table1 a', 'table2 b']).name('table3')
        expect(db.getCollection().table).toEqual(['t_table3']);
        expect(db.getCollection().alias).toEqual({});
    })
    test('db.name(["table1"]).where("id",1) 监测生成table1.id = 1', () => {
        db.name(['table1']).where('id',1)
        console.log(db.parse())
        const map = db.parse()
        expect(map.sql).toBe("SELECT * FROM t_table1 WHERE `id` = ?")
    })

    test("db.name('admin').where({username: '1',})", () => {
        db.name('admin').where({
            username: "1",
        })
        console.log(db.parse())
        const map = db.parse()
        expect(map.sql).toBe("SELECT * FROM t_admin WHERE `username` = ?")
    })

    test("多张表查询", () => {
        db.name(['admin_pool t1', 'admin t2']).field(`t1.pool_id as pool_id`).where({
            't1.admin_id':'t2.id',
            't2.id':1
        })
        console.log(db.parse())
        const map = db.parse()
        expect(map.sql).toBe("SELECT t1.pool_id as pool_id FROM t_admin_pool t1,t_admin t2 WHERE t1.admin_id = t2.id AND t2.id = ?")
    })
})
