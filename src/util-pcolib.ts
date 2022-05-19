export type ChainedRequest = ReturnType<typeof chainRequest>
export type ChainedExample = ReturnType<typeof chainExample>

import {FolderOrReq, NormData, Example} from './typings/index.js'
import Pcolib from './index.js'
import * as util from './util.js'

export function chainRequest (parentFolder) {
	return {
		request: function (nameOrIdx: FolderOrReq) {
			const req = Pcolib.pinpointRequest(parentFolder, nameOrIdx)
			util.check(req, 'Request')
			return chainExample(req)
		},
	}
}

export function chainExample (parentRequest) {
	return {
		/**
		 * Normalized data, with all the
		 * changes from chaining.
		 *
		 * Initialized to `parentRequest.request`,
		 * raw data with the request itself.
		 */
		get data (): NormData {
			// @ts-ignore
			if (!this.__data__) {
				Object.defineProperty(this, '__data__', {
					enumerable: false,
					writable: true,
				})
				// @ts-ignore
				this.__data__ = util.normalize(parentRequest.request) // default data attached to the request, not from any examples
			}
			// @ts-ignore
			return this.__data__
		},

		query: function (value: Record< string, any >) {
			const { query: prev } = this.data
			this.data.query = { ...prev, ...value }
			return this
		},
		body (value: Record< string, any >) {
			const { body: prev } = this.data
			this.data.body = { ...prev, ...value }
			return this
		},
		params (value: Record< string, any >) {
			const { params: prev } = this.data
			this.data.params = { ...prev, ...value }
			return this
		},
		headers (value: Record< string, any >) {
			const { headers: prev } = this.data
			this.data.headers = { ...prev, ...value }
			return this
		},

		/** Take request data from example. */
		example (exmp: Example) {
			const data = Pcolib.pinpointExample(parentRequest, exmp)
			// @ts-ignore
			this.__data__ = data
			return this
		},
	}
}
