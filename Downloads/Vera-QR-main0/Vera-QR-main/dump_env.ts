
import fs from 'fs'
try {
    const content = fs.readFileSync('.env.local', 'utf8')
    fs.writeFileSync('temp_keys.txt', content)
} catch (e) {
    console.error(e)
}
