import { JSONFilePreset } from 'lowdb/node'

// Initialize the database with default data
const defaultData = {
    users: [],
    circulars: [],
    chats: [],
    messages: [],
    classes: [],
    orders: []
}

const db = await JSONFilePreset('db.json', defaultData)

export default db
