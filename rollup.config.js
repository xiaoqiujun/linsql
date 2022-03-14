import resolve from "rollup-plugin-node-resolve";
// import commonjs from "rollup-plugin-commonjs";
import typescript from "rollup-plugin-typescript";
import babel from "rollup-plugin-babel";
import {name,version} from './package.json'
const file = type => `./${name}.${type}.js`
const banner =
  '/*\n' +
  ` * linsql v${version}\n` +
  ` * (c) 2022-${new Date().getFullYear()} xiaoqiujun\n` +
  ' * Released under the MIT License.\n' +
  ' */';
export default {
	input: "./src/index.ts",
	output: {
		// 打包出口
		file: "./dist/index.js",
        name:name,
		format:"umd",
		banner
	},
	plugins: [
		// 打包插件
		resolve(),
		babel({
			exclude: 'node_modules/**',
		}),
		typescript(),
	],
};
