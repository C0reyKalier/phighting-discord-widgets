const path = require('path');
const Database = require('better-sqlite3');
const { Events } = require('discord.js');

const LATEST_DB_VERSION = 3;

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
        const dbPath = path.join(__dirname, '..', 'user_database.db');
        
        try {
            const db = new Database(dbPath);
            
            // Check if metadata table exists, if not create it
            const metadataTableExists = db.prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='metadata'"
            ).get();
            
            if (!metadataTableExists) {
                db.exec(`
                    CREATE TABLE metadata (
                        key TEXT PRIMARY KEY,
                        value TEXT
                    );
                `);
                db.prepare("INSERT INTO metadata (key, value) VALUES (?, ?)").run('version', '0');
            }
            
            let currentVersion = 0;
            const versionRow = db.prepare("SELECT value FROM metadata WHERE key = 'version'").get();
            if (versionRow) {
                currentVersion = parseInt(versionRow.value);
            }
            
            if (currentVersion === LATEST_DB_VERSION) {
                console.log('Database metadata is already in the latest version', LATEST_DB_VERSION);
                db.close();
                return;
            }
            
            // Check if user_data table exists
            const userDataTableExists = db.prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='user_data'"
            ).get();
            
            if (!userDataTableExists) {
                // Create user_data table
                db.exec(`
                    CREATE TABLE user_data (
                        discord_id TEXT PRIMARY KEY,
                        honorary_title TEXT,
                        level INTEGER,
                        scrimming_status TEXT,
                        maining TEXT,
                        hours_played INTEGER,
                        best_kda TEXT,
                        best_dmg INTEGER,
                        best_heals INTEGER
                    );
                `);
                currentVersion = 1;
                db.prepare("UPDATE metadata SET value = ? WHERE key = 'version'").run('1');
            }
            
            // Apply incremental schema updates
            if (currentVersion < 2) {
                db.exec(`
                    ALTER TABLE user_data ADD COLUMN total_kills INTEGER;
                    ALTER TABLE user_data ADD COLUMN total_deaths INTEGER;
                    ALTER TABLE user_data ADD COLUMN total_heals INTEGER;
                    ALTER TABLE user_data ADD COLUMN best_winstreak INTEGER;
                    ALTER TABLE user_data ADD COLUMN best_dailystreak INTEGER;
                `);
                currentVersion = 2;
                db.prepare("UPDATE metadata SET value = ? WHERE key = 'version'").run('2');
            }
            
            if (currentVersion < 3) {
                db.exec(`
                    ALTER TABLE user_data ADD COLUMN winrate TEXT;
                `);
                currentVersion = 3;
                db.prepare("UPDATE metadata SET value = ? WHERE key = 'version'").run('3');
            }
            
            db.close();
            console.log('Database initialized and schema updated to version', currentVersion);
        } catch (error) {
            console.error('Error updating database:', error);
        }
    },
};