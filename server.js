const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Case = require('./models/Case');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/judiciary_app';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let dbReady = false;
const memoryDb = {
  users: [],
  cases: []
};

const demoUsers = [
  {
    name: 'Justice Meera Rao',
    email: 'judge@court.gov.in',
    password: 'Pass@123',
    role: 'judge',
    profile: { designation: 'Senior Judge', badgeId: 'JDG-1123', location: 'Delhi' }
  },
  {
    name: 'Supreme Court Registry',
    email: 'sc@court.gov.in',
    password: 'Pass@123',
    role: 'court_sc',
    profile: { designation: 'Court Admin', badgeId: 'SC-2201', location: 'New Delhi' }
  },
  {
    name: 'High Court Registry',
    email: 'hc@court.gov.in',
    password: 'Pass@123',
    role: 'court_hc',
    profile: { designation: 'Court Admin', badgeId: 'HC-4507', location: 'Lucknow' }
  },
  {
    name: 'District Court Clerk',
    email: 'dc@court.gov.in',
    password: 'Pass@123',
    role: 'court_dc',
    profile: { designation: 'Court Clerk', badgeId: 'DC-9081', location: 'Kanpur' }
  },
  {
    name: 'Inspector R. Sharma',
    email: 'police@station.gov.in',
    password: 'Pass@123',
    role: 'police_station',
    profile: { designation: 'Station Officer', badgeId: 'PS-5520', location: 'Noida' }
  },
  {
    name: 'Advocate Priya Sen',
    email: 'advocate@bar.in',
    password: 'Pass@123',
    role: 'advocate',
    profile: {
      designation: 'Advocate',
      badgeId: 'ADV-7710',
      certificateId: 'BAR-IND-2211',
      certificateStatus: 'verified',
      location: 'Delhi'
    }
  }
];

const demoCases = [
  {
    caseNo: 'SC-2026-0011',
    title: 'State vs Arjun Singh',
    category: 'criminal',
    courtLevel: 'SC',
    priorityScore: 95,
    status: 'pending',
    assignedToRole: 'judge',
    nextHearingDate: '2026-04-02',
    summary: 'Serious criminal appeal pending for final arguments.'
  },
  {
    caseNo: 'HC-2026-0102',
    title: 'Mehta Industries Tax Appeal',
    category: 'corporate',
    courtLevel: 'HC',
    priorityScore: 78,
    status: 'hearing_scheduled',
    assignedToRole: 'court_hc',
    nextHearingDate: '2026-04-08',
    summary: 'Corporate compliance and tax liability dispute.'
  },
  {
    caseNo: 'DC-2026-1019',
    title: 'Family Settlement Petition',
    category: 'family',
    courtLevel: 'DC',
    priorityScore: 60,
    status: 'pending',
    assignedToRole: 'advocate',
    nextHearingDate: '2026-04-14',
    summary: 'Property settlement between family members.'
  },
  {
    caseNo: 'DC-2026-1044',
    title: 'Municipal Civil Damages',
    category: 'civil',
    courtLevel: 'DC',
    priorityScore: 48,
    status: 'pending',
    assignedToRole: 'court_dc',
    nextHearingDate: '2026-04-11',
    summary: 'Civil damages claim regarding delayed public works.'
  },
  {
    caseNo: 'HC-2026-0505',
    title: 'Rights Petition 21A',
    category: 'constitutional',
    courtLevel: 'HC',
    priorityScore: 88,
    status: 'in_progress',
    assignedToRole: 'advocate',
    nextHearingDate: '2026-04-05',
    summary: 'Constitutional challenge concerning public policy.'
  },
  {
    caseNo: 'PS-2026-0917',
    title: 'FIR Investigation - Sector 17',
    category: 'criminal',
    courtLevel: 'DC',
    priorityScore: 83,
    status: 'pending',
    assignedToRole: 'police_station',
    nextHearingDate: '2026-04-01',
    summary: 'Investigation update to be submitted to district court.'
  }
];

async function initializeData() {
  if (dbReady) {
    const userCount = await User.countDocuments();
    if (!userCount) {
      for (const user of demoUsers) {
        const passwordHash = await bcrypt.hash(user.password, 10);
        await User.create({ ...user, passwordHash });
      }
      await Case.insertMany(demoCases);
    }
    return;
  }

  if (!memoryDb.users.length) {
    for (const user of demoUsers) {
      memoryDb.users.push({
        ...user,
        passwordHash: await bcrypt.hash(user.password, 10)
      });
    }
    memoryDb.cases = demoCases;
  }
}

function authorize(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  let user;
  if (dbReady) {
    user = await User.findOne({ email }).lean();
  } else {
    user = memoryDb.users.find((u) => u.email === email);
  }

  if (!user) return res.status(404).json({ message: 'User not found' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });

  res.json({
    token,
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile
    }
  });
});

app.get('/api/profile', authorize, async (req, res) => {
  const user = dbReady
    ? await User.findOne({ email: req.user.email }).lean()
    : memoryDb.users.find((u) => u.email === req.user.email);

  if (!user) return res.status(404).json({ message: 'Profile not found' });

  return res.json({
    name: user.name,
    email: user.email,
    role: user.role,
    profile: user.profile
  });
});

app.get('/api/cases', authorize, async (req, res) => {
  const { role } = req.user;
  const category = req.query.category;

  let cases = dbReady
    ? await Case.find({ assignedToRole: role, status: { $ne: 'disposed' } }).lean()
    : memoryDb.cases.filter((item) => item.assignedToRole === role && item.status !== 'disposed');

  if (category) {
    cases = cases.filter((c) => c.category === category);
  }

  cases.sort((a, b) => b.priorityScore - a.priorityScore);

  const grouped = cases.reduce((acc, c) => {
    acc[c.category] = acc[c.category] || [];
    acc[c.category].push(c);
    return acc;
  }, {});

  res.json({ total: cases.length, grouped, cases });
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

(async function bootstrap() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 1500 });
    dbReady = true;
    console.log('Connected to MongoDB');
  } catch {
    dbReady = false;
    console.warn('MongoDB not reachable. Using in-memory demo data.');
  }

  await initializeData();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();
