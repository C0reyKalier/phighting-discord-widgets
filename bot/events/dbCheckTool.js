const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { Events } = require('discord.js');

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		const dbPath = path.join(__dirname, '..', 'user_database.db');
		const dbExists = fs.existsSync(dbPath);
		
		try {
			const db = new Database(dbPath);
			db.close();
			
			if (dbExists) {
				console.log('Database file already existed.');
			} else {
				console.log('New database file has been created.');
			}
		} catch (error) {
			console.error('PANIC: Database file exists but cannot be opened. The database file might be corrupted.', error);
			process.exit(1);
		}
	},
};
