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
app.post('/upload-image', upload.array('file'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded.' });
    }
    const category = req.body.category || 'uncategorized';
    const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const dir = path.join(__dirname, 'images', 'projects', slug);
    fs.mkdirSync(dir, { recursive: true });

    const paths = [];
    for (const file of req.files) {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const isImage = file.mimetype.startsWith('image/');
      if (isImage) {
        const webpFilename = `${safeName}.webp`;
        const outputPath = path.join(dir, webpFilename);
        await sharp(file.buffer)
          .webp({ quality: 80 })
          .toFile(outputPath);
        paths.push(`images/projects/${slug}/${webpFilename}`);
      } else {
        const originalFilename = `${safeName}${ext}`;
        const outputPath = path.join(dir, originalFilename);
        fs.writeFileSync(outputPath, file.buffer);
        paths.push(`images/projects/${slug}/${originalFilename}`);
      }
    }
    res.json({ success: true, paths });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error during upload.' });
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
