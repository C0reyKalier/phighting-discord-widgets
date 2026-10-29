const path = require('path');
const Database = require('better-sqlite3');
const { Events } = require('discord.js');

// DO NOT EDIT! This serves as a versioning system for the database schema. Only increment this number when you know what you are doing.
const LATEST_DB_VERSION = 1;

module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
        const dbPath = path.join(__dirname, '..', 'user_database.db');
        
        try {
            const db = new Database(dbPath);
            
            // Check if metadata table exists
            const metadataTableExists = db.prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='metadata'"
            ).get();
            
            if (!metadataTableExists) {
                db.exec(`
                    CREATE TABLE metadata (
                        version INTEGER PRIMARY KEY
                    );
                `);
                db.prepare("INSERT INTO metadata (version) VALUES (?)").run(0);
            }
            
            let currentVersion = 0;
            const versionRow = db.prepare("SELECT version FROM metadata").get();
            if (versionRow) {
                currentVersion = parseInt(versionRow.version, 10);
            }
            
            if (currentVersion === LATEST_DB_VERSION) {
                console.log('Database metadata is already in the latest version', LATEST_DB_VERSION);
                db.close();
                return;
            }
            
            // Check if widget_layout table exists
            const widgetLayoutTableExists = db.prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='widget_layout'"
            ).get();

            if (!widgetLayoutTableExists) {
                // Create widget_layout table
                db.exec(`
                    CREATE TABLE widget_layout (
                        discord_id INTEGER PRIMARY KEY,
                        stats_1 TEXT,
                        stats_1_icon TEXT,
                        stats_2 TEXT,
                        stats_2_icon TEXT,
                        stats_3 TEXT,
                        stats_3_icon TEXT,
                        stats_4 TEXT,
                        stats_4_icon TEXT,
                        stats_5 TEXT,
                        stats_5_icon TEXT,
                        stats_6 TEXT,
                        stats_6_icon TEXT,
                        featured_1 TEXT,
                        featured_2 TEXT,
                        featured_3 TEXT,
                        featured_4 TEXT
                    );
                `);
            }

            // Check if user_stats table exists
            const userStatsTableExists = db.prepare(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='user_stats'"
            ).get();
            
            if (!userStatsTableExists) {
                // Create user_stats table
                db.exec(`
                    CREATE TABLE user_stats (
                        discord_id INTEGER PRIMARY KEY,
                        phighter_heroimg TEXT,
                        heroimg_background TEXT,
                        title TEXT,
                        level INTEGER,
                        comp_status TEXT,
                        comp_badge TEXT,
                        joindate TEXT,
                        maining TEXT,
                        brokercoins_donated INTEGER,
                        total_playtime_hours INTEGER,
                        total_kills INTEGER,
                        total_deaths INTEGER,
                        total_assists INTEGER,
                        total_wins INTEGER,
                        win_rate DECIMAL(5, 4),
                        total_dmg INTEGER,
                        total_heals INTEGER,
                        highest_win_streak INTEGER,
                        highest_daily_streak INTEGER,
                        endorsements_received INTEGER,
                        endorsements_given INTEGER,
                        best_kda TEXT,
                        best_dmg INTEGER,
                        best_heals INTEGER
                    );
                `);
                currentVersion = 1;
                db.prepare("UPDATE metadata SET version = ?").run('1');
            }

            const phighters = [
                'sword', 'rocket', 'medkit', 'skateboard', 'slingshot', 'boombox',
                'biograft', 'hyperlaser', 'subspace', 'katana', 'shuriken',
                'vine_staff', 'ban_hammer', 'scythe', 'coil'
            ];
            const healerPhighters = new Set(['medkit', 'vine_staff', 'coil']);

            for (const phighter of phighters) {
                const tableName = `${phighter}_stats`;
                const tableExists = db.prepare(
                    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?"
                ).get(tableName);

                if (!tableExists) {
                    const columns = [
                        'discord_id INTEGER PRIMARY KEY',
                        'mastery_level INTEGER',
                        'playtime_hours INTEGER',
                        'games INTERGER',
                        'win_rate DECIMAL(5, 4)',
                        'wins INTEGER',
                        'kills INTEGER',
                        'deaths INTEGER',
                        'assists INTEGER',
                        'damage INTEGER',
                        'points INTEGER',
                        'best_kda TEXT',
                        'best_dmg INTEGER'
                    ];

                    if (healerPhighters.has(phighter)) {
                        columns.push(
                            'healing INTEGER',
                            'best_heals INTEGER'
                        );
                    }

                    db.exec(`CREATE TABLE "${tableName}" (${columns.join(', ')})`);
                }
            }
            
            // Apply incremental schema updates
            // if (currentVersion < 2) {
            //    db.exec(`
            //        ALTER TABLE table_name ADD COLUMN column_name TYPE;
            //    `);
            //    currentVersion = 2;
            //    db.prepare("UPDATE metadata SET version = ?").run('2');
            // }
            
            db.close();
            console.log('Database initialized and schema updated to version', currentVersion);
        } catch (error) {
            console.error('Error updating database:', error);
        }
    },
};