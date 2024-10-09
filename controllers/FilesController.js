import { v4 as uuidv4 } from 'uuid';
import { ObjectId } from 'mongodb';
import Queue from 'bull/lib/queue';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const fileQueue = new Queue('fileQueue');

// Helperfunction to get user
async function getUserFromToken(req) {
  const token = req.headers['x-token'];
  if (!token) return null;

  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) return null;

  const user = await dbClient.db.collection('users').findOne({ _id: ObjectId(userId) });
  return user;
}

/**
 * class - FilesController: Handles file operations
 */
class FilesController {
  // Upload file method
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;

    // Validate name and type
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if ((type === 'file' || type === 'image') && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Check if parentId is valid
    let parentFile = null;
    if (parentId !== '0') {
      parentFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Prepare the file document
    const fileDoc = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: parentId === '0' ? '0' : ObjectId(parentId),
    };

    // Handle folder creation
    if (type === 'folder') {
      const result = await dbClient.db.collection('files').insertOne(fileDoc);
      return res.status(201).json(result.ops[0]);
    }

    // For file or image, save the file to disk
    const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(FOLDER_PATH)) {
      fs.mkdirSync(FOLDER_PATH, { recursive: true });
    }

    const fileId = uuidv4();
    const localPath = path.join(FOLDER_PATH, fileId);

    // Decode Base64 data and write file to disk
    const buffer = Buffer.from(data, 'base64');
    fs.writeFileSync(localPath, buffer);

    // Complete the file document and insert it into the DB
    fileDoc.localPath = localPath;
    const result = await dbClient.db.collection('files').insertOne(fileDoc);

    // image queue
    if (type === 'image') {
      fileQueue.add({
        userId: userId.toString(),
        fileId: result.ops[0]._id.toString(),
      });
    }

    return res.status(201).json(result.ops[0]);
  }

  // method to retrieve file based on Id
  static async getShow(req, res) {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;

    try {
      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(user._id) });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      return res.status(200).json(file);
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }
  }

  static async getIndex(req, res) {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const parentId = req.query.parentId || '0'; // Default to root if not specified
    const parentObjectId = parentId === '0' ? '0' : ObjectId(parentId); // Cast parentId to ObjectId if needed
    const page = parseInt(req.query.page, 10) || 0; // Default page to 0

    try {
      const files = await dbClient.db.collection('files')
        .aggregate([
          { $match: { userId: ObjectId(user._id), parentId: parentObjectId } },
          { $skip: page * 20 },
          { $limit: 20 },
        ])
        .toArray();

      return res.status(200).json(files);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method to publish image
  static async putPublish(req, res) {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;

    try {
      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(user._id) });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      await dbClient.db.collection('files').updateOne(
        { _id: ObjectId(fileId), userId: ObjectId(user._id) },
        { $set: { isPublic: true } },
      );

      const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });

      return res.status(200).json(updatedFile);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Method to unpublish image
  static async putUnpublish(req, res) {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;

    try {
      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId), userId: ObjectId(user._id) });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      await dbClient.db.collection('files').updateOne(
        { _id: ObjectId(fileId), userId: ObjectId(user._id) },
        { $set: { isPublic: false } },
      );

      const updatedFile = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });

      return res.status(200).json(updatedFile);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // eslint-disable-next-line consistent-return

  // eslint-disable-next-line consistent-return
  static async getFile(req, res) {
    const fileId = req.params.id;
    const { size } = req.query;
    const user = await getUserFromToken(req);

    try {
    // Find the file by ID
      const file = await dbClient.db.collection('files').findOne({ _id: ObjectId(fileId) });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      // If the file is a folder, return an error
      if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
      }

      // If the file is private, check if the user is authenticated and is the owner
      if (!file.isPublic && (!user || String(file.userId) !== String(user._id))) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Determine which file path to use based on the `size` query parameter
      let filePath = file.localPath;
      if (file.type === 'image' && size) {
        const allowedSizes = [100, 250, 500];
        if (!allowedSizes.includes(parseInt(size, 10))) {
          return res.status(400).json({ error: `Invalid size. Allowed sizes are ${allowedSizes.join(', ')}` });
        }

        // Check if the resized file exists (e.g., image_100, image_250, etc.)
        const thumbnailPath = `${file.localPath}_${size}`;
        if (fs.existsSync(thumbnailPath)) {
          filePath = thumbnailPath;
        } else {
          return res.status(404).json({ error: 'Not found' });
        }
      }

      // Check if the file exists on the local path
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Get the MIME type based on the file name
      const mimeType = mime.lookup(file.name);
      res.setHeader('Content-Type', mimeType || 'application/octet-stream');

      // Stream the file content to the response
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default FilesController;
