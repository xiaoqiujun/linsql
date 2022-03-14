import mysql from 'mysql2'


export interface PoolOptionBase {
	// acquireTimeout?: number //连接池超时毫秒数 默认 10000
	waitForConnections?: boolean    //指定连接池在没有可用连接、连接数已达到限制时的操作 true
	connectionLimit?: number //一次允许创建的最大连接数 10
	queueLimit?: number //连接池允许排队的最大连接请求数 0
}

export interface DbOptionBase {
	host: string
	database: string
	user: string
	password: string
    port?:number
}

export interface ConnectionOptions extends DbOptionBase,PoolOptionBase {
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
type Config = Record<string, any>
export default class Db {
	//数据库实例
	private static instance: Db = new Db()
	private static config: mysql.PoolOptions = Object.create(null)
	private static pool: mysql.Pool
	public static connect(config: ConnectionOptions): Db {
        const poolOptions:mysql.PoolOptions = {
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
		this.pool = mysql.createPool(poolOptions)
        return this.instance
	}

	/**
	 * 
	 * @param key 配置key
	 * @returns 
	 */
	public getConfig(key: string): any {
		if(Db.config.hasOwnProperty(key)) return Db.config[key]
		return null
	}
}
