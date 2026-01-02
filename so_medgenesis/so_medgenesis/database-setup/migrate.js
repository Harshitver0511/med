const { query, connectDatabase, closeDatabase } = require('../backend-api/config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../backend-api/utils/logger');

async function runMigrations() {
    try {
        logger.info('Starting database migration...');
        
        // Connect to database
        await connectDatabase();
        logger.info('Database connected successfully');
        
        // Read and execute the initialization script
        const initScript = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
        const statements = initScript.split(';').filter(stmt => stmt.trim());
        
        logger.info(`Executing ${statements.length} SQL statements...`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement && !statement.startsWith('--') && !statement.startsWith('/*')) {
                try {
                    await query(statement);
                    logger.debug(`Executed statement ${i + 1} successfully`);
                } catch (error) {
                    // Ignore errors for statements that might already exist
                    if (!error.message.includes('already exists') && 
                        !error.message.includes('duplicate key') &&
                        !error.message.includes('relation exists')) {
                        logger.warn(`Statement ${i + 1} failed:`, error.message);
                    }
                }
            }
        }
        
        logger.info('Database migration completed successfully');
        
    } catch (error) {
        logger.error('Migration failed:', error);
        throw error;
    } finally {
        await closeDatabase();
        logger.info('Database connection closed');
    }
}

// Run migrations if this script is executed directly
if (require.main === module) {
    runMigrations()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { runMigrations };