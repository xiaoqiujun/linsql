import { ConnectionOptions,PoolOptionBase,DbOptionBase,Escape } from './Db';
import MySQL from './Query';
export {
	Field,
	JoinType,
	Logic,
	OrderType,
	Table,
} from "./Builder";

export default class Db {
    private static instance:MySQL
    public static connect(config:ConnectionOptions) {
		if(!this.instance) {
			this.instance = new MySQL(config);
		}
		return this.instance
	}
}
export { MySQL,ConnectionOptions,PoolOptionBase,DbOptionBase,Escape }