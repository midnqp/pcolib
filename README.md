![pcolib-logo](https://user-images.githubusercontent.com/50658760/178645554-c5cecc80-fa33-49bd-b975-10445d8a2648.png)

## API

#### Run a request
The argument `example` of method `Pcolib.prototype.run()` is optional. If omitted, the data present in original request is used.
```ts
import collection from './postman.json' assert {type: 'json'}
import Pcolib from 'postman-collection-interface'

const pcolib = new Pcolib({ collection })
pcolib.run('folder-name', 'request-name', 'example-name')
```

#### Specify by method-chaining
```ts
pcolib.get('folder', 'req').example('ex').run()

pcolib.get('folder').request('req').example('ex').run()
```

#### Specify request data
```ts
pcolib.get('public-api', 'user login').body({ name: 'muhammad' }).run()

pcolib.get('public-api')
	.request('user login')
	.body({ name: 'muhammad' })
	.headers({ etag: 'etag-token' })
	.run()
```

#### Get request data
```ts
const {body, query, headers, params} = pcolib.get('public-api', 'user login', 'dev: ok')
```

#### URL
Pcolib parses and looks out for query parameters and path variables. If these data are specified by user, then they're used to make the request.
If a URL in postman is as: `/user/{{user_id}}/repositories/{{repo_id}}`, then:
```ts
pcolib.get('user code repo')
	.request('get single repo')
	.headers({ authorization: 'Bearer xyz' })
	.params({ user_id: 'f7kla9-09kda', repo_id: '345678' })
```

#### Stateful requests
Pcolib instances can be a mock for a user. Often useful in end-to-end testing. If `global` payload is specified, all requests from the instance will contain the payload.
```ts
const admin = new Pcolib({
	collection,
	global: { headers: { authorization: 'Bearer admin' } }
})
const shop = new Pcolib({
	collection,
	global: { headers: { authorization: 'Bearer shop' } }
})
const user = new Pcolib({
	collection,
	global: { headers: { authorization: 'Bearer user' } }
})

user.get('cart', 'checkout').run()
shop.get('order', 'list').run()
admin.get('analytics', 'past orders').query({ pastDays: 30 }).run()
```
