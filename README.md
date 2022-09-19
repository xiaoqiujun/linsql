# linsql
使用TS封装node-mysql的常用操作，可链式调用，与ThinkPHP的查询器类似
部分功能还在优化


- [Install](#install)
- [Introduction](#introduction)
- [Jest](#jest)



## Install

```sh
npm install --save linsql
```


## Introduction


### 配置(CONFIG)
参数 | 说明 | 类型 | 默认值
-|--|--|--
host | 数据库的主机名 | `string`| 必填项
port| 要连接的端口号 | `string` | 3306
user| MySQL用户 | `string` | 必填项
password| MySQL用户的密码 | `string` | 必填项
database| 数据库名称 | `string` | 必填项
prefix| 数据库的前缀 | `string` | 可选

其他配置 [mysqljs/mysql](https://github.com/mysqljs/mysql#connection-options)

## 创建连接
```js
import linsql from 'linsql'
const db = linsql.connect({
	host: 'localhost',
	password: 'root',
	user: 'root',
	database: 'demo',
	prefix: 't_'
})
```

## 基本的查询
```js
import linsql from 'linsql'
const db = linsql.connect({
	host: 'localhost',
	password: 'root',
	user: 'root',
	database: 'school',
	prefix: 'sc_'
})
db.name('teacher').where('username', '').select().then(res => {
	//return [rows]
})
```

## Promise化
- ### select
	```js
	//select
	db.name('teacher').where('username', '').select().then(res => {})

	async function find() {
		let res = await db.name('teacher').where('username','').find()
	}
	```
- ### update
	```js
	db.name('teacher').where('username', '').update({
		username:'张三'
	}).then(res => {
		console.log(res) //return affected rows
	})
	```

- ### delete
	```js
	db.name('teacher').where('username', '').delete().then(res => {
		console.log(res) //return affected rows
	})
	```
- ### insert
	```js
	db
	.name('teacher')
	.insert([{
		username: '李四',
		create_time: new Date(),
	}])
	.then((res) => {
		console.log(res)	//return { affectedRows, insertId }
	})
	```
- ### insertGetId
	```js
	db
	.name('teacher')
	.insertGetId([{
		username: '李四',
		create_time: new Date(),
	}])
	.then((res) => {
		console.log(res)	//return insert Id
	})
	```
- ### query
	```js
	db.query("SELECT * FROM `sc_teacher` WHERE `username` = ''").then(res => {
		//return { affectedRows, insertId }
	})
	//PrepareStatement机制
	db.exec("SELECT * FROM `sc_teacher` WHERE `username` = ?", ['']).then(res => {
		//return { affectedRows, insertId }
	})
	```

## Methods

 - ### name (names: string | string[] ) 主要用于指定操作的数据表(不包含表前缀)
 	```js
	db.name('teacher').where('username', '').select()

	//SELECT * FROM `sc_teacher` WHERE `username` = ''
 	```
	### 选择多张表
	```js
	db.name(['teacher', 'student'])
	//SELECT * FROM t_teacher,t_student
	```
	### 设置表别名
	```js
	db.name(['teacher t', 'student s'])
	//SELECT * FROM t_teacher AS t,t_student AS s
	```

- ### table (names:string | string[] ) 主要用于指定操作的数据表(包含表前缀)
	```js
	db.table('sc_teacher').where('username', '').select()

	//SELECT * FROM `sc_teacher` WHERE `username` = ''
	```
	
- ### where (field:string|object, operator?:string|number, condition?:string|string[]|number|number[]) 用于数据查询
	- field 查询的字段 也可以是一段查询表达式 如: 'id is not null'
	- operator 查询表达式(不区分大小写)

		|表达式|说明|
		|-----|----|
		|`=` or `eq`|等于|
		|`>` or `gt`|大于|
		|`<` or `lt`|小于|
		|`>=` or `egt`|大于等于|
		|`<=` or `elt`|小于等于|
		|`<>` or `neq`|不等于|
		|`like`|模糊查询|
		|`between`|区间查询|
		|`not between`|不在区间查询|
		|`in`|in查询|
		|`not in`|不在in查询|
		|`null`|null查询|
		|`not null`|不是null查询|
		表达式还不支持时间, 后续迭代
	- condition 查询的条件
	```js
	//以下的查询都是等价的
	db.name('teacher').where('username = \'\'')
	db.name('teacher').where('username', '')
	db.name('teacher').where('username', '=', '')
	db.name('teacher').where({
		username:[''] // or username:''	默认是=表达式
	})
	db.name('teacher').where({
		username:['=', '']
	})

	//一个字段有多个条件情况下
	//like
	db.name('teacher').where('username', 'like', '%张')
	db.name('teacher').where({
		username:['like','%张']
	})
	//多个like查询
	db.name('teacher').where({
		username:[
			['like', '%张'],
			'or', // 'and'
			['like', '张%']
		]
	})
	db.name('teacher').where({
		id:[
			['>', 1],
			['<', 10]
		]
	})
	//等价于下面这个例子
	db.name('teacher').where({
		id:[
			['>',1],
			'and',
			['<', 10]
		]
	})

	//between查询
	db.name('teacher').where('id', 'between', [1,4])	//条件为数组
	db.name('teacher').where('id', 'not between', [1,4])

	//in查询
	db.name('teacher').where('id', 'in', [1,2,3])
	db.name('teacher').where('id', 'not in', [1,2,3])

	//null查询
	db.name('teacher').where('id', 'null')
	db.name('teacher').where('id', 'not null')
	```
- ### alias (names:string | object ) 用于设置当前的数据表的别名
	```js
	db.table('sc_teacher').alias('a').where('username', '').select()
	//SELECT * FROM `sc_teacher` WHERE `username` = ''
	db.table(['sc_teacher', 'sc_student']).alias({
		'sc_teacher':'a',
		'sc_student':'b'
	}).where('username', '').select()
	```
- ### field (fields:string ) 主要用于返回指定的字段
	```js
	db.table('sc_teacher').field('id,username,create_time').where('username', '').select()

	//SELECT id,username,create_time FROM `sc_teacher` WHERE `username` = ''
	```              
- ### limit (star:string|number,  end?:number) 主要用于分页操作
	```js
	db.table('sc_teacher').where('username', '').limit('1,5').select()
	db.table('sc_teacher').where('username', '').limit(1,5).select()
	//SELECT * FROM `sc_teacher` WHERE `username` = '' LIMIT 1,5
	``` 
- #### group (fields:string)
	```js
	db.table('sc_teacher').where('username', '').group('id').select()
	//SELECT * FROM `sc_teacher` WHERE `username` = '' GROUP BY id
	``` 
- ### distinct (isDistinct: boolean)
	```js
	db.table('sc_teacher').field('username').distinct(true).select()
	//SELECT DISTINCT username FROM `sc_teacher`
	``` 
- ### join (table: string, condition: string, joinType:sqlJoinType = 'INNER')
	```js
	type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
	db.table('sc_teacher').alias('a').join("sc_student b", "a.username = b.teacher_name").select()
	//SELECT * FROM sc_teacher a INNER JOIN sc_student b ON a.username = b.teacher_name

	db.table('sc_teacher').alias('a').where('username', '').join("sc_student b", "a.username = b.teacher_name").select()
	//SELECT * FROM sc_teacher a INNER JOIN sc_student b ON a.username = b.teacher_name WHERE a.username = ''
	```
- ### order (field: string)
	```js
	db.table('sc_teacher').where('username', '').order('id DESC').select()
	//SELECT * FROM sc_teacher a WHERE a.username = '' ORDER BY `id` DESC

	db.table('sc_teacher').where('username', '').order('id DESC, username ASC').select()
	//SELECT * FROM sc_teacher a WHERE a.username = '' ORDER BY `id` DESC, `username` ASC
	```
- ### comment (desc: string) 主要用于写注释,方便后续维护修改
	```js
	db.table('sc_teacher').comment("Query sc_teacher").where('username', '').select()
	//SELECT * FROM sc_teacher a WHERE a.username = ''  ##Query sc_teacher
	```
- ### transform (sql:string, values:any[]) 主要用于转换sql查询语句
	```js
	db.transform('SELECT * FROM sc_teacher a WHERE a.username = ?', [''])
	//SELECT * FROM sc_teacher a WHERE a.username = ''
	```
- ### parse () 解析查询器
	```js
	db.name('teacher').where('username', '').parse('prefix')
	//{
	//	sql:SELECT * FROM t_teacher WHERE `username` = ?,
	//	values:['']	
	//}
	```


## Jest

```sh
npm run test
```
- ### 例子
	```js
	const config = {
		host: '127.0.0.1',
		database: 'ormtype',
		user: 'root',
		password: 'root',
		prefix: 'sc_'
	}
	let db = Db.connect(config)
	describe('where查询 => table:teacher,condition:id = 1', () => {
		it('用例1:', () => {
			let data = {
				sql: 'SELECT * FROM `sc_teacher` WHERE `id` = ?',
				values:[1]
			} 
			db.name('teacher').where('id',1)
            let map = db.getEscapMap()
            expect(map).toEqual(data)
		})
	})
	```