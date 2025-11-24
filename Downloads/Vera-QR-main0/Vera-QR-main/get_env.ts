
import fs from 'fs'
try {
    const content = fs.readFileSync('.env.local', 'base64')
    console.log(content)
} catch (e) {
    console.error(e)
}
