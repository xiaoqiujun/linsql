import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
// import typescript from "rollup-plugin-typescript";	//这个插件在编译ts时，导出的interface,type会导致报错
import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";
import babel from "rollup-plugin-babel";
import copy from 'rollup-plugin-copy';
import { name, version,dependencies,peerDependencies} from "./package.json";
const file = (type) => `./${name}.${type}.js`;
const banner =
	"/*\n" +
	` * linsql v${version}\n` +
	` * (c) 2022-${new Date().getFullYear()} xiaoqiujun\n` +
	" * Released under the MIT License.\n" +
	" */";
export default {
	input: "./src/index.ts",
	output: {
		// 打包出口
		file: "./dist/index.js",
		name: name,
		format: "cjs",
		exports:'named',
		banner,
	},
	external: [	//需要配置这个,否则会报 / (!) Unresolved dependencies/相关的错误
		...Object.keys(dependencies || {}),
		...Object.keys(peerDependencies || {}),
	],
	plugins: [
		// 打包插件
		resolve({}),
		commonjs(),
		json(),
		typescript({
			tsconfigOverride: {
				compilerOptions: {
					module: "ES2015",
				},
			},
			extensions: [".js", ".ts"],
		}),
		babel({
			exclude: "node_modules/**",
		}),
		copy({
			targets: [
				{ src: 'package.json',dest: 'dist' },
				{ src: 'LICENSE',dest: 'dist' },
				{ src: 'README.md',dest: 'dist' }
			]
		})
	],
};
