
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cpjgzvdoxmuywizlecqo.supabase.co'
const supabaseKey = 'sb_secret_cf8tD2PfpIvnW_Oropfasw_4XlBuRsF'


const supabase = createClient(supabaseUrl, supabaseKey)

async function getSlug() {
    const { data, error } = await supabase
        .from('restaurants')
        .select('slug, name')
        .limit(1)
        .single()

    if (error) {
        console.error('Error fetching slug:', error)
    } else {
        console.log('Found Restaurant:', JSON.stringify(data))
    }
}

getSlug()
