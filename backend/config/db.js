import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error('MONGO_URI or MONGODB_URI is not configured');
        }

        const conn = await mongoose.connect(mongoURI, { dbName: 'test' });
        console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
        console.log(`[Database] Database name: ${conn.connection.name}`);
    } catch (error) {
        console.error(`[Error] Database connection failed: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
