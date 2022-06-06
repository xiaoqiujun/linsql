import Builder, {
	Alias,
	Field,
	Insert,
	Join,
	JoinType,
	Logic,
	Order,
	OrderType,
	QueryCollection,
	Table,
	Update,
	WhereOption,
	WhereQuery,
} from "./Builder";
import Db, { ConnectionOptions, Escape } from "./Db";
import { empty, isArray, isBool, isInt, isObj, isPrimitive, isStr, toKeys, toUpperCase } from "./utils";

export type RowRecord = {
	affectedRows:number
	insertId:number
}

export default class Query extends Builder {
	// // 数据库Connection对象实例
	private static connection: Db;
	// 当前数据表前缀
	private prefix: string = "";

	private tables: Table | Array<Table> = "";

	// 当前数据表名称（不含前缀）
	private names: Table | Array<Table> = "";

	// 查询参数
	private collection: Partial<QueryCollection> = {};

	constructor(config: ConnectionOptions) {
		super();
		this.prefix = config.prefix || ""; //保存前缀
		delete config.prefix; //删掉前缀
		Query.connection = Db.connect(config);
	}

	/**
	 * 选择表 不含好表前缀
	 * @param names 数据表名称  不含前缀  ("table1") (["table1 a", "table2 b"])
	 */
	public name(names: Table | Array<Table>): Query {
		this.collection = {}; //重置 防止 name().name()这样的链式调用
		let table: Table[] = this.collection.table || [];
		let alias: Alias = this.collection.alias || {};
		this.names = names;
		if (isStr(names)) {
			//只选择一张表查询
			let name: Table = `${this.prefix}${names}`;
			let split: string[] = (names as Table).split(/\s+/); //是否设置了别名
			if (split.length === 2) {
				name = `${this.prefix}${split[0]}`;
				alias[split[1]] = name;
			}
			this.tables = name;
			if (!table.includes(name)) table.push(name);
		} else if (isArray(names)) {
			//选择多张表
			(names as Array<Table>).forEach((item) => {
				//['table1 a', 'table2 b'] ['table1', 'table2']
				let name: Table = `${this.prefix}${item}`;
				let split: string[] = (item as string).split(/\s+/);
				if (split.length === 2) {
					name = `${this.prefix}${split[0]}`;
					if (this.prefix && split[0].split(this.prefix).length !== 2) {
						//name('table') 不包含表前缀的
						//没有表前缀
						alias[split[1]] = this.prefix + split[0];
					}
				}
				if (!table.includes(name)) table.push(name);
			});
		}
		this.collection.table = table;
		this.collection.alias = alias;
		return this;
	}

	/**
	 * 选择表
	 * @param names 数据表名称 含前缀
	 */
	public table(names: Table | Array<Table>): Query {
		this.collection = {}; //重置 防止 name().name()这样的链式调用
		let table: Table[] = this.collection.table || [];
		let alias: Alias = this.collection.alias || {};
		this.tables = names;

		if (isStr(names)) {
			let split: string[] = (names as Table).split(/\s+/); //是否设置了别名
			let name = names + "";
			if (split.length === 2) {
				name = split[0];
				alias[split[1]] = name;
			}
			if (!table.includes(name)) table.push(name);
		} else if (isArray(names)) {
			(names as Array<Table>).forEach((item) => {
				//['t_table1 a', 't_table2 b'] ['t_table1', 't_table2']
				let name: Table = item;
				let split: string[] = item.split(/\s+/);
				if (split.length === 2) {
					name = split[0];
					alias[split[1]] = split[0];
				}
				if (!table.includes(name)) table.push(name);
			});
		}
		this.collection.table = table;
		this.collection.alias = alias;
		return this;
	}

	/**
	 *
	 * @param fields 操作的字段
	 * @returns 返回要操作的字段
	 * 'id, name, description as desc'
	 */
	public field(fields: Field): Query {
		this.collection.field = fields;
		return this;
	}

	/**
	 * 查询和操作的数量
	 * @param star 开始
	 * @param end 结尾
	 * 1,10
	 */
	public limit(star: string | number, end?: number | undefined): Query {
		if (empty(end)) {
			let split: string[] = ("" + star).split(/\,\s*/);
			this.collection.limit = split.length === 1 ? split[0] : star + "";
		} else {
			this.collection.limit = `${star},${end}`;
		}
		return this;
	}

	/**
	 *
	 * @param fields 操作的字段 id,title
	 */
	public group(fields: string): Query {
		this.collection.group = fields;
		return this;
	}

	/**
	 * 设置表别名
	 * @param name 设置数据表别名 可以多个数据表
	 * 'a'  or {a:'table1'}
	 */
	public alias(names: string | Alias): Query {
		let alias: Alias = this.collection.alias || {};
		if (isStr(names) && isStr(this.tables) && isStr(this.names)) {
			//选择一个表的时候
			let table: Table = (this.tables ? (this.tables as string) : this.prefix + this.names) || "NOT TABLE";
			alias[names as string] = table;
		} else if (isObj(names)) {
			alias = names as Alias;
			const tables: Array<Table> = toKeys(names);
			tables.forEach((table) => {
				if (this.prefix && table.split(this.prefix).length !== 2) {
					//没有表前缀
					alias[names[table]] = this.prefix + table;
				} else {
					alias[names[table]] = table;
				}
			});
		}
		this.collection.alias = alias;
		return this;
	}

	/**
	 *
	 * @description DISTINCT 方法用于返回唯一不同的值
	 * @param {boolean} isDistinct
	 * @return {*}  {Query}
	 * @memberof Query
	 */
	public distinct(isDistinct: boolean): Query {
		this.collection.distinct = isDistinct;
		return this;
	}

	/**
	 *
	 * @param table 选择的表
	 * @param condition 表达式 a.name = b.name
	 * @param joinType 关联类型
	 * join("table1 a", "a.name = table2.name", "LEFT")
	 */
	public join(table: Table, condition: string, joinType: JoinType = "INNER"): Query {
		let split: string[] = table.split(/\s+/); //获取表
		let prefix: string[] = split[0].split(this.prefix); //前缀
		let alias: Alias = this.collection.alias || {};
		let join: Join = this.collection.join || {};
		let name: Table = "";
		if (prefix.length === 1) {
			//没有表前缀
			name = `${this.prefix}${split[0]}`; //加上前缀
		}
		if (split[1]) {
			//有别名才分配	之前别名配置会被后续调用的覆盖
			alias[split[1]] = name;
		}
		join[name] = [condition, joinType];
		this.collection.alias = alias;
		this.collection.join = join;
		return this;
	}

	/**
	 *
	 * @param orders 对操作的字段结果排序
	 * order({'username':'ASC'})
	 */
	public order(order: Record<Field, OrderType>): Query {
		this.collection.order = order;
		return this;
	}
	/**
	 *
	 * @param desc SQL语句中添加注释内容
	 * comment("说明")
	 */
	public comment(desc: string): Query {
		this.collection.comment = desc;
		return this;
	}

	/**
	 * @returns 返回只有一条结果的查询
	 */
	public async find<T = any>(): Promise<T> {
		this.collection.select = true;
		this.collection.limit = 1;
		const query: Escape = this.buildQuery(this.collection);
		const [rows]:[T] = await Query.connection.query(query.sql, query.values);
		this.clear();
		return rows;
	}
	/**
	 * @returns 返回多条结果的查询
	 */
	public async select<T extends object[]>(): Promise<T> {
		this.collection.select = true;
		const query: Escape = this.buildQuery(this.collection);
		const rows:T = await Query.connection.query(query.sql, query.values);
		this.clear();
		return rows;
	}
	/**
	 *
	 * @param field Update 传一个对象
	 * {
	 *    'name':"张三",
	 *    'age': 25,
	 *    'status':0
	 * }
	 * 更新数据
	 * @returns {number} 返回更新的id
	 */
	public async update(field: Update): Promise<number> {
		this.collection.update = field;
		const query: Escape = this.buildUpdate(this.collection, this.tables);
		const rows:RowRecord = await Query.connection.query(query.sql, query.values);
		this.clear();
		return rows.affectedRows || 0;
	}
	/**
	 * 删除数据
	 * @returns {number} 返回删除的id
	 */
	public async delete(): Promise<number> {
		this.collection.delete = true;
		const query: Escape = this.buildDelete(this.collection, this.tables);
		const rows:RowRecord = await Query.connection.query(query.sql, query.values);
		this.clear();
		return rows.affectedRows || 0;
	}
	/**
	 * 插入数据
	 * @returns {RowRecord} 
	 */
	public async insert(data: Insert | Array<Insert>): Promise<RowRecord> {
		this.collection.insert = data;
		const query: Escape = this.buildInsert(this.collection, this.tables);
		const rows:RowRecord = await Query.connection.query(query.sql, query.values);
		this.clear();
		return { affectedRows: rows.affectedRows || 0, insertId: rows.insertId || 0 };
	}
	public async insertGetId(data: Insert | Array<Insert>): Promise<number> {
		if (isArray(data)) data = data[0]; //insertGetId 只取一个
		try {
			const res: RowRecord = await this.insert(data);
			return res.insertId;
		} catch (err) {
			throw err;
		}
	}
	/**
	 *
	 * @param logic AND OR
	 * @param fields 查询的字段
	 * @param condition 条件
	 * ('id', 1) 等价于 id = 1
	 */
	private parseWhere(logic: Logic, fields: Field, condition: string | number): void;
	/**
	 *
	 * @param logic AND OR
	 * @param fields 查询的字段
	 * @param operator 表达式
	 * @param condition 条件
	 * ('id', '<>' 1) 等价于 id <> 1
	 */
	private parseWhere(logic: Logic, fields: Field, operator: string, condition: string | number): void;
	/**
	 *
	 * @param logic AND OR
	 * @param fields 查询的字段
	 * ({'id',1}) 等价于 id = 1  ({'id':['<>',1]}) 等价于 id <> 1
	 */
	private parseWhere(logic: Logic, fields: Record<string, WhereQuery>): void;
	/**
	 * @param logic 查询逻辑 AND | OR
	 * @param fields 查询的字段			'id'  id  {id:['=', 1]}
	 * @param operator 查询的表达式	1	<>
	 * @param condition 查询的条件	 ''   1 选填
	 */
	private parseWhere(
		logic: Logic,
		fields: Field | Record<string, WhereQuery>,
		operator?: string | number,
		condition?: string | string[] | number | number[]
	) {
		logic = logic || "AND";
		const wheres: WhereOption = {
			field: [],
			operator: {},
			condition: {},
			link: {},
			query: [],
			table: isStr(this.tables)
				? (this.tables as string)
				: isArray(this.tables)
				? (this.tables[0] as string)
				: "",
		};
		if (typeof fields === "string") {
			//字符串形式  where("id","<>", 1) where("id",1) where("table.id = table.id")
			if (operator === undefined && condition === undefined) {
				const query: string[] = wheres.query || [];
				if (query.length) query.push(logic, fields);
				else query.push(fields);
				wheres.query = query;
			} else {
				wheres.field.push(fields); //把字段保存起来
				let _operator: string = condition === undefined ? "=" : (operator as string);
				let _connection = condition === undefined ? operator : condition;
				wheres.operator[fields] = (wheres.operator[fields] || []).concat(_operator);
				wheres.condition[fields] = (wheres.condition[fields] || []).concat(_connection);
			}
		} else if (isObj(fields)) {
			//复杂形式 where({id:['>', 1]})
			// where({
			//     'name.id': ['<', 'config.id'],
			//     'name.key': 'config.key',
			// })
			// where({
			//     'name.id': [
			//         ['>', 'config.id'],
			//         ['=', 'config.key'],
			//     ],
			//     'name.key': [['>', 'config.id'], 'or', ['=', 'config.key']],
			// })
			const allFields: Field[] = toKeys(fields); //获取查询的所有字段
			allFields.forEach((field: Field) => {
				let value: WhereQuery = fields[field];
				if (field.indexOf(".") < 0) wheres.field.push(field);
				if (isStr(value) || isInt(value) || isBool(value)) value = [value]; //如果是基础类型 就把字符串转化成[]
				if (isArray(value) && Array<any>(value).length) {
					//值为数组
					if (empty(wheres.operator[field]) || !isArray(wheres.operator[field])) wheres.operator[field] = [];
					if (empty(wheres.condition[field]) || !isArray(wheres.condition[field])) wheres.condition[field] = [];
					if (empty(wheres.link[field]) || !isArray(wheres.link[field])) wheres.link[field] = [];
					switch (Array<any>(value).length) {
						case 1: //如果长度为1的数组 ['标题']
							wheres.operator[field].push("="); //表达式默认 =
							wheres.condition[field].push(value[0]);
							break;
						case 2: //长度为2的情况有两种
							if (isArray(value[0]) && isArray(value[1])) {
								//二维数组情况下 即是多个查询条件 [['like', 'JS%'], ['like', '%JS']]
								(value as []).forEach((v) => {
									let oper: string = toUpperCase(v[0]);
									wheres.operator[field].push(oper); //追加表达式
									wheres.condition[field].push(v[1]);
								});
								wheres.link[field].push("AND"); //追加一个 AND 语句  因为有多个查询条件
							} else if (isPrimitive(value[0]) && isPrimitive(value[1])) {
								//如果两个不是数组      ['>', 1]
								let oper: string = toUpperCase(value[0]);
								wheres.operator[field].push(oper); //追加表达式
								wheres.condition[field].push(value[1]);
							}
							break;
						case 3: //长度为3的情况下 [['like', 'JS%'], 'and', ['like', '%JS']]
							if (isArray(value[0]) && isArray(value[2]) && isStr(value[1])) {
								//中间一个是and或者or运算
								Array<any>(value).forEach((v) => {
									if (!isStr(v)) {
										let oper: string = toUpperCase(v[0]);
										wheres.operator[field].push(oper); //追加表达式
										wheres.condition[field].push(v[1]);
									} else {
										wheres.link[field].push(toUpperCase(v)); //追加 OR AND
									}
								});
							}
							break;
						default:
							break;
					}
				}
			});
		}
		let allQuery: Array<WhereOption> = this.collection.where || []; //所有的where查询
		if (allQuery.length) {
			if (!isArray(this.collection.link)) this.collection.link = [];
			this.collection.link?.push(logic);
		}
		allQuery.push(wheres);
		this.collection.where = allQuery;
	}

	/**
	 *
	 * @param fields 查询的字段
	 * @param condition 条件
	 * ('id', 1) 等价于 id = 1
	 */
	public whereOr(fields: Field, condition: string | number): Query;
	/**
	 *
	 * @param fields 查询的字段
	 * @param operator 表达式
	 * @param condition 条件
	 * ('id', '<>' 1) 等价于 id <> 1
	 */
	public whereOr(fields: Field, operator: string, condition: string | number): Query;
	/**
	 *
	 * @param fields 查询的字段
	 * ({'id',1}) 等价于 id = 1  ({'id':['<>',1]}) 等价于 id <> 1
	 */
	public whereOr(fields: Record<string, WhereQuery>): Query;
	/**
	 * @param fields 查询的字段			'id'  id  {id:['=', 1]}
	 * @param operator 查询的表达式	1	<>
	 * @param condition 查询的条件	 ''   1 选填
	 */
	public whereOr(
		field: string | Record<string, WhereQuery>,
		operator?: string | number | undefined,
		condition?: string | string[] | number | number[] | undefined
	): Query {
		if (operator === undefined && condition === undefined) {
			this.parseWhere("OR", <Record<string, WhereQuery>>field);
		} else if (condition === undefined && operator !== undefined) {
			this.parseWhere("OR", <string>field, <string | number>operator);
		} else {
			this.parseWhere("OR", <string>field, <string>operator, <string | number>condition);
		}
		return this;
	}
	/**
	 *
	 * @param fields 查询的字段
	 * @param condition 条件
	 * ('id', 1) 等价于 id = 1
	 */
	public where(fields: Field, condition: string | number): Query;
	/**
	 *
	 * @param fields 查询的字段
	 * @param operator 表达式
	 * @param condition 条件
	 * ('id', '<>' 1) 等价于 id <> 1
	 */
	public where(fields: Field, operator: string, condition: string | number): Query;
	/**
	 *
	 * @param fields 查询的字段
	 * ({'id',1}) 等价于 id = 1  ({'id':['<>',1]}) 等价于 id <> 1
	 */
	public where(fields: Record<string, WhereQuery>): Query;
	/**
	 * @param fields 查询的字段			'id'  id  {id:['=', 1]}
	 * @param operator 查询的表达式	1	<>
	 * @param condition 查询的条件	 ''   1 选填
	 */
	public where(
		field: string | Record<string, WhereQuery>,
		operator?: string | number | undefined,
		condition?: string | string[] | number | number[] | undefined
	): Query {
		if (operator === undefined && condition === undefined) {
			this.parseWhere("AND", <Record<string, WhereQuery>>field);
		} else if (condition === undefined && operator !== undefined) {
			this.parseWhere("AND", <string>field, <string | number>operator);
		} else {
			this.parseWhere("AND", <string>field, <string>operator, <string | number>condition);
		}
		return this;
	}

	public virtual() {
		
	}

	/**
	 * mysql.query
	 * @param sql mysql语句
	 * @returns Promise<{rows:any, fields:any}>
	 */
	public async query<T>(sql: string, values?:any[]): Promise<T> {
		if(values === undefined) {
			return await Query.connection.query<T>(sql);
		}else {
			return await Query.connection.query<T>(sql,values);
		}
	}

	/**
	 * mysql.exec
	 * @param sql mysql语句
	 * @param values 参数化
	 * @returns
	 */
	public async exec<T>(sql: string, values?: any[]): Promise<T> {
		if (values !== undefined) {
			return await Query.connection.exec<T>(sql, values);
		}
		return await Query.connection.exec<T>(sql);
	}
	public format(sql: string, values: any[]): string {
		return Query.connection.format({
			sql,
			values,
		});
	}
	private clear() {
		this.collection = {};
		this.names = "";
		this.tables = "";
	}
	public getAST(): Partial<QueryCollection> {
		return this.collection;
	}
	public getEscapMap(): Escape {
		const query: Escape = this.buildQuery(this.collection);
		return query
	}
}
