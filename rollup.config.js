import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
// import typescript from "rollup-plugin-typescript";	//这个插件在编译ts时，导出的interface,type会导致报错
import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";
import babel from "rollup-plugin-babel";
import {name,version} from './package.json'
import path from 'path'
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
		file: "./index.js",
        name:name,
		format:"umd",
		banner
	},
	plugins: [
		// 打包插件
		resolve(),
		commonjs(),
		json(),
		typescript({
			tsconfig:path.resolve(__dirname, './tsconfig.json'),
			extensions:['.js', '.ts']
		}),
		babel({
			exclude: 'node_modules/**',
		}),
		
	],
};
