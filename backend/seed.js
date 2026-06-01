require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');

const User = require('./models/User');
const Skill = require('./models/Skill');
const UserSkill = require('./models/UserSkill');
const Request = require('./models/Request');

const SKILLS = [
  { name: 'Web Development', category: 'Technology', icon: '💻', description: 'Frontend and backend web development' },
  { name: 'UI/UX Design', category: 'Design', icon: '🎨', description: 'User interface and experience design' },
  { name: 'Python Tutoring', category: 'Education', icon: '🐍', description: 'Python programming lessons' },
  { name: 'Laptop Repair', category: 'Repair', icon: '🔧', description: 'Hardware and software laptop repair' },
  { name: 'Video Editing', category: 'Creative', icon: '🎬', description: 'Video production and editing' },
  { name: 'Data Analysis', category: 'Technology', icon: '📊', description: 'Data analysis and visualization' },
  { name: 'Music Production', category: 'Creative', icon: '🎵', description: 'Beat making and audio production' },
  { name: 'Copywriting', category: 'Creative', icon: '✍️', description: 'Persuasive and marketing copy' },
  { name: 'Photography', category: 'Creative', icon: '📷', description: 'Professional photography' },
  { name: 'Math Tutoring', category: 'Education', icon: '📐', description: 'Mathematics lessons for all levels' },
  { name: 'Graphic Design', category: 'Design', icon: '🖌️', description: 'Logo, branding, and print design' },
  { name: 'SEO Consulting', category: 'Business', icon: '🔍', description: 'Search engine optimization' },
  { name: 'Language Teaching', category: 'Education', icon: '🌍', description: 'Foreign language instruction' },
  { name: 'Fitness Coaching', category: 'Health', icon: '💪', description: 'Personal fitness training' },
  { name: 'Mobile App Dev', category: 'Technology', icon: '📱', description: 'iOS and Android development' },
];

const DEMO_USERS = [
  { name: 'Alice Chen', email: 'alice@demo.com', password: 'demo1234', bio: 'Full-stack dev and Python enthusiast. Love teaching and building.', location: 'San Francisco', skillCreditBalance: 35, completedTasks: 12, avgRating: 4.8, reputationScore: 12.8 },
  { name: 'Bob Mwangi', email: 'bob@demo.com', password: 'demo1234', bio: 'Graphic designer and video editor. Open to skill trades.', location: 'Nairobi', skillCreditBalance: 28, completedTasks: 7, avgRating: 4.5, reputationScore: 8.1 },
  { name: 'Sara Lim', email: 'sara@demo.com', password: 'demo1234', bio: 'UX researcher and fitness coach. Let\'s exchange skills!', location: 'Singapore', skillCreditBalance: 42, completedTasks: 20, avgRating: 4.9, reputationScore: 18.9 },
];

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database…');

  // Clear
  await Promise.all([
    User.deleteMany({}),
    Skill.deleteMany({}),
    UserSkill.deleteMany({}),
    Request.deleteMany({}),
  ]);

  // Seed skills
  const skills = await Skill.insertMany(SKILLS);
  console.log(`✓ ${skills.length} skills created`);

  // Seed users — use create() one by one so the pre('save') password hash hook fires
  const users = [];
  for (const u of DEMO_USERS) {
    const created = await User.create(u);
    users.push(created);
  }
  console.log(`✓ ${users.length} demo users created`);

  // Assign skills to users
  const [alice, bob, sara] = users;
  const skillMap = {};
  skills.forEach(s => skillMap[s.name] = s._id);

  await UserSkill.insertMany([
    { user: alice._id, skill: skillMap['Web Development'], skillLevel: 'Expert', description: 'React, Node, MongoDB', hourlyCreditRate: 8 },
    { user: alice._id, skill: skillMap['Python Tutoring'], skillLevel: 'Expert', description: 'Beginner to advanced', hourlyCreditRate: 6 },
    { user: bob._id, skill: skillMap['Graphic Design'], skillLevel: 'Expert', description: 'Logos, branding, print', hourlyCreditRate: 7 },
    { user: bob._id, skill: skillMap['Video Editing'], skillLevel: 'Intermediate', description: 'Premiere Pro, After Effects', hourlyCreditRate: 5 },
    { user: sara._id, skill: skillMap['UI/UX Design'], skillLevel: 'Expert', description: 'Figma, user research', hourlyCreditRate: 9 },
    { user: sara._id, skill: skillMap['Fitness Coaching'], skillLevel: 'Intermediate', description: 'HIIT and strength training', hourlyCreditRate: 4 },
  ]);
  console.log('✓ User skills assigned');

  // Seed some requests
  await Request.insertMany([
    {
      title: 'Need help setting up my React project',
      description: 'I have a project idea but need help with initial setup, routing, and connecting to an API. Approximately 2 hours of work.',
      requester: bob._id,
      skill: skillMap['Web Development'],
      creditOffer: 10,
      reservedCredits: 10,
      status: 'open',
    },
    {
      title: 'Looking for a Python tutor for my son',
      description: 'My son is 15 and wants to learn Python. Looking for someone patient who can do 3 sessions of 1 hour each.',
      requester: sara._id,
      skill: skillMap['Python Tutoring'],
      creditOffer: 15,
      reservedCredits: 15,
      status: 'open',
    },
    {
      title: 'Logo design for my freelance business',
      description: 'I need a minimalist logo for my consulting brand. Industry: tech. Colors: dark with one accent color.',
      requester: alice._id,
      skill: skillMap['Graphic Design'],
      creditOffer: 12,
      reservedCredits: 12,
      status: 'open',
    },
  ]);
  console.log('✓ Sample requests created');

  console.log('\n✅ Seed complete!');
  console.log('\nDemo accounts:');
  DEMO_USERS.forEach(u => console.log(`  ${u.email} / demo1234`));
  mongoose.disconnect();
}

seed().catch(err => { console.error(err); mongoose.disconnect(); });
