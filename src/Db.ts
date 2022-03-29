import  mysql, { Pool, PoolOptions } from 'mysql2'
import { empty, isStr } from './utils'
export interface BasePoolOptions {
	// acquireTimeout?: number //连接池超时毫秒数 默认 10000
	waitForConnections?: boolean    //指定连接池在没有可用连接、连接数已达到限制时的操作 true
	connectionLimit?: number //一次允许创建的最大连接数 10
	queueLimit?: number //连接池允许排队的最大连接请求数 0
}

export interface BaseDbOptions {
	host: string
	database: string
	user: string
	password: string
    port?:number
}

export interface ConnectionOptions extends BaseDbOptions,BasePoolOptions {
	charset?: string //用于连接的字符集 默认 'UTF8_GENERAL_CI'
	prefix?: string //前缀
	connectTimeout?: number //初次连接到 MySQL 服务器允许的超时毫秒数 10000
	localAddress?:string
	socketPath?:string
	timezone?:string
	stringifyObjects?:boolean
	insecureAuth?:boolean
	typeCast?:boolean
	queryFormat?:(query: string, values:Record<string, any>) => string
	supportBigNumbers?:boolean
	bigNumberStrings?:boolean
	dateStrings?:boolean
	debug?:boolean|object
	trace?:boolean
	multipleStatements?:boolean
	flags?:Array<string>
	ssl?:string|object
}

export type Escape = {
	sql:string,
	values:any[]
}
export default class Db {
	//数据库实例
	private static instance: Db = new Db()
	private static config: PoolOptions = Object.create(null)
	private static pool: Pool
	private closed: boolean = true	//是否关闭连接
	public static connect(config: ConnectionOptions): Db {
        const poolOptions:PoolOptions = {
            ...config,
            host:config.host || "localhost",
            database:config.database || "root",
            user: config.user || "root",
            password: config.password || "root",
            port: config.port || 3306,
            // acquireTimeout: config.acquireTimeout || 10000,
            waitForConnections:config.waitForConnections || true,
            connectionLimit: config.connectionLimit || 10,
            queueLimit: config.queueLimit || 0,
        }
        this.config = poolOptions
		this.pool = mysql.createPool(config)
		this.instance.closed = false
		process.on('exit', async (code) => {
			try { 
				await this.pool.end()
				this.instance.closed = true
			} catch (e) {
				throw e
			}
		})
        return this.instance
	}

	/**
	 * 重新创建连接
	 * @param config 配置
	 * @returns 
	 */
	private async reConnect() {
		if(!this.closed) return 
		Db.pool && Db.pool.end()
		Db.pool = mysql.createPool(Db.config)
	}
	/**
	 * 
	 * @param key 配置key
	 * @returns 
	 */
	public getConfig(key: string): any {
		if(!key) return Db.config
		if(Db.config.hasOwnProperty(key)) return Db.config[key]
		return null
	}
	public async query<T>(sql:string): Promise<T>;
	public async query<T>(sql:string, values:any[]): Promise<T>;
	/**
	 * query查询
	 * @param options 
	 * @returns 
	 */
	public async query<T>(sql:string, values?:any[]): Promise<T> {
		return new Promise<any>((resolve, reject) => {
			Db.pool.getConnection((err, connection) => {
				if(err) {
					this.closed = true
					this.reConnect()
					throw err
				}
				if(empty(values)) {
					connection.query(sql, (err, result) => {
						if(err) throw err
						resolve(result)
					})
				}else {
					connection.query(sql, values, (err, result) => {
						if(err) throw err
						resolve(result)
					})
				}
			})
		})
	}
	public async exec<T>(sql:string): Promise<T>;
	public async exec<T>(sql:string, values:any[]): Promise<T>;
	/**
	 * execute查询
	 * @param options 
	 * @returns 
	 */
	public async exec<T>(sql:string, values?:any[]): Promise<T> {
		return new Promise<any>((resolve, reject) => {
			Db.pool.getConnection((err, connection) => {
				if(err) {
					this.closed = true
					this.reConnect()
					throw err
				}
				if(empty(values)) {
					connection.execute(sql, (err, result) => {
						if(err) throw err
						resolve(result)
					})
				}else {
					connection.execute(sql, values, (err, result) => {
						if(err) throw err
						resolve(result)
					})
				}
			})
		})
	}

	/**
	 * 格式化
	 * @param options 
	 * @returns 
	 */
	public format(options: Escape): string {
		if (Db.pool) {
			const sql: string = Db.pool.format(options.sql, options.values)
			return sql
		}
		return ''
	}
}