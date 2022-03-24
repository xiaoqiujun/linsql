import { ConnectionOptions,BaseDbOptions,BasePoolOptions,Escape } from './Db';
import LinSQL from './Query';
export {RowRecord} from './Query'
export {
	Field,
	JoinType,
	Logic,
	OrderType,
	Table,
} from "./Builder";

export default class linsql {
    private static instance:LinSQL
    public static connect(config:ConnectionOptions) {
		if(!this.instance) {
			this.instance = new LinSQL(config);
		}
		return this.instance
	}
}
export { LinSQL,ConnectionOptions,BaseDbOptions,BasePoolOptions,Escape }
