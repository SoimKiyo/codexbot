const express = require('express');
const mongoose = require('mongoose');
const config = require('../../config');
const { handleSuccess, handleFailure } = require('./licenseWebhook');


const app = express();
app.use(express.json());

// Function to generate a license key
function generateLicenseKey() {
    const segments = [];
    for (let i = 0; i < 3; i++) {
        segments.push((Math.random() + 1).toString(36).substring(2, 7).toUpperCase());
    }
    return segments.join('-');
}

// Connecting to MongoDB Database
mongoose.connect(config.MONGODB, {})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error while connecting to MongoDB:', err));

// Product Scheme
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  version: { type: String, required: true },
  maxLicenses: { type: Number, required: true },
  role: { type: String, required: true },
  creatorId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Licensing Scheme
const LicenseSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: String, required: true },
  creatorId: { type: String, required: true },
  key: { type: String, default: generateLicenseKey },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  hwid: { type: String },
  ip: { type: String },
  totalRequests: { type: Number, default: 0 }
});

// Blacklist Scheme
const BlacklistSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  creatorId: { type: String, required: true },
  type: { type: String, enum: ['HWID', 'IP'], required: true },
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', ProductSchema);
const License = mongoose.model('License', LicenseSchema);
const Blacklist = mongoose.model('Blacklist', BlacklistSchema);

// Creation of a new product
app.post('/api/product/create', async (req, res) => {
    try {
      const { name, version, maxLicenses, role, creatorId, createdAt } = req.body;
      if (!name || !version || !maxLicenses || !role || !creatorId) {
        return res.status(400).json({ message: 'All the fields are required.' });
      }
  
      let product = await Product.findOne({ name, version });
      if (product) {
        return res.status(400).json({ message: 'The product already exist.' });
      }
  
      product = new Product({ name, version, maxLicenses, role, creatorId, createdAt });
      await product.save();
      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({ message: 'Error while creating the product.', error: err.message });
    }
});
  
// Deleting a product by ID
app.delete('/api/product/delete/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      // Check the validity of the ObjectiveIf
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID.' });
      }
  
      const product = await Product.findByIdAndDelete(id);
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
  
      res.status(200).json({ message: 'Product deleted.', product });
    } catch (err) {
      res.status(500).json({ message: 'Error while deleting the product.', error: err.message });
    }
  });

// Retrieving product ID by name and version
app.get('/api/product/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check the validity of the ObjectiveIf
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID.' });
        }

        // Retrieve the product
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving product.', error: err.message });
    }
});


app.get('/api/product', async (req, res) => {
    try {
      const products = await Product.find();
      res.status(200).json(products);
    } catch (err) {
      res.status(500).json({ message: 'Error retrieving products.', error: err.message });
    }
  });
  
// Recover a product with its licenses
app.get('/api/product/:id/withLicenses', async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID.' });
      }
  
      const product = await Product.findById(id).exec();
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
  
      const licenses = await License.find({ product: id }).exec();
  
      res.status(200).json({ product, licenses });
    } catch (err) {
      res.status(500).json({ message: 'Error retrieving product with licenses.', error: err.message });
    }
  });
  
// Update a product
app.put('/api/product/update/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID.' });
      }
  
      const product = await Product.findByIdAndUpdate(id, updates, { new: true }).exec();
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
  
      res.status(200).json(product);
    } catch (err) {
      res.status(500).json({ message: 'Error updating product.', error: err.message });
    }
  });
  
  // Update a license
  app.put('/api/license/update/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID.' });
      }
  
      const license = await License.findByIdAndUpdate(id, updates, { new: true }).exec();
      if (!license) {
        return res.status(404).json({ message: 'License not found.' });
      }
  
      res.status(200).json(license);
    } catch (err) {
      res.status(500).json({ message: 'Error updating license.', error: err.message });
    }
  });

  
// Creating a new license
app.post('/api/license/create', async (req, res) => {
  try {
    const { productId, userId, duration, creatorId, createdAt } = req.body;
    if (!productId || !userId || !duration || !creatorId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const licenseCount = await License.countDocuments({ product: productId, userId });
    if (licenseCount >= product.maxLicenses) {
      return res.status(400).json({ message: 'Maximum number of licenses reached.' });
    }

    const expiresAt = duration === 'never' ? null : new Date(Date.now() + parseDuration(duration));
    const license = new License({ product: productId, userId, expiresAt, creatorId, createdAt });
    await license.save();

    res.status(201).json(license);
  } catch (err) {
    res.status(500).json({ message: 'Error creating license.', error: err.message });
  }
});

app.get('/api/license/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check the validity of the ObjectiveIf
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID.' });
        }

        // Recover the license
        const license = await License.findById(id);

        if (!license) {
            return res.status(404).json({ message: 'License not found.' });
        }

        res.status(200).json(license);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving license.', error: err.message });
    }
});

// Retrieve all licenses for a given user
app.get('/api/license/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const licenses = await License.find({ userId }).populate('product').exec();
      res.status(200).json(licenses);
    } catch (err) {
      res.status(500).json({ message: 'Error retrieving licenses for user.', error: err.message });
    }
  });
  
  // Retrieve all licenses for a given product
  app.get('/api/license/product/:productId', async (req, res) => {
    try {
      const { productId } = req.params;
      const licenses = await License.find({ product: productId }).exec();
      res.status(200).json(licenses);
    } catch (err) {
      res.status(500).json({ message: 'Error retrieving licenses for the product.', error: err.message });
    }
  });
  

// Deleting a license by ID
app.delete('/api/license/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check the validity of the ObjectiveIf
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID.' });
        }

        // Delete license
        const license = await License.findByIdAndDelete(id);

        if (!license) {
            return res.status(404).json({ message: 'License not found.' });
        }

        res.status(200).json({ message: 'License removed.', license });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting license.', error: err.message });
    }
});

// Adding a user to the blacklist
app.post('/api/blacklist/add', async (req, res) => {
  try {
    const { userId, type, creatorId, createdAt } = req.body;
    if (!userId || !type || !creatorId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (!['HWID', 'IP'].includes(type)) {
      return res.status(400).json({ message: 'Invalid blacklist type.' });
    }

    let blacklist = await Blacklist.findOne({ userId, type });
    if (blacklist) {
      return res.status(400).json({ message: 'User already blacklisted.' });
    }

    blacklist = new Blacklist({ userId, type, creatorId, createdAt });
    await blacklist.save();

    res.status(201).json(blacklist);
  } catch (err) {
    res.status(500).json({ message: 'Error adding to blacklist.', error: err.message });
  }
});

// Retrieve blacklists for a given user
app.get('/api/blacklist/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const blacklists = await Blacklist.find({ userId }).exec();
      res.status(200).json(blacklists);
    } catch (err) {
      res.status(500).json({ message: 'Error retrieving blacklists for user.', error: err.message });
    }
  });

  
// Deleting a blacklist by ID
app.delete('/api/blacklist/delete/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      // Check the validity of the ObjectiveIf
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID.' });
      }
  
      const blacklist = await Blacklist.findByIdAndDelete(id);
  
      if (!blacklist) {
        return res.status(404).json({ message: 'Blacklist not found.' });
      }
  
      res.status(200).json({ message: 'Blacklist removed.', blacklist });
    } catch (err) {
      res.status(500).json({ message: 'Error while deleting blacklist.', error: err.message });
    }
});
  
// Route GET to get details of a blacklist
app.get('/api/blacklist/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check the validity of the ObjectiveIf
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID.' });
        }

        // Retrieve the blacklist
        const blacklistEntry = await Blacklist.findById(id);

        if (!blacklistEntry) {
            return res.status(404).json({ message: 'Blacklist not found.' });
        }

        res.status(200).json(blacklistEntry);
    } catch (err) {
        res.status(500).json({ message: 'Error retrieving blacklist.', error: err.message });
    }
});

// Retrieving user information
app.get('/api/info/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Check user ID validity
      if (!userId) {
        return res.status(400).json({ message: 'User ID required.' });
      }
  
      // Retrieve licenses and blacklists for the user
      const licenses = await License.find({ userId }).populate('product').exec();
      const blacklists = await Blacklist.find({ userId }).exec();
  
      // Respond with combined information
      res.status(200).json({
        userId,
        licenses,
        blacklists,
      });
    } catch (err) {
      res.status(500).json({ message: 'Error retrieving user information.', error: err.message });
    }
});

// Function to convert duration to milliseconds
function parseDuration(duration) {
  const match = duration.match(/(\d+)([smhd])/);
  if (!match) return 0;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 1000 * 60;
    case 'h': return value * 1000 * 60 * 60;
    case 'd': return value * 1000 * 60 * 60 * 24;
    default: return 0;
  }
}

// HWID/IP and product verification when using a license
app.post('/api/license/verify', async (req, res) => {
    try {
        const { licenseId, hwid, ip, productId } = req.body;

        if (!licenseId || !productId) {
            return res.status(400).json({ message: 'License ID and Product ID are required.' });
        }

        // Check License
        const license = await License.findOne({ key: licenseId }).populate('product').exec();
        if (!license) {
            await handleFailure(licenseId, 'Unknown Product', 'Unknown Version', 0, ip, hwid, 'Unknown User', 'License not found');
            return res.status(404).json({ message: 'License not found.' });
        }

        if (license.product._id.toString() !== productId) {
            await handleFailure(licenseId, 'Unknown Product', 'Unknown Version', 0, ip, hwid, 'Unknown User', 'Invalid product');
            return res.status(403).json({ message: 'License not valid for this product.' });
        }

        // Check if user is blacklisted
        const blacklistEntry = await Blacklist.findOne({ userId: license.userId });
        if (blacklistEntry) {
            if (blacklistEntry.type === 'HWID' && hwid === license.hwid) {
                await handleFailure(licenseId, license.product.name, license.product.version, license.totalRequests, ip, hwid, license.userId, 'Blacklisted HWID');
                return res.status(403).json({ message: 'User is blacklisted for HWID.' });
            }
            if (blacklistEntry.type === 'IP' && ip === license.ip) {
                await handleFailure(licenseId, license.product.name, license.product.version, license.totalRequests, ip, hwid, license.userId, 'Blacklisted IP');
                return res.status(403).json({ message: 'User is blacklisted for IP.' });
            }
        }

        // Check HWID
        if (license.hwid && license.hwid !== hwid) {
            await handleFailure(licenseId, license.product.name, license.product.version, license.totalRequests, ip, hwid, license.userId, 'Mismatch HWID');
            return res.status(403).json({ message: 'Mismatch HWID.' });
        }

        // Update HWID if not set
        if (!license.hwid) {
            license.hwid = hwid;
        }

        // Check IP
        if (license.ip && license.ip !== ip) {
            await handleFailure(licenseId, license.product.name, license.product.version, license.totalRequests, ip, hwid, license.userId, 'Mismatch IP');
            return res.status(403).json({ message: 'Mismatch IP.' });
        }

        // Update IP if not set
        if (!license.ip) {
            license.ip = ip;
        }

        // Increase the request counter
        license.totalRequests = (license.totalRequests || 0) + 1;

        // Save the updated license
        await license.save();

        await handleSuccess(licenseId, license.product.name, license.product.version, license.totalRequests, ip, hwid, license.userId);

        res.status(200).json({ message: 'License validated.' });
    } catch (err) {
        await handleFailure('', 'Unknown Product', 'Unknown Version', 0, ip, hwid, '', err.message);
        res.status(500).json({ message: 'Error verifying license.', error: err.message });
    }
});

// Starting the API server
const PORT = `${config.APISRVPORT}`;

app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
