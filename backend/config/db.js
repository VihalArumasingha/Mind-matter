import mongoose from 'mongoose';

const connectDB = async () => {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoURI) {
        throw new Error('MONGO_URI or MONGODB_URI is not configured');
    }

    const conn = await mongoose.connect(mongoURI, {
        dbName: 'test',
        serverSelectionTimeoutMS: 10000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    console.log(`[Database] Database name: ${conn.connection.name}`);
};

export default connectDB;
