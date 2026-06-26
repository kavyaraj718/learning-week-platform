import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

import Employee from '../models/Employee.js';
import Activity from '../models/Activity.js';
import Registration from '../models/Registration.js';
import PointsHistory from '../models/PointsHistory.js';
import PointsConfig from '../models/PointsConfig.js';
import SocialEngagement from '../models/SocialEngagement.js';

import {
  awardParticipation,
  awardWinners,
  awardBonus,
  syncSocial,
  recomputeDerived,
} from '../services/pointsEngine.js';

dotenv.config();

// ---- small deterministic RNG so re-seeding is reproducible ----
const mulberry32 = (a) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rng = mulberry32(20260224);
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---- reference data ----
const MANAGER_DEPT = {
  'Priya Nair': 'Engineering',
  'Rohan Mehta': 'Sales',
  'Anjali Sharma': 'Marketing',
  'Karan Patel': 'Finance',
  'Sneha Reddy': 'Operations',
  'Vikram Singh': 'HR',
};
const DEPT_LOB = {
  Engineering: 'Technology',
  Sales: 'Commercial',
  Marketing: 'Commercial',
  Finance: 'Corporate Functions',
  Operations: 'Corporate Functions',
  HR: 'Corporate Functions',
};
const LOCATIONS = ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune'];
const DESIGNATIONS = ['Analyst', 'Associate', 'Senior Associate', 'Manager', 'Engineer', 'Senior Engineer', 'Lead'];
const MANAGERS = Object.keys(MANAGER_DEPT);

const FIRST = ['Aarav', 'Diya', 'Vivaan', 'Ananya', 'Aditya', 'Ishita', 'Kabir', 'Saanvi', 'Arjun', 'Myra',
  'Reyansh', 'Aadhya', 'Vihaan', 'Anika', 'Krishna', 'Navya', 'Rudra', 'Kiara', 'Shaurya', 'Pari',
  'Dev', 'Riya', 'Aryan', 'Tara'];
const LAST = ['Sharma', 'Verma', 'Iyer', 'Nair', 'Patel', 'Reddy', 'Gupta', 'Mehta', 'Bose', 'Rao',
  'Khan', 'Kapoor', 'Das', 'Menon', 'Joshi', 'Pillai', 'Chopra', 'Sinha'];

const ACTIVITIES = [
  { name: 'AI & the Future of Work — Keynote Webinar', type: 'Virtual', category: 'Tech Talk', day: 0, time: '10:00 AM' },
  { name: 'Hackathon Sprint: Build in a Day', type: 'On-Ground', category: 'Hackathon', day: 0, time: '2:00 PM' },
  { name: 'Lunch & Learn: Data Storytelling', type: 'On-Ground', category: 'Workshop', day: 1, time: '1:00 PM' },
  { name: 'Cloud Fundamentals Bootcamp', type: 'Virtual', category: 'Training', day: 1, time: '3:30 PM' },
  { name: 'Leadership Fireside Chat', type: 'Virtual', category: 'Leadership', day: 2, time: '11:00 AM' },
  { name: 'Design Thinking Workshop', type: 'On-Ground', category: 'Workshop', day: 2, time: '2:30 PM' },
  { name: 'Cybersecurity Awareness Challenge', type: 'Virtual', category: 'Challenge', day: 3, time: '10:30 AM' },
  { name: 'Wellness & Mindfulness Session', type: 'On-Ground', category: 'Wellness', day: 3, time: '4:00 PM' },
  { name: 'Product Demo Day', type: 'On-Ground', category: 'Showcase', day: 4, time: '11:30 AM' },
  { name: 'Trivia & Quiz Night', type: 'Virtual', category: 'Social', day: 4, time: '6:00 PM' },
];
const WEEK_MONDAY = new Date('2026-03-02T00:00:00.000Z'); // Mon–Fri Learning Week

const wipe = async () => {
  await Promise.all([
    Employee.deleteMany({}),
    Activity.deleteMany({}),
    Registration.deleteMany({}),
    PointsHistory.deleteMany({}),
    PointsConfig.deleteMany({}),
    SocialEngagement.deleteMany({}),
  ]);
  console.log('🧹 cleared existing data');
};

const enrollEmployee = async (employee, activity, markAttended = true) => {
  const exists = await Registration.findOne({ employee: employee._id, activity: activity._id });
  if (exists) return;
  await Registration.create({
    employee: employee._id,
    activity: activity._id,
    status: markAttended ? 'attended' : 'enrolled',
  });
  // Update the activity's arrays atomically. Loading + .save() in a loop causes
  // Mongoose VersionError ("No matching document ... version 0") when many
  // enrollments touch the same activity in quick succession; $addToSet avoids it.
  const update = markAttended
    ? { $addToSet: { enrolled: employee._id, attended: employee._id } }
    : { $addToSet: { enrolled: employee._id } };
  await Activity.findByIdAndUpdate(activity._id, update);
  await awardParticipation(employee._id, activity);
};

const run = async () => {
  await connectDB();
  await wipe();

  // Config
  await PointsConfig.getConfig();

  // Activities
  const activities = [];
  for (const a of ACTIVITIES) {
    const date = new Date(WEEK_MONDAY);
    date.setUTCDate(date.getUTCDate() + a.day);
    const doc = await Activity.create({
      name: a.name,
      description: `${a.name} — part of Learning Week 2026.`,
      category: a.category,
      date,
      time: a.time,
      type: a.type,
      participationPoints: 5,
      status: 'upcoming',
    });
    activities.push(doc);
  }
  console.log(`📅 created ${activities.length} activities`);

  // ---- Employees ----
  const employees = [];

  // Admin
  const admin = new Employee({
    name: 'Admin User',
    employeeId: 'EMP1000',
    email: 'admin@learningweek.test',
    role: 'admin',
    department: 'HR',
    location: 'Mumbai',
    lob: 'Corporate Functions',
    manager: 'Vikram Singh',
    designation: 'Program Manager',
  });
  admin.password = 'admin123';
  await admin.save();
  employees.push(admin);

  // Demo employee (engineered toward ~250 pts)
  const demo = new Employee({
    name: 'Aarav Mehta',
    employeeId: 'EMP1001',
    email: 'demo@learningweek.test',
    role: 'employee',
    department: 'Engineering',
    location: 'Mumbai',
    lob: 'Technology',
    manager: 'Priya Nair',
    designation: 'Senior Engineer',
  });
  demo.password = 'password123';
  await demo.save();
  employees.push(demo);

  // 23 more employees → 25 total
  const usedNames = new Set(['Aarav Mehta', 'Admin User']);
  let idCounter = 1002;
  while (employees.length < 25) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const manager = pick(MANAGERS);
    const department = MANAGER_DEPT[manager];
    const emp = new Employee({
      name,
      employeeId: `EMP${idCounter++}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@learningweek.test`,
      role: 'employee',
      department,
      location: pick(LOCATIONS),
      lob: DEPT_LOB[department],
      manager,
      designation: pick(DESIGNATIONS),
    });
    emp.password = 'password123';
    await emp.save();
    employees.push(emp);
  }
  console.log(`👥 created ${employees.length} employees`);

  // ---- Social engagement feeds ----
  for (const emp of employees) {
    const likes = randInt(0, 60);
    const comments = randInt(0, 30);
    const shares = randInt(0, 20);
    const posts = randInt(0, 12);
    const interactions = randInt(0, 40);
    // demo gets a fixed 80 engagement points to hit the target total
    const engagementPoints =
      emp.employeeId === 'EMP1001' ? 80 : likes + comments * 2 + shares * 3 + posts * 4 + interactions;
    await SocialEngagement.create({
      employeeId: emp.employeeId,
      engagementPoints,
      likes, comments, shares, posts, interactions,
    });
  }
  console.log('💬 created social engagement feeds');

  // ---- Enrollments ----
  // Demo: enroll in the first 8 activities
  for (let i = 0; i < 8; i++) await enrollEmployee(demo, activities[i]);

  // Others: random 3–9 activities each
  for (const emp of employees) {
    if (emp.employeeId === 'EMP1001') continue;
    const n = randInt(3, 9);
    const chosen = shuffle(activities).slice(0, n);
    for (const act of chosen) await enrollEmployee(emp, act, rng() > 0.2);
  }
  console.log('✅ recorded enrollments + participation points');

  // ---- Winners: first 6 activities are completed ----
  const reload = async (id) => Activity.findById(id);
  for (let i = 0; i < 6; i++) {
    const act = await reload(activities[i]._id);
    const enrolledIds = act.enrolled.map((e) => e.toString());
    let pool = shuffle(enrolledIds);

    // Make sure the demo user wins a couple to look good on the dashboard.
    if (i === 1 && enrolledIds.includes(demo._id.toString())) {
      pool = [pool[0] !== demo._id.toString() ? pool[0] : pool[1], demo._id.toString(), ...pool].filter(Boolean);
    }
    if (i === 4 && enrolledIds.includes(demo._id.toString())) {
      pool = [demo._id.toString(), ...pool.filter((p) => p !== demo._id.toString())];
    }

    const winners = {
      first: pool[0] || null,
      second: pool[1] || null,
      third: pool[2] || null,
    };
    await awardWinners(act, winners);
  }
  // Activities 6–7 running, 8–9 upcoming
  await Activity.findByIdAndUpdate(activities[6]._id, { status: 'running' });
  await Activity.findByIdAndUpdate(activities[7]._id, { status: 'running' });
  console.log('🏆 assigned winners for completed activities');

  // ---- Fold social engagement into totals ----
  await syncSocial();
  console.log('🔄 synced social engagement points');

  // ---- Nudge a dozen "stars" above the demo, and pin demo near 250 ----
  const demoReload = await Employee.findById(demo._id);
  const demoBase = demoReload.totalPoints;
  if (demoBase < 250) await awardBonus(demo._id, 250 - demoBase, 'Welcome bonus');

  // Top up ~12 employees so the demo lands around rank #12
  const others = employees.filter((e) => e.role === 'employee' && e.employeeId !== 'EMP1001');
  const stars = shuffle(others).slice(0, 12);
  let bump = 40;
  for (const s of stars) {
    const fresh = await Employee.findById(s._id);
    if (fresh.totalPoints <= 250) await awardBonus(s._id, 250 - fresh.totalPoints + bump, 'Exceptional contribution');
    bump += 8;
  }

  // ---- Award champion-style badges based on final standings ----
  const ordered = await Employee.find({ role: 'employee' }).sort({ totalPoints: -1 });
  if (ordered[0] && !ordered[0].badges.includes('Learning Week Champion')) {
    ordered[0].badges.push('Learning Week Champion');
    await ordered[0].save();
  }

  // ---- Report ----
  const board = await Employee.find({ role: 'employee' })
    .sort({ totalPoints: -1 })
    .select('name totalPoints')
    .lean();
  const demoRank = board.findIndex((b) => b.name === 'Aarav Mehta') + 1;

  console.log('\n🏁 Top 15 leaderboard:');
  board.slice(0, 15).forEach((b, i) => {
    const tag = b.name === 'Aarav Mehta' ? '  ← demo' : '';
    console.log(`  ${String(i + 1).padStart(2)}. ${b.name.padEnd(22)} ${b.totalPoints} pts${tag}`);
  });
  console.log(`\n   Demo user "Aarav Mehta": ${board[demoRank - 1]?.totalPoints} pts, rank #${demoRank}`);

  console.log('\n🔑 Demo credentials');
  console.log('   Admin    → admin@learningweek.test / admin123');
  console.log('   Employee → demo@learningweek.test  / password123');

  await mongoose.connection.close();
  console.log('\n✨ Seed complete.');
  process.exit(0);
};

run().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});