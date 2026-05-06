import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '.env') });

const PostSchema = new mongoose.Schema({
  content: Object,
  publishStatus: Array,
  platforms: Array,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { strict: false });

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const post = await Post.findOne().sort({ createdAt: -1 }).exec();
  console.log(JSON.stringify(post, null, 2));
  process.exit(0);
}

check();
