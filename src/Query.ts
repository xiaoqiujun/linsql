import Builder, { Alias, QueryAST, Table } from "./Builder";
import Db, { ConnectionOptions } from "./Db";
import { isArray, isStr } from "./utils";

export default class Query extends Builder {
    // // 数据库Connection对象实例
	private static connection: Db
    // 当前数据表前缀
	private prefix: string = ''

    private tables: Table | Array<Table> = ''

	// 当前数据表名称（不含前缀）
	private names: Table | Array<Table> = ''

    // 查询参数
	private ast: Partial<QueryAST> = {}

    constructor(config: ConnectionOptions) {
		super()
		this.prefix = config.prefix || ''	//保存前缀
		delete config.prefix	//删掉前缀
		Query.connection = Db.connect(config)
	}

    /**
	 *
	 * @param names 数据表名称  不含前缀  ("table1") (["table1 a", "table2 b"])
	 */
	public name(names: Table | Array<Table>): Query {
		this.ast = {} //重置 防止 name().name()这样的链式调用
		let table: Table[] = this.ast.table || []
		let alias: Alias = this.ast.alias || {}
		this.names = names
		if (isStr(names)) {	//只选择一张表查询
			let name:Table = `${this.prefix}${names}`
			let split: string[] = (names as Table).split(' ')	//是否设置了别名
			if (split.length === 2) {
				name = `${this.prefix}${split[0]}`
				alias[split[1]] = name
			}
			this.tables = name
			if (!table.includes(name)) table.push(name)
		} else if (isArray(names)) {	//选择多张表
			;(names as Array<Table>).forEach((item) => {
				//['table1 a', 'table2 b'] ['table1', 'table2']
				let name: Table = `${this.prefix}${item}`
				let split: string[] = (item as string).split(' ')
				if (split.length === 2) {
					name = `${this.prefix}${split[0]}`
					if (this.prefix && split[0].split(this.prefix).length !== 2) {	//name('table') 不包含表前缀的
						//没有表前缀
						alias[split[1]] = this.prefix + split[0]
					}
				}
				if (!table.includes(name)) table.push(name)
			})
		}
		this.ast.table = table
		this.ast.alias = alias
		return this
	}

	public getAST():Partial<QueryAST> {
		return this.ast
	}
}