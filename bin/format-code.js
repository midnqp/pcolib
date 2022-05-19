import 'zx/globals'
import path from 'path'
import {promises as fs} from 'fs'
const log = console.log
import {startSpinner} from 'zx/experimental'
$.verbose=false

// Config and arguments by dirnames.
const ConfigList = [
	{
		dir: ['src'],
		conf: `-w --config .prettierrc.json`.split(' ')
	},
]

// Runtime
let {stdout:staged} = await $`git diff --name-only --staged`
staged = staged.split('\n').slice(0, -1)
let cmd = []
for (const file of staged) {
	const conf =  getConfig(file)
	if (! await access('./'+file)) {log(`:: file not found: ${file}`); continue}
	if (!conf){ log(`:: config not found for: ${file}`); continue}
	const stop = startSpinner()
	console.log((await $`npx prettierx ${conf} ${file}`).stdout.slice(0, -2))
	await $`git add ${file}` // prettierx writes files, so adding them back.
	stop()
}

async function access (filename) {
	try {
	await fs.access(filename); return true }
	catch(err) {return false}
}

function getConfig(filename) {
	const fdir = path.dirname(filename)
	const config = ConfigList.find(config => config.dir.includes(fdir) )
	if (!config) return null
	return config.conf
}
