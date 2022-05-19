import * as T from './typings/index.js'
import Pcolib from './index.js'
import axios, {AxiosError, AxiosResponse} from 'axios'
import * as util from './util.js'

export async function fireRequest ({requestData, normalizedData, variables, globals}) {
	const obj = requestData
	const data = normalizedData

	const method: 'get' | 'body' | 'delete' | 'put' | 'post' = obj.method.toLowerCase()
	const {query, params, body} = data
	// for headers, local being
	// over-ridden by global.
	const headers = {...data.headers, ...globals.headers}

	let url = obj.url.raw
	url = util.replace_path_var(url, params)
	url = util.replace_postman_var(url, variables)
	url = new URL(url)
	const {pathname} = url
	url = url.origin + pathname
	util.log.debug('request method:' + method)
	util.log.debug('request url: ' + url)
	util.log.debug('request payload: ' + util.expand({headers, query, params, body}))

	let _response: Promise<AxiosResponse>
	const interf = axios[method]
	switch (method) {
		case 'delete':
		case 'get':
			_response = interf(url, {params: query, headers})
			break
		case 'put':
		case 'post':
			_response = interf(url, body, {params: query, headers})
			break
		default:
			throw Error(`Found an unhandled "${method}" request!`)
	}
	let output = {} as T.PcolibResponse
	try {
		const {config, request, data, ...ret} = await _response
		output = {...ret, body: data}
	} catch (err: any) {
		const error = <AxiosError>err
		if (error.response) {
			const {config, request, data, ...ret} = error.response
			output = {...ret, body: data}
		} else throw err
	}
	return output
}

/** Require's Pcolib's `this` content. */
export function chainRequest (this, parentFolder) {
	const thisPcolib = this as any
	return {
		request: function (nameOrIdx: T.FolderOrReq) {
			const req = Pcolib.pinpointRequest(parentFolder, nameOrIdx)
			util.check(req, 'Request')
			return chainExample.call(thisPcolib, req)
		},
	}
}

export function chainExample (this, parentRequest) {
	const thisPcolib = this as any
	return {
		/**
		 * Normalized data, with all the
		 * changes from chaining.
		 *
		 * Initialized to `parentRequest.request`,
		 * raw data with the request itself.
		 */
		get data (): T.NormData {
			// the aggregated request data storage.
			// @ts-ignore
			if (!this.__data__) {
				Object.defineProperty(this, '__data__', {
					enumerable: false,
					writable: true,
				})
				// @ts-ignore
				this.__data__ = util.normalize(parentRequest.request) // default data attached to the request, not from any examples
			}

			// the request metadata
			// @ts-ignore
			if (!this.__reqmeta__) {
				// @ts-ignore
				this.__reqmeta__ = parentRequest.request
			}

			// @ts-ignore
			return this.__data__
		},

		query: function (value: Record<string, any>) {
			const {query: prev} = this.data
			this.data.query = {...prev, ...value}
			return this
		},
		body (value: Record<string, any>) {
			const {body: prev} = this.data
			this.data.body = {...prev, ...value}
			return this
		},
		params (value: Record<string, any>) {
			const {params: prev} = this.data
			this.data.params = {...prev, ...value}
			return this
		},
		headers (value: Record<string, any>) {
			const {headers: prev} = this.data
			this.data.headers = {...prev, ...value}
			return this
		},

		/** Take request data from example. */
		example (exmp: T.Example) {
			const data = Pcolib.pinpointExample(parentRequest, exmp)
			// @ts-ignore
			this.__data__ = data
			return this
		},

		/** Run the request. Inherits `this` context from Pcolib. */
		run () {
			// @ts-ignore
			const {__reqmeta__, __data__} = this
			return fireRequest({
				requestData: __reqmeta__,
				normalizedData: __data__,
				variables: thisPcolib.variables,
				globals: thisPcolib.global,
			})
		},
	}
}
