import chalk from 'chalk'
import process from 'process'
import util from 'util'
import {URL} from 'url'
import axios from 'axios'
import * as types from './typings/index.js'
import lodash from 'lodash'
import dotenv from 'dotenv'
export {lodash}

dotenv.config()
const pcolibLogLevel = process.env.pcolibLogLevel || 'none'
const pcolibLogIndent = Number(process.env.pcolibLogIndent || '0')

/** @throws {Error} - If `item` is undefined. */
export function check (item: any, entity): item is Record<string, any> {
	if (item === undefined) throw Error(entity + ' not found.')
	return true
}

export const log = {
	/** plain debug info */
	debug: function (msg: string | object | number, indent = 0) {
		if (['debug'].includes(pcolibLogLevel)) {
			if (lodash.isObject(msg)) msg = expand(msg)

			msg = '' + msg
			const _marker = 'debug'
			const marker = chalk.cyanBright(_marker) + ' '
			if (pcolibLogIndent) indent = pcolibLogIndent
			const tbsp = ' '.repeat(indent)

			const rpl = '\n' + tbsp + ' '.repeat(_marker.length)
			msg = msg.replace(/\n/g, rpl)
			process.stdout.write(tbsp + marker + chalk.white(msg) + '\n')
		}
	},
}

/** Mostly used to traverse to child folders/requests/examples. */
export function next_where (array: Record<string, string>[], value, prop = 'name') {
	const arrayString = JSON.stringify(array)
	log.debug('next-where prop: ' + prop)
	log.debug('next-where value: ' + value)
	log.debug('next-where array length: ' + array?.length)
	if (!Array.isArray(array)) throw Error('Not a collection of items:\n' + arrayString)
	return array.find(each => each[prop].toLowerCase() === value.toLowerCase())
}

/**
 * Destructures an array of obj
 * by key & value.
 */
function arr_destr (obj: Record<string, any>[], key = 'key', value = 'value') {
	const params = {}
	if (!Array.isArray(obj)) return {}
	for (const i of obj) params[i[key]] = i[value]
	return params
}

/** Replaces postman variables. */
export function replace_postman_var (url: string, variableStore) {
	const list = Object.keys(variableStore)
	for (const key of list) {
		const pvar = `{{` + key + `}}`
		if (url.includes(pvar)) url = url.replace(pvar, variableStore[key])
	}
	return url
}

/**
 * Replaces path variables placeholders
 * with their values.
 */
export function replace_path_var (url: string, paths: Record<string, any>) {
	Object.entries(paths).forEach(([k, v]) => {
		url = url.replace(`:${k}`, v)
	})
	return url
}

/**
 * Normalizes data structure to make requests.
 *
 * @param normalizable
 * Accepts `parentRequest.response`.
 *
 * @returns
 * Data to use to send requests.
 */
export function normalize (normalizable: types.InputNormData): types.NormData {
	const ret = {
		headers: normalizable.headers || {},
		params: {},
		query: {},
		body: {},
	}
	if (normalizable.body?.raw) ret.body = JSON.parse(normalizable.body.raw)
	else if (typeof normalizable.body === 'object') ret.body = normalizable.body

	const uvar = normalizable.url?.variable
	ret.params = normalizable.params || {}
	if (uvar) ret.params = arr_destr(uvar)

	const uquery = normalizable.url?.query
	ret.query = normalizable.query || {}
	if (uquery) ret.query = arr_destr(uquery)

	return ret
}

export function expand (obj: object) {
	const opts = {indentationLvl: 2, colors: true, depth: 20}
	return util.inspect(obj, opts)
}
