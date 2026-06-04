require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable GZIP compression to optimize payload size
app.use(compression());

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve static files with Cache-Control headers for optimization
const staticOptions = {
  maxAge: '7d', // Cache static assets (images, css, js) for 7 days
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // Don't cache HTML to ensure latest content is always served
      res.setHeader('Cache-Control', 'public, max-age=0');
    }
  }
};
app.use(express.static(__dirname, staticOptions));



/* ─── Multer Storage ───────────────────────────────────────────────────────── */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ─── POST /upload-image ──────────────────────────────────────────────────── */
app.post('/upload-image', upload.fields([{ name: 'thumbnailFile', maxCount: 1 }, { name: 'actualFile', maxCount: 1 }]), async (req, res) => {
  try {
    if (!req.files || (!req.files.thumbnailFile && !req.files.actualFile)) {
      return res.status(400).json({ success: false, error: 'No files uploaded.' });
    }
    const category = req.body.category || 'uncategorized';
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const dir = path.join(__dirname, 'images', 'projects', slug);
    fs.mkdirSync(dir, { recursive: true });

    const processFile = async (fileArray, suffix) => {
      if (!fileArray || fileArray.length === 0) return null;
      const file = fileArray[0];
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + suffix + '-' + Date.now();
      
      const isImage = file.mimetype.startsWith('image/');
      if (isImage) {
        const webpFilename = `${safeName}.webp`;
        const outputPath = path.join(dir, webpFilename);
        await sharp(file.buffer)
          .webp({ quality: 80 })
          .toFile(outputPath);
        return `images/projects/${slug}/${webpFilename}`;
      } else {
        const originalFilename = `${safeName}${ext}`;
        const outputPath = path.join(dir, originalFilename);
        fs.writeFileSync(outputPath, file.buffer);
        return `images/projects/${slug}/${originalFilename}`;
      }
    };

    const thumbnailSrc = await processFile(req.files.thumbnailFile, 'thumb');
    const actualSrc = await processFile(req.files.actualFile, 'actual');

    res.json({ success: true, thumbnailSrc, actualSrc });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error during upload.' });
  }
});

/* ─── DELETE /delete-item ────────────────────────────────────────────────── */
app.delete('/delete-item', express.json(), (req, res) => {
  const { thumbnailSrc, actualSrc, src } = req.body;
  try {
    const filesToDelete = [thumbnailSrc, actualSrc, src].filter(Boolean);
    filesToDelete.forEach(fileSrc => {
      // Ensure we don't accidentally delete outside of project images
      if (fileSrc.startsWith('images/projects/')) {
        const filePath = path.join(__dirname, fileSrc);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete Item Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete files.' });
  }
});

/* ─── DELETE /delete-category ────────────────────────────────────────────── */
app.delete('/delete-category', express.json(), (req, res) => {
  const { categoryName } = req.body;
  if (!categoryName) return res.status(400).json({ success: false, error: 'Category name required.' });
  try {
    const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const dir = path.join(__dirname, 'images', 'projects', slug);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete category directory.' });
  }
});

/* ─── POST /optimize-images ─────────────────────────────────────────────── */
const traverseDir = (dir, callback) => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      traverseDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  });
};

app.post('/optimize-images', async (req, res) => {
  const imagesDir = path.join(__dirname, 'images');
  let count = 0;
  
  try {
    const filesToOptimize = [];
    traverseDir(imagesDir, (filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if ((ext === '.jpg' || ext === '.jpeg' || ext === '.png') && !filePath.includes('hero_animation')) {
        filesToOptimize.push(filePath);
      }
    });

    for (const filePath of filesToOptimize) {
      const ext = path.extname(filePath);
      const webpPath = filePath.replace(new RegExp(`${ext}$`, 'i'), '.webp');
      await sharp(filePath)
        .webp({ quality: 80 })
        .toFile(webpPath);
      // Remove original
      fs.unlinkSync(filePath);
      count++;
    }

    // Now update projects-data.json to reflect the new .webp extensions
    const dataPath = path.join(__dirname, 'projects-data.json');
    if (fs.existsSync(dataPath)) {
      let dataStr = fs.readFileSync(dataPath, 'utf8');
      dataStr = dataStr.replace(/\.jpg|\.jpeg|\.png/gi, '.webp');
      fs.writeFileSync(dataPath, dataStr);
    }

    res.json({ success: true, optimizedCount: count });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/* ─── GET /projects-data ─────────────────────────────────────────────────── */
app.get('/projects-data', (req, res) => {
  const dataPath = path.join(__dirname, 'projects-data.json');
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json({ categories: [] });
      return res.status(500).json({ success: false, error: 'Failed to read data file.' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (e) {
      res.status(500).json({ success: false, error: 'Invalid JSON in data file.' });
    }
  });
});

/* ─── POST /save-projects-data ──────────────────────────────────────────── */
app.post('/save-projects-data', (req, res) => {
  const dataPath = path.join(__dirname, 'projects-data.json');
  fs.writeFile(dataPath, JSON.stringify(req.body, null, 2), err => {
    if (err) return res.status(500).json({ success: false, error: 'Failed to write file.' });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`\n==============================================`);
  console.log(`Ta Panda Server is running!`);
  console.log(`Main Website: http://localhost:${PORT}/`);
  console.log(`CRM Admin:    http://localhost:${PORT}/admin.html`);
  console.log(`==============================================\n`);
});
