import {
	toKeys,
	toValues,
	isArray,
	toUpperCase,
	each,
	has,
	toLowerCase,
    empty,
	isStr
} from './utils'
import {ParseCondition} from './Db';
export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
export type OrderType = "DESC" | "ASC"
export type Logic = 'AND' | 'OR'
export type WhereOption = {
    field:string[] //查询的字段
    operator:Record<string, string[]>    //表达式
    condition:Record<string, any> //查询条件
    link:Record<string, string[]> //连接符  AND OR 多字段查询
    query:string[]  //同个字段多条件查询
    table?:string   //选择的表
}
export type WhereQuery = string|number|Array<any>|Array<Array<any>>
export type Table = string
export type Alias = Record<string, string>
export type Join = Record<Table, [Connection, JoinType]>
export type Connection = string
export type Field = string
export type Limit = string | number
export type Group = string
export type Direction = boolean
export type Comment = string
export type Order = Record<Field, OrderType>
export type Update = Record<string, any>
export type Insert = Record<string, any>
export type QueryCollection = {
    table:Array<Table>
    alias:Alias
    where:Array<WhereOption>
    field:Field
    limit:Limit
    group:Group
    distinct:Direction
    join:Join
    order:Order
    select:boolean
    delete:boolean
    comment:Comment
    update:Update
    insert:Insert | Array<Insert>
	link:string[]  //
}
export default class Builder {
	private sql: string = ''
	protected resultCode: string = ''
	protected expMap: string[] = [] //操作符

	constructor() {
		;[
			'=,eq',
			'>,gt',
			'<,lt',
			'<>,neq',
			'<=,elt',
			'>=,egt',
			'like',
			'between',
			'not between',
			'in',
			'not in',
			'null',
			'not null',
		].forEach((key) => {
			let split = (key as string).split(',')
			;(split || []).forEach((v) => {
				if (!this.expMap.includes(v)) this.expMap.push(v)
			})
		})
	}
	/**
	 * 解析查询
	 */
	protected buildQuery($options: Partial<QueryCollection>): ParseCondition {
		let where: ParseCondition = this.buildWhere($options.where, $options.link, $options.alias)
		let table: string = this.buildTable($options.table || [], $options.alias || {})
		let field: string = this.buildField($options.field)
		let join: string = this.buildJoin($options.join || {}, $options.alias || {})
		let group: string = this.buildGroup($options.group)
		let order: string = this.buildOrder($options.order)
		let limit: string = this.buildLimit($options.limit)
		let distinct: string = $options.distinct === true ? 'DISTINCT' : ''
		let comment: string = $options.comment || ''
		const sql: string[] = [
			`SELECT`,
			`${distinct}`,
			`${field}`,
			`FROM`,
			`${table}`,
			`${join}`,
			`${where['sql']}`,
			`${order}`,
			`${group}`,
			`${limit}`,
			comment ? `##${comment}` : '',
		].filter((item) => item !== '')
		return {
			sql: sql.join(' '),
			values: where.values,
		}
	}
	/**
	 * 解析查询语句
	 */
	private buildWhere(whereOption: Array<WhereOption> = [], query: string[] = [], alias?:Record<string, any>): ParseCondition {
		const sqlMap: string[] = ['WHERE']  //拼接sql语句
		const exp: Record<string, string> = {
			eq: '=',
			neq: '<>',
			gt: '>',
			lt: '<',
			elt: '<=',
			egt: '>=',
		}
        type Data = Record<string, any>
		const aliasTable:string[] = toValues(alias || {})
		const values: any[] = [] //参数化
		whereOption.forEach((col, index) => {
			if(!col.table) throw new Error(`no select table`)
			let len: number = 0
			let field: string[] = col.field //获取字段
			let length: number = field.length
			let fiedlQuery: string[] = col.query
			let operator: Data = col.operator //获取表达式
			let condition: Data = col.condition//获取条件
			let links: Data = col.link //获取OR | AND  多个条件查询 id=1 or id=2
			fiedlQuery.forEach((v) => sqlMap.push(v))
			while (len < length) {
				let key: string = field[len]    //字段
				let linksOption: string[] = links[key] || []    //多个条件查询
				let conditionOption: string[] = condition[key] || []    //条件
				let operatorOption: string[] = operator[key] || []  //表达式
				let operatorLength: number = operatorOption.length
				let i: number = 0
				while (i < operatorLength) {
                    let symbol = toLowerCase(operatorOption[i]) //转成小写
                    let condition = conditionOption[i]  //查询条件
                    if(!this.expMap.includes(symbol)) throw new Error(`SQL Operator SyntaxError '${operatorOption[i]}'`)
					if (operatorLength >= 2 && i === 0) sqlMap.push('(') //多个表达式用()包含
					if (has(exp, symbol) && exp[symbol])
						operatorOption[i] = exp[symbol] //转换操作符
					if (!key.includes('.')) {   //可能存在table1.name
						let index:number = aliasTable.indexOf(col.table as string)    //找是否设置了表别名    table1.name 等价于 a.name
						if(index !== -1) {      //存在别名
							let keys:string[] = toKeys(alias || {})     //找到别名
                            let table:string = keys[index]
							table && sqlMap.push(`${table}.${key}`, toUpperCase(symbol), '?')    //相当于 a.name = ?
						}else { //不存在别名
							sqlMap.push(`\`${key}\``, toUpperCase(symbol), '?')         //table.name = ?
						}
					} else {
                        //存在table1.name 直接追加
						sqlMap.push(`${key}`, toUpperCase(symbol), '?')
					}
                    // 匹配是否有IN NOT IN 语句
					if (/IN|NOT IN/.test(toUpperCase(symbol))) {
                        //在追加语句末尾存在 ? 则改成(?) 使用IN NOT IN时, 条件是数组 [1,2,3]
						if (sqlMap[sqlMap.length - 1] === '?') sqlMap[sqlMap.length - 1] = '(?)'
						if (isArray(conditionOption)) values.push(conditionOption)
					} else if (/BETWEEN|NOT BETWEEN/.test(toUpperCase(operatorOption[i]))) {   //匹配是否有BETWEEN NOT BETWEEN 语句
						if (!isArray(conditionOption))  //查询条件必须是数组
							throw new Error(`${toUpperCase(symbol)} condition muse be array`)
						if (isArray(conditionOption) && conditionOption.length !== 2)
							throw new Error(`${toUpperCase(symbol)} Parameter is error`)
						each(conditionOption, (v, key) => {
							values.push([v])  //追加
						})
						if (sqlMap[sqlMap.length - 1] === '?') sqlMap[sqlMap.length - 1] = `? AND ?`
					} else if (/NULL|NOT NULL/.test(toUpperCase(String(condition)))) {      //相当于table1.name IS NULL
						sqlMap[sqlMap.length - 1] = toUpperCase(condition)
						sqlMap[sqlMap.length - 2] = 'IS'
					} else {    //其他情况
						if(isStr(condition) && condition.includes('.')) {
							let split = condition.split(/\./)
							if(has(alias, split[0]) && sqlMap[sqlMap.length - 1] === '?') {	//多表查询会用到 tabel1.id = table2.id
								sqlMap[sqlMap.length - 1] = condition
							}
						}else {
							values.push(condition !== '' ? condition : '')
						}
					}


					if (i === operatorLength - 1 && operatorLength >= 2) sqlMap.push(')')       //多个表达式时,用多个括号 (a = 1) AND (b = 2)
                    let link = links[i]     // AND OR
					if (link) sqlMap.push(link)
					else if (length >= 2 && i + 1 < operatorLength) sqlMap.push('AND') //一个字段多个条件
					i++
				}
				len++
				if (len < length) sqlMap.push('AND') //多个字段
			}
			if (query[index]) {
				if (['AND', 'OR'].includes(sqlMap[sqlMap.length - 1])) {    //语句末尾是否存在AND OR
					sqlMap[sqlMap.length - 1] = query[index]    //替换成字段多个查询
				} else {
					sqlMap.push(query[index])
				}
			}
		})
		if (sqlMap.lastIndexOf('AND') === sqlMap.length - 1 || sqlMap.lastIndexOf('OR') === sqlMap.length - 1) {
			sqlMap.splice(sqlMap.length - 1, 1)
		}
		return {
			sql: sqlMap.length === 1 ? '' : sqlMap.join(' '),   //格式化SELECT * table.name = ''
			values: values,
		}
	}
	/**
	 * @description 解析数据表
	 * @param table 数据表
	 * @param alias 数据表别名
	 */
	private buildTable(table: string[], alias: Record<string, any>): string {   //可能存在多张表
		const aliasTable: string[] = toKeys(alias)
		if (table.length) {
			aliasTable.forEach((item) => {
				let name: string = alias[item]
				let index: number = table.indexOf(name)
				if (index > -1) {
					table[index] = `${table[index]} AS ${item}`        //table1 a, table2 b
				}
			})
			return table.join(',')
		}
		return 'NOT TABLE'
	}

	/**
	 * @description 解析字段
	 */
	private buildField(fields: string = ''): string {
		if (empty(fields)) {
			return '*'
		}
		return fields
	}

	/**
	 * 关联查询
	 */
	private buildJoin(config: Record<string, any>, alias: Record<string, any>): string {
		let join: string = ''
		let table: string[] = toKeys(config)
		let aliasTable: string[] = toKeys(alias)
		each(table, (item) => {
			let name: string = item
			let condition: string = config[item][0]
			let joinType: string = config[item][1]
			let filter: string[] = aliasTable.filter((key) => table.includes(alias[key]))
			each(filter, (v) => {
				if (alias[v] === item) {
					name = `${item} ${v}`
				}
			})
			// name = `${item} ${filter[0]}`
			join += `${joinType} JOIN ${name} ON ${condition} `
		})
		return join
	}

	/**
	 * 解析group by
	 */
	private buildGroup(groups: string = ''): string {
		let group: string = 'GROUP BY '
		let map: string[] = []
		let split: string[] = groups.split(',')
		split.forEach((item: string) => {
			let key: string[] = item.split('.')
			let name: string = ''
			if (key.length === 2) {
				name = `\`${key[0]}\`.\`${key[1]}\``
			} else {
				name = `\`${key[0]}\``
			}
			if (!map.includes(name)) map.push(name)
		})
		group += `${map.join(',')}`
		return !groups ? '' : group
	}
	/**
	 * 解析order by
	 */
	private buildOrder(orders: Order = {}): string {
		let order: string = 'ORDER BY '
		let map: string[] = []
		let keys: string[] = toKeys(orders)
		keys.forEach((item: string) => {
			let key: string[] = item.split('.')
			let name: string = ''
			if (key.length === 2) {
				name = `\`${key[0]}\`.\`${key[1]}\``
			} else {
				name = `\`${key[0]}\``
			}
			if (!map.includes(name)) map.push(`${name} ${orders[item]}`)
		})
		order += `${map.join(',')}`
		return !orders || !keys.length ? '' : order
	}

	/**
	 * 解析limit
	 */
	private buildLimit(limits): string {
		let limit: string = 'LIMIT '
		limit += `${limits}`
		return !limits ? '' : limit
	}

	/**
	 * 解析插入数据
	 */
	protected buildInsert(options: Record<string, any>, table: string | string[]): ParseCondition {
		let currentTable:string = (isArray(table) ? table[0] : table) as string
		let insert: any = options.insert
		let comment: any = options.comment
		if (!isArray(insert)) insert = [insert]
		let fields: string[] = toKeys(insert[0])
		const dataMap: any[] = []
		;(insert as []).forEach((item) => {
			let keys: string[] = toKeys(item)
			let data: any[] = []
			keys.forEach((key) => {
				data.push(item[key])
			})
			dataMap.push(data)
		})
		let inserts: string = `INSERT INTO ${currentTable} (${fields.join(',')}) VALUES ?${comment ? ` ##${comment}` : ''}`
		return {
			sql: inserts,
			values: [dataMap],
		}
	}

	/**
	 * 解析更新数据
	 */
	protected buildUpdate(options: any, table: string | string[]): ParseCondition {
		const update: Record<string, any> = options.update
		const where: ParseCondition = this.buildWhere(options.where, options.link)
		if (!where.sql) return { sql: '', values: [] }
		const keys: string[] = toKeys(update)
        let currentTable:string = (isArray(table) ? table[0] : table) as string
		let sql: string[] = ['UPDATE', currentTable, 'SET']
		let values: any[] = []
		let field: string[] = []
		each(keys, (key) => {
			field.push(`${key} = ?`)
			values.push(update[key])
		})
		sql = sql.concat(field.join(','), where['sql'])
		values = values.concat(where.values)
		return {
			sql: sql.join(' '),
			values: values,
		}
	}
	/**
	 * 解析删除
	 */
	protected buildDelete(options: any, table: string | string[]): ParseCondition {
		const where: ParseCondition = this.buildWhere(options.where, options.link)
		if (!where.sql) return { sql: '', values: [] }
        let currentTable:string = (isArray(table) ? table[0] : table) as string
		let sql: string[] = ['DELETE', 'FROM',currentTable]

		sql.push(where['sql'])
		return {
			sql: sql.join(' '),
			values: where.values,
		}
	}
}
