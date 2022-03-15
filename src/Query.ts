import Builder from "./Builder";
import Db, { ConnectionOptions } from "./Db";
import { isArray, isStr } from "./utils";

export class Query extends Builder {
    // // 数据库Connection对象实例
	private static connection: Db
    // 当前数据表前缀
	private prefix: string = ''

    private tables: string | Array<string> = ''

	// 当前数据表名称（不含前缀）
	private names: string | Array<string> = ''

    // 查询参数
	private options: any = {}

    constructor(config: ConnectionOptions) {
		super()
		this.prefix = config.prefix || ''
		Query.connection = Db.connect(config)
	}

    /**
	 *
	 * @param names 数据表名称  不含前缀  ("table1") (["table1 a", "table2 b"])
	 */
	public name(names: string | Array<string>): Query {
		this.options = {} //重置
		let table: string[] = this.options['table'] || []
		let alias: Record<string, any>= this.options['alias'] || {}
		this.names = names
		if (isStr(names)) {
			let _name: string = `${this.prefix}${names}`
			let split: string[] = (names as string).split(' ')
			if (split.length === 2) {
				_name = `${this.prefix}${split[0]}`
			}
			this.tables = _name
			if (!table.includes(_name)) {
				table.push(_name)
			}
		} else if (isArray(names)) {
			;(names as []).forEach((item) => {
				//['table1 a', 'table2 b'] ['table1', 'table2']
				let _name: string = `${this.prefix}${item}`
				let split: string[] = (item as string).split(' ')
				if (split.length === 2) {
					_name = `${this.prefix}${split[0]}`
					if (this.prefix && split[0].split(this.prefix).length !== 2) {
						//没有表前缀
						alias[split[1]] = this.prefix + split[0]
					}
				}
				if (!table.includes(_name)) {
					table.push(_name)
				}
			})
		}
		this.options['table'] = table
		this.options['alias'] = alias
		return this
	}
}