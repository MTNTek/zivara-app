/**
 * seed.ts — Populate the database with realistic development data.
 *
 * Usage: npm run db:seed
 *
 * Seeds:
 *   - 1 admin account
 *   - 5 verified employers (one per Phase 1 industry)
 *   - 20 professionals with realistic profiles
 *   - 50+ jobs distributed across industries
 *   - Applications with varied statuses
 *   - Notifications (accurate — no false "shortlisted" events)
 *   - Ratings for completed shifts
 *
 * Development login credentials are printed at the end.
 * Safe to re-run — clears existing seed data first.
 */

import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { users } from './schema/users';
import { professionals, professionalSkills, professionalExperience } from './schema/professionals';
import { employers, employerMembers } from './schema/employers';
import { jobs, jobRequiredSkills } from './schema/jobs';
import { applications } from './schema/applications';
import { notifications } from './schema/notifications';
import { shifts } from './schema/shifts';
import { ratings } from './schema/ratings';

const DATABASE_URL = process.env['DATABASE_URL'];
if (!DATABASE_URL) {
  console.error('[seed] ✗ DATABASE_URL not set.');
  process.exit(1);
}

const BCRYPT_COST = 10; // lower cost for seed speed
const DEV_PASSWORD = 'Zivara2024!';

function uuid(): string { return crypto.randomUUID(); }
function hashPassword(pw: string): string { return bcrypt.hashSync(pw, BCRYPT_COST); }
function daysAgo(n: number): Date { return new Date(Date.now() - n * 86_400_000); }
function daysFromNow(n: number): Date { return new Date(Date.now() + n * 86_400_000); }

// ─── Employer data ────────────────────────────────────────────────────────────

const EMPLOYER_DATA = [
  {
    email: 'hr@alfardan-construction.com',
    companyName: 'Al Fardan Construction Group',
    industry: 'Construction',
    tradeLicense: 'CR-2024-CONST-001',
    country: 'UAE',
    description: 'Leading construction company in the UAE specializing in high-rise residential and commercial projects.',
  },
  {
    email: 'careers@solarvision-gulf.com',
    companyName: 'SolarVision Gulf',
    industry: 'Solar Energy',
    tradeLicense: 'CR-2024-SOLAR-002',
    country: 'KSA',
    description: 'Saudi Arabia\'s fastest growing solar energy installation company, delivering clean energy solutions across the GCC.',
  },
  {
    email: 'talent@royalpalm-hospitality.com',
    companyName: 'Royal Palm Hospitality',
    industry: 'Hospitality',
    tradeLicense: 'CR-2024-HOSP-003',
    country: 'Qatar',
    description: 'Award-winning hotel and resort operator managing 12 properties across Qatar, UAE, and Bahrain.',
  },
  {
    email: 'jobs@cleanpro-services.com',
    companyName: 'CleanPro Services LLC',
    industry: 'Cleaning',
    tradeLicense: 'CR-2024-CLEAN-004',
    country: 'UAE',
    description: 'Professional commercial and residential cleaning services provider with over 500 trained cleaning specialists.',
  },
  {
    email: 'hire@homewise-domestic.com',
    companyName: 'HomeWise Domestic Services',
    industry: 'Domestic Services',
    tradeLicense: 'CR-2024-DOM-005',
    country: 'Kuwait',
    description: 'Trusted domestic staffing agency connecting GCC households with verified housekeeping and care professionals.',
  },
];

// ─── Professional data ────────────────────────────────────────────────────────

const PROFESSIONAL_DATA = [
  { name: 'Mohammed Al Rashidi', email: 'mohammed.rashidi@example.com', nationality: 'Kuwaiti', origin: 'Kuwait', city: 'Kuwait City', country: 'Kuwait', industry: 'Construction', languages: ['Arabic', 'English'] },
  { name: 'Priya Sharma', email: 'priya.sharma@example.com', nationality: 'Indian', origin: 'India', city: 'Dubai', country: 'UAE', industry: 'Hospitality', languages: ['English', 'Hindi'] },
  { name: 'Carlos Mendez', email: 'carlos.mendez@example.com', nationality: 'Filipino', origin: 'Philippines', city: 'Riyadh', country: 'KSA', industry: 'Construction', languages: ['English', 'Tagalog'] },
  { name: 'Aisha Al Mansoori', email: 'aisha.mansoori@example.com', nationality: 'Emirati', origin: 'UAE', city: 'Abu Dhabi', country: 'UAE', industry: 'Domestic Services', languages: ['Arabic', 'English'] },
  { name: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', nationality: 'Indian', origin: 'India', city: 'Doha', country: 'Qatar', industry: 'Solar Energy', languages: ['English', 'Hindi', 'Telugu'] },
  { name: 'Fatima Al Zahrawi', email: 'fatima.zahrawi@example.com', nationality: 'Jordanian', origin: 'Jordan', city: 'Amman', country: 'Jordan', industry: 'Cleaning', languages: ['Arabic', 'English'] },
  { name: 'Mark Johnson', email: 'mark.johnson@example.com', nationality: 'British', origin: 'UK', city: 'Dubai', country: 'UAE', industry: 'Hospitality', languages: ['English'] },
  { name: 'Nguyen Thi Lan', email: 'nguyen.lan@example.com', nationality: 'Vietnamese', origin: 'Vietnam', city: 'Kuwait City', country: 'Kuwait', industry: 'Domestic Services', languages: ['Vietnamese', 'English'] },
  { name: 'Ahmed Siddiqui', email: 'ahmed.siddiqui@example.com', nationality: 'Pakistani', origin: 'Pakistan', city: 'Sharjah', country: 'UAE', industry: 'Construction', languages: ['Urdu', 'English', 'Arabic'] },
  { name: 'Maria Santos', email: 'maria.santos@example.com', nationality: 'Filipino', origin: 'Philippines', city: 'Manama', country: 'Bahrain', industry: 'Cleaning', languages: ['Tagalog', 'English'] },
  { name: 'Omar Al Khalifa', email: 'omar.khalifa@example.com', nationality: 'Bahraini', origin: 'Bahrain', city: 'Manama', country: 'Bahrain', industry: 'Solar Energy', languages: ['Arabic', 'English'] },
  { name: 'Sunita Rai', email: 'sunita.rai@example.com', nationality: 'Nepali', origin: 'Nepal', city: 'Dubai', country: 'UAE', industry: 'Domestic Services', languages: ['Nepali', 'English', 'Hindi'] },
  { name: 'David Okonkwo', email: 'david.okonkwo@example.com', nationality: 'Nigerian', origin: 'Nigeria', city: 'Riyadh', country: 'KSA', industry: 'Construction', languages: ['English', 'Yoruba'] },
  { name: 'Rania Haddad', email: 'rania.haddad@example.com', nationality: 'Lebanese', origin: 'Lebanon', city: 'Dubai', country: 'UAE', industry: 'Hospitality', languages: ['Arabic', 'English', 'French'] },
  { name: 'Binu Thomas', email: 'binu.thomas@example.com', nationality: 'Indian', origin: 'India', city: 'Muscat', country: 'Oman', industry: 'Solar Energy', languages: ['Malayalam', 'English', 'Arabic'] },
  { name: 'Halima Osman', email: 'halima.osman@example.com', nationality: 'Ethiopian', origin: 'Ethiopia', city: 'Riyadh', country: 'KSA', industry: 'Domestic Services', languages: ['Amharic', 'Arabic', 'English'] },
  { name: 'Jorge Reyes', email: 'jorge.reyes@example.com', nationality: 'Filipino', origin: 'Philippines', city: 'Dubai', country: 'UAE', industry: 'Cleaning', languages: ['Tagalog', 'English'] },
  { name: 'Yasmine Belkacem', email: 'yasmine.belkacem@example.com', nationality: 'Algerian', origin: 'Algeria', city: 'Doha', country: 'Qatar', industry: 'Hospitality', languages: ['Arabic', 'French', 'English'] },
  { name: 'Thabo Nkosi', email: 'thabo.nkosi@example.com', nationality: 'South African', origin: 'South Africa', city: 'Dubai', country: 'UAE', industry: 'Construction', languages: ['English', 'Zulu'] },
  { name: 'Nour Al Amin', email: 'nour.alamin@example.com', nationality: 'Egyptian', origin: 'Egypt', city: 'Abu Dhabi', country: 'UAE', industry: 'Cleaning', languages: ['Arabic', 'English'] },
];

// ─── Skills by industry ───────────────────────────────────────────────────────

const SKILLS_BY_INDUSTRY: Record<string, string[]> = {
  Construction: ['Scaffolding', 'Welding', 'Concrete Finishing', 'Electrical Wiring', 'Plumbing', 'Steel Fixing', 'Safety Compliance', 'Site Management', 'Heavy Equipment Operation', 'Carpentry'],
  'Solar Energy': ['PV Installation', 'Electrical Systems', 'Inverter Maintenance', 'Cable Management', 'Roof Assessment', 'AutoCAD', 'Energy Auditing', 'Safety Protocols', 'System Commissioning', 'SCADA'],
  Hospitality: ['Guest Relations', 'Food & Beverage Service', 'Housekeeping', 'Front Desk Operations', 'Event Coordination', 'Concierge Service', 'POS Systems', 'Menu Knowledge', 'HACCP', 'Revenue Management'],
  Cleaning: ['Commercial Cleaning', 'Residential Cleaning', 'Deep Cleaning', 'Window Cleaning', 'Carpet Cleaning', 'Pressure Washing', 'Chemical Handling', 'Equipment Operation', 'Waste Management', 'Quality Control'],
  'Domestic Services': ['Child Care', 'Elder Care', 'Meal Preparation', 'Laundry & Ironing', 'Household Management', 'Grocery Management', 'Pet Care', 'First Aid', 'Home Organization', 'Family Support'],
  'Private Tutoring': ['Mathematics', 'English Language', 'Arabic Language', 'Science', 'Physics', 'Chemistry', 'Exam Preparation', 'Curriculum Design', 'Special Needs Support', 'Online Teaching'],
};

// ─── Job templates ────────────────────────────────────────────────────────────

interface JobTemplate {
  titleEn: string;
  titleAr: string;
  descEn: string;
  industry: string;
  employmentType: 'full_time' | 'part_time' | 'shift_based' | 'contract';
  salaryMin: number;
  salaryMax: number;
  skills: string[];
  city: string;
  country: string;
}

const JOB_TEMPLATES: JobTemplate[] = [
  { titleEn: 'Senior Site Engineer', titleAr: 'مهندس موقع أول', descEn: 'Oversee construction site operations, coordinate subcontractors, and ensure compliance with safety standards on a high-rise residential project.', industry: 'Construction', employmentType: 'full_time', salaryMin: 8000, salaryMax: 12000, skills: ['Site Management', 'Safety Compliance', 'Concrete Finishing'], city: 'Dubai', country: 'UAE' },
  { titleEn: 'Steel Fixer', titleAr: 'حداد تسليح', descEn: 'Experienced steel fixer required for reinforced concrete structures. Must have GCC experience and valid safety certifications.', industry: 'Construction', employmentType: 'contract', salaryMin: 2200, salaryMax: 3000, skills: ['Steel Fixing', 'Safety Compliance'], city: 'Abu Dhabi', country: 'UAE' },
  { titleEn: 'Scaffolding Supervisor', titleAr: 'مشرف سقالات', descEn: 'Lead a team of scaffolders on a major infrastructure project. CISRS certification required.', industry: 'Construction', employmentType: 'contract', salaryMin: 3500, salaryMax: 5000, skills: ['Scaffolding', 'Safety Compliance', 'Site Management'], city: 'Riyadh', country: 'KSA' },
  { titleEn: 'Electrician – Commercial', titleAr: 'كهربائي تجاري', descEn: 'Install and maintain electrical systems in commercial buildings. Must hold a valid electrical license.', industry: 'Construction', employmentType: 'full_time', salaryMin: 3000, salaryMax: 4500, skills: ['Electrical Wiring', 'Safety Compliance'], city: 'Doha', country: 'Qatar' },
  { titleEn: 'Plumber – Residential', titleAr: 'سباك سكني', descEn: 'Install and repair plumbing systems in new residential developments. Experience with copper and CPVC systems preferred.', industry: 'Construction', employmentType: 'full_time', salaryMin: 2500, salaryMax: 3500, skills: ['Plumbing', 'Safety Compliance'], city: 'Sharjah', country: 'UAE' },
  { titleEn: 'Carpenter – Fit-Out', titleAr: 'نجار تشطيبات', descEn: 'Skilled carpenter for luxury fit-out projects in Dubai. Experience with custom joinery and high-end finishes required.', industry: 'Construction', employmentType: 'full_time', salaryMin: 2800, salaryMax: 4000, skills: ['Carpentry', 'Concrete Finishing'], city: 'Dubai', country: 'UAE' },
  { titleEn: 'Heavy Equipment Operator', titleAr: 'مشغل معدات ثقيلة', descEn: 'Operate excavators, cranes, and loaders on a major road construction project. Valid heavy equipment license required.', industry: 'Construction', employmentType: 'contract', salaryMin: 4000, salaryMax: 6000, skills: ['Heavy Equipment Operation', 'Safety Compliance'], city: 'Muscat', country: 'Oman' },
  { titleEn: 'Welding Technician', titleAr: 'فني لحام', descEn: 'MIG/TIG welder for structural steel fabrication. AWS D1.1 certification preferred.', industry: 'Construction', employmentType: 'full_time', salaryMin: 2800, salaryMax: 4000, skills: ['Welding', 'Safety Compliance'], city: 'Kuwait City', country: 'Kuwait' },
  { titleEn: 'Solar PV Installer', titleAr: 'فني تركيب الألواح الشمسية', descEn: 'Install rooftop and ground-mount solar PV systems for residential and commercial clients across the UAE.', industry: 'Solar Energy', employmentType: 'full_time', salaryMin: 3500, salaryMax: 5500, skills: ['PV Installation', 'Electrical Systems', 'Cable Management'], city: 'Dubai', country: 'UAE' },
  { titleEn: 'Solar Systems Engineer', titleAr: 'مهندس أنظمة الطاقة الشمسية', descEn: 'Design and commission utility-scale solar energy systems. Experience with AutoCAD and energy modeling software required.', industry: 'Solar Energy', employmentType: 'full_time', salaryMin: 9000, salaryMax: 15000, skills: ['PV Installation', 'AutoCAD', 'System Commissioning', 'Energy Auditing'], city: 'Riyadh', country: 'KSA' },
  { titleEn: 'Inverter Maintenance Technician', titleAr: 'فني صيانة العاكسات', descEn: 'Maintain and troubleshoot solar inverters at multiple sites across Qatar. Travel required.', industry: 'Solar Energy', employmentType: 'full_time', salaryMin: 4500, salaryMax: 7000, skills: ['Inverter Maintenance', 'Electrical Systems', 'SCADA'], city: 'Doha', country: 'Qatar' },
  { titleEn: 'Solar Energy Sales Consultant', titleAr: 'مستشار مبيعات الطاقة الشمسية', descEn: 'Drive commercial solar sales in the Bahrain market. Technical background preferred but not required.', industry: 'Solar Energy', employmentType: 'full_time', salaryMin: 5000, salaryMax: 9000, skills: ['Energy Auditing', 'System Commissioning'], city: 'Manama', country: 'Bahrain' },
  { titleEn: 'Solar Project Manager', titleAr: 'مدير مشاريع الطاقة الشمسية', descEn: 'Manage end-to-end delivery of solar energy projects from site survey to commissioning.', industry: 'Solar Energy', employmentType: 'full_time', salaryMin: 12000, salaryMax: 18000, skills: ['System Commissioning', 'Safety Protocols', 'AutoCAD'], city: 'Abu Dhabi', country: 'UAE' },
  { titleEn: 'Front Desk Agent', titleAr: 'موظف استقبال', descEn: 'Deliver outstanding guest experiences at a 5-star hotel in Doha. Opera PMS experience required.', industry: 'Hospitality', employmentType: 'full_time', salaryMin: 2500, salaryMax: 3500, skills: ['Front Desk Operations', 'Guest Relations', 'POS Systems'], city: 'Doha', country: 'Qatar' },
  { titleEn: 'Food & Beverage Supervisor', titleAr: 'مشرف الأغذية والمشروبات', descEn: 'Supervise F&B operations at a luxury resort. Must have 3+ years of supervisory experience in 5-star properties.', industry: 'Hospitality', employmentType: 'full_time', salaryMin: 4000, salaryMax: 6000, skills: ['Food & Beverage Service', 'HACCP', 'Revenue Management'], city: 'Dubai', country: 'UAE' },
  { titleEn: 'Housekeeper', titleAr: 'عامل تنظيف غرف', descEn: 'Maintain exceptional cleanliness standards across 40 guest rooms. Attention to detail is essential.', industry: 'Hospitality', employmentType: 'full_time', salaryMin: 1800, salaryMax: 2500, skills: ['Housekeeping', 'Guest Relations'], city: 'Abu Dhabi', country: 'UAE' },
  { titleEn: 'Event Coordinator', titleAr: 'منسق فعاليات', descEn: 'Plan and execute corporate events, weddings, and gala dinners. Minimum 2 years of event management experience.', industry: 'Hospitality', employmentType: 'full_time', salaryMin: 5000, salaryMax: 8000, skills: ['Event Coordination', 'Guest Relations', 'Revenue Management'], city: 'Manama', country: 'Bahrain' },
  { titleEn: 'Concierge – Luxury Hotel', titleAr: 'كونسيرج فندق فاخر', descEn: 'Les Clefs d\'Or membership preferred. Must have excellent knowledge of local attractions and services.', industry: 'Hospitality', employmentType: 'full_time', salaryMin: 3500, salaryMax: 5000, skills: ['Concierge Service', 'Guest Relations', 'Front Desk Operations'], city: 'Dubai', country: 'UAE' },
];

const JOB_TEMPLATES_PART2: JobTemplate[] = [
  { titleEn: 'Office Cleaning Operative', titleAr: 'عامل تنظيف مكاتب', descEn: 'Daily office cleaning at a commercial tower in Dubai. Morning shift, 6am–2pm. Equipment provided.', industry: 'Cleaning', employmentType: 'shift_based', salaryMin: 1500, salaryMax: 2000, skills: ['Commercial Cleaning', 'Chemical Handling', 'Equipment Operation'], city: 'Dubai', country: 'UAE' },
  { titleEn: 'Deep Cleaning Specialist', titleAr: 'متخصص التنظيف العميق', descEn: 'Post-construction and deep cleaning of luxury villas and penthouses. Attention to detail required.', industry: 'Cleaning', employmentType: 'contract', salaryMin: 2200, salaryMax: 3200, skills: ['Deep Cleaning', 'Residential Cleaning', 'Chemical Handling'], city: 'Abu Dhabi', country: 'UAE' },
  { titleEn: 'Cleaning Team Leader', titleAr: 'قائد فريق التنظيف', descEn: 'Lead a team of 10 cleaners at a shopping mall. Supervisory experience in commercial cleaning required.', industry: 'Cleaning', employmentType: 'full_time', salaryMin: 2800, salaryMax: 4000, skills: ['Commercial Cleaning', 'Quality Control', 'Waste Management'], city: 'Riyadh', country: 'KSA' },
  { titleEn: 'Carpet & Upholstery Cleaner', titleAr: 'عامل تنظيف سجاد ومفروشات', descEn: 'Specialist carpet and upholstery cleaning for hotels and corporate offices. Equipment training provided.', industry: 'Cleaning', employmentType: 'full_time', salaryMin: 2000, salaryMax: 3000, skills: ['Carpet Cleaning', 'Chemical Handling'], city: 'Kuwait City', country: 'Kuwait' },
  { titleEn: 'Window Cleaning Technician', titleAr: 'فني تنظيف نوافذ', descEn: 'Abseiling window cleaner for high-rise towers in Doha. IRATA certification required. Accommodation provided.', industry: 'Cleaning', employmentType: 'contract', salaryMin: 4000, salaryMax: 6000, skills: ['Window Cleaning', 'Safety Compliance'], city: 'Doha', country: 'Qatar' },
  { titleEn: 'Live-In Housekeeper', titleAr: 'عاملة منزلية مقيمة', descEn: 'Experienced housekeeper for a private family in Jumeirah. Duties include cleaning, laundry, and household management. Accommodation and meals provided.', industry: 'Domestic Services', employmentType: 'full_time', salaryMin: 1800, salaryMax: 2500, skills: ['Household Management', 'Laundry & Ironing', 'Meal Preparation'], city: 'Dubai', country: 'UAE' },
  { titleEn: 'Nanny / Childcare Provider', titleAr: 'جليسة أطفال', descEn: 'Caring and experienced nanny for two children aged 3 and 6. Must have childcare qualifications and first aid certification.', industry: 'Domestic Services', employmentType: 'full_time', salaryMin: 2200, salaryMax: 3500, skills: ['Child Care', 'First Aid', 'Home Organization'], city: 'Abu Dhabi', country: 'UAE' },
  { titleEn: 'Elder Care Specialist', titleAr: 'متخصص رعاية المسنين', descEn: 'Compassionate carer for an elderly gentleman in Riyadh. Experience with mobility assistance and medication management required.', industry: 'Domestic Services', employmentType: 'full_time', salaryMin: 2500, salaryMax: 4000, skills: ['Elder Care', 'First Aid', 'Household Management'], city: 'Riyadh', country: 'KSA' },
  { titleEn: 'Private Chef – Family', titleAr: 'طاهٍ خاص', descEn: 'Experienced private chef for a Kuwaiti family. Proficiency in Middle Eastern, Asian, and Western cuisine required.', industry: 'Domestic Services', employmentType: 'full_time', salaryMin: 3500, salaryMax: 6000, skills: ['Meal Preparation', 'Household Management', 'Grocery Management'], city: 'Kuwait City', country: 'Kuwait' },
  { titleEn: 'Villa Housekeeper', titleAr: 'عاملة منزلية للفيلا', descEn: 'Maintain a 6-bedroom villa in Al Ain. Duties include deep cleaning, laundry, and organization. Must be detail-oriented.', industry: 'Domestic Services', employmentType: 'full_time', salaryMin: 1800, salaryMax: 2800, skills: ['Residential Cleaning', 'Laundry & Ironing', 'Home Organization'], city: 'Al Ain', country: 'UAE' },
  { titleEn: 'Mathematics Tutor – IGCSE / A-Level', titleAr: 'معلم رياضيات – IGCSE / A-Level', descEn: 'Experienced maths tutor for secondary students preparing for IGCSE and A-Level exams. Dubai locations preferred.', industry: 'Private Tutoring', employmentType: 'part_time', salaryMin: 150, salaryMax: 300, skills: ['Mathematics', 'Exam Preparation', 'Curriculum Design'], city: 'Dubai', country: 'UAE' },
  { titleEn: 'English Language Tutor', titleAr: 'معلم اللغة الإنجليزية', descEn: 'Qualified English tutor for adult professionals seeking to improve business English. CELTA/DELTA qualification preferred.', industry: 'Private Tutoring', employmentType: 'part_time', salaryMin: 200, salaryMax: 400, skills: ['English Language', 'Curriculum Design', 'Online Teaching'], city: 'Doha', country: 'Qatar' },
  { titleEn: 'Science Tutor – IB', titleAr: 'معلم علوم – المنهج الدولي', descEn: 'IB Biology and Chemistry tutor for students aged 14–18. Must have IB teaching experience.', industry: 'Private Tutoring', employmentType: 'part_time', salaryMin: 180, salaryMax: 350, skills: ['Science', 'Chemistry', 'Exam Preparation'], city: 'Abu Dhabi', country: 'UAE' },
  { titleEn: 'Arabic Language Teacher – Expats', titleAr: 'معلمة لغة عربية للمغتربين', descEn: 'Teach conversational Arabic to expatriate professionals and families in Riyadh. Group and individual sessions available.', industry: 'Private Tutoring', employmentType: 'part_time', salaryMin: 150, salaryMax: 280, skills: ['Arabic Language', 'Curriculum Design'], city: 'Riyadh', country: 'KSA' },
  { titleEn: 'Special Needs Learning Support', titleAr: 'دعم تعلم ذوي الاحتياجات الخاصة', descEn: 'Support tutor for children with learning differences including dyslexia and ADHD. SENCO or equivalent qualification required.', industry: 'Private Tutoring', employmentType: 'part_time', salaryMin: 200, salaryMax: 400, skills: ['Special Needs Support', 'English Language', 'Exam Preparation'], city: 'Dubai', country: 'UAE' },
];

const ALL_JOB_TEMPLATES = [...JOB_TEMPLATES, ...JOB_TEMPLATES_PART2];

// ─── Main seed function ───────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const client = postgres(DATABASE_URL!, { max: 1 });
  const db = drizzle(client);

  console.log('\n[seed] Starting seed...');

  // ── 1. Clear previous seed data (order matters for FK constraints) ──────────
  console.log('[seed] Clearing existing data...');
  await db.delete(ratings);
  await db.delete(notifications);
  await db.delete(shifts);
  await db.delete(applications);
  await db.delete(jobRequiredSkills);
  await db.delete(jobs);
  await db.delete(employerMembers);
  await db.delete(employers);
  await db.delete(professionalSkills);
  await db.delete(professionalExperience);
  await db.delete(professionals);
  await db.delete(users);

  const passwordHash = hashPassword(DEV_PASSWORD);

  // ── 2. Admin account ─────────────────────────────────────────────────────────
  console.log('[seed] Creating admin...');
  const adminId = uuid();
  await db.insert(users).values({
    id: adminId,
    email: 'admin@zivara.com',
    passwordHash,
    role: 'admin',
    languagePreference: 'en',
    isVerifiedEmail: true,
    isActive: true,
  });

  // ── 3. Employers ──────────────────────────────────────────────────────────────
  console.log('[seed] Creating employers...');
  const employerIds: string[] = [];
  for (const emp of EMPLOYER_DATA) {
    const userId = uuid();
    const employerId = uuid();

    await db.insert(users).values({
      id: userId,
      email: emp.email,
      passwordHash,
      role: 'employer',
      languagePreference: 'en',
      isVerifiedEmail: true,
      isActive: true,
    });

    await db.insert(employers).values({
      id: employerId,
      ownerUserId: userId,
      companyName: emp.companyName,
      tradeLicenseNumber: emp.tradeLicense,
      industry: emp.industry,
      operatingCountry: emp.country,
      description: emp.description,
      verificationStatus: 'verified',
      isBadgeVisible: true,
      complianceFlag: false,
      verifiedAt: daysAgo(30),
    });

    await db.insert(employerMembers).values({
      employerId,
      userId,
      role: 'owner',
    });

    employerIds.push(employerId);
  }

  // ── 4. Professionals ──────────────────────────────────────────────────────────
  console.log('[seed] Creating professionals...');
  const professionalIds: string[] = [];

  for (const pro of PROFESSIONAL_DATA) {
    const userId = uuid();
    const professionalId = uuid();

    await db.insert(users).values({
      id: userId,
      email: pro.email,
      passwordHash,
      role: 'professional',
      languagePreference: 'en',
      isVerifiedEmail: true,
      isActive: true,
    });

    await db.insert(professionals).values({
      id: professionalId,
      userId,
      fullName: pro.name,
      phone: `+971${Math.floor(500000000 + Math.random() * 99999999)}`,
      nationality: pro.nationality,
      showNationality: Math.random() > 0.4,
      countryOfOrigin: pro.origin,
      currentCity: pro.city,
      currentCountry: pro.country,
      primaryIndustry: pro.industry,
      bio: `Experienced ${pro.industry.toLowerCase()} professional with ${2 + Math.floor(Math.random() * 8)} years of GCC experience. Reliable, hardworking, and committed to quality.`,
      isProfilePublic: true,
      verificationStatus: Math.random() > 0.3 ? 'verified' : 'unverified',
      profileCompleteness: 70 + Math.floor(Math.random() * 30),
    });

    // Skills
    const industrySkills = SKILLS_BY_INDUSTRY[pro.industry] ?? [];
    const skillCount = 3 + Math.floor(Math.random() * 4);
    const chosenSkills = industrySkills.slice(0, skillCount);
    for (const skill of chosenSkills) {
      await db.insert(professionalSkills).values({
        professionalId,
        skillName: skill,
        yearsExperience: 1 + Math.floor(Math.random() * 5),
      });
    }

    // Experience
    await db.insert(professionalExperience).values({
      professionalId,
      jobTitle: `${pro.industry} Professional`,
      companyName: `Previous Company, ${pro.origin}`,
      industry: pro.industry,
      startDate: `${2019 + Math.floor(Math.random() * 3)}-01-01`,
      endDate: `${2022 + Math.floor(Math.random() * 2)}-12-31`,
      description: `Worked on various ${pro.industry.toLowerCase()} projects, delivering high-quality results and maintaining safety standards.`,
    });

    professionalIds.push(professionalId);
  }

  // ── 5. Jobs ───────────────────────────────────────────────────────────────────
  console.log('[seed] Creating jobs...');

  // Map industry → employer index
  const industryToEmployerIdx: Record<string, number> = {
    Construction: 0, 'Solar Energy': 1, Hospitality: 2, Cleaning: 3, 'Domestic Services': 4, 'Private Tutoring': 3,
  };

  const jobIds: string[] = [];
  const jobIndustries: string[] = [];

  // Generate 50+ jobs from templates (repeat some templates to reach count)
  const expandedTemplates: JobTemplate[] = [];
  let idx = 0;
  while (expandedTemplates.length < 50) {
    expandedTemplates.push(ALL_JOB_TEMPLATES[idx % ALL_JOB_TEMPLATES.length]!);
    idx++;
  }

  for (const tmpl of expandedTemplates) {
    const jobId = uuid();
    const employerIdx = industryToEmployerIdx[tmpl.industry] ?? 0;
    const employerId = employerIds[employerIdx]!;

    // Get employer user id for createdBy
    const [emp] = await db.select().from(employers).where(eq(employers.id, employerId)).limit(1);
    if (!emp) continue;

    const statusOptions: Array<'active' | 'closed' | 'draft'> = ['active', 'active', 'active', 'closed', 'draft'];
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)]!;

    await db.insert(jobs).values({
      id: jobId,
      employerId,
      createdBy: emp.ownerUserId,
      title: { en: tmpl.titleEn, ar: tmpl.titleAr },
      description: { en: tmpl.descEn, ar: tmpl.descEn },
      industry: tmpl.industry,
      city: tmpl.city,
      country: tmpl.country,
      employmentType: tmpl.employmentType,
      salaryMin: String(tmpl.salaryMin),
      salaryMax: String(tmpl.salaryMax),
      salaryCurrency: 'AED',
      status,
      viewCount: Math.floor(Math.random() * 200),
      expiresAt: status === 'closed' ? daysAgo(5) : daysFromNow(30 + Math.floor(Math.random() * 30)),
    });

    for (const skill of tmpl.skills) {
      await db.insert(jobRequiredSkills).values({ jobId, skillName: skill });
    }

    jobIds.push(jobId);
    jobIndustries.push(tmpl.industry);
  }

  // ── 6. Applications ───────────────────────────────────────────────────────────
  console.log('[seed] Creating applications...');

  type AppStatus = 'received' | 'under_review' | 'shortlisted' | 'rejected' | 'hired' | 'withdrawn';
  const appStatuses: AppStatus[] = ['received', 'under_review', 'shortlisted', 'rejected', 'hired', 'withdrawn'];

  const applicationIds: string[] = [];
  const applicationStatuses: AppStatus[] = [];

  // Each professional applies to 2–3 active jobs
  const activeJobIds = jobIds.filter((_, i) => jobIndustries[i] !== undefined);
  for (let pi = 0; pi < professionalIds.length; pi++) {
    const professionalId = professionalIds[pi]!;
    const appliedJobs = new Set<string>();
    const numApplications = 2 + Math.floor(Math.random() * 2);

    for (let a = 0; a < numApplications; a++) {
      const jobId = activeJobIds[Math.floor(Math.random() * activeJobIds.length)]!;
      if (appliedJobs.has(jobId)) continue;
      appliedJobs.add(jobId);

      const appId = uuid();
      const status = appStatuses[Math.floor(Math.random() * appStatuses.length)]!;

      await db.insert(applications).values({
        id: appId,
        jobId,
        professionalId,
        status,
        coverNote: `I am very interested in this position and believe my experience in the industry makes me a strong candidate.`,
        lastReviewedAt: status !== 'received' ? daysAgo(Math.floor(Math.random() * 10)) : null,
        createdAt: daysAgo(5 + Math.floor(Math.random() * 30)),
      });

      applicationIds.push(appId);
      applicationStatuses.push(status);
    }
  }

  // ── 7. Notifications ─────────────────────────────────────────────────────────
  // CRITICAL: Never create "shortlisted" notifications unless status is actually 'shortlisted'
  console.log('[seed] Creating notifications...');

  // Fetch professionals with user IDs for notifications
  const professionalRows = await db.select({ id: professionals.id, userId: professionals.userId }).from(professionals);
  const professionalUserMap: Record<string, string> = {};
  for (const row of professionalRows) {
    professionalUserMap[row.id] = row.userId;
  }

  for (let i = 0; i < applicationIds.length; i++) {
    const appId = applicationIds[i]!;
    const status = applicationStatuses[i]!;

    // Find the professional for this application
    const [app] = await db.select({
      professionalId: applications.professionalId,
      jobId: applications.jobId,
    }).from(applications).where(eq(applications.id, appId)).limit(1);
    if (!app) continue;

    const userId = professionalUserMap[app.professionalId];
    if (!userId) continue;

    // Application received notification — always sent
    await db.insert(notifications).values({
      userId,
      type: 'application_received',
      title: { en: 'Application submitted', ar: 'تم تقديم الطلب' },
      body: { en: 'Your application has been received. The employer will review it shortly.', ar: 'تم استلام طلبك. سيقوم صاحب العمل بمراجعته قريبًا.' },
      referenceType: 'application',
      referenceId: appId,
      isRead: Math.random() > 0.4,
      createdAt: daysAgo(5 + Math.floor(Math.random() * 20)),
    });

    // Status-specific notifications — ONLY sent when status actually matches
    if (status === 'shortlisted') {
      await db.insert(notifications).values({
        userId,
        type: 'application_shortlisted',
        title: { en: 'You\'ve been shortlisted!', ar: 'تم اختيارك ضمن القائمة المختصرة!' },
        body: { en: 'Great news! The employer has shortlisted you for this position.', ar: 'أخبار رائعة! لقد قام صاحب العمل بإدراجك في القائمة المختصرة لهذا المنصب.' },
        referenceType: 'application',
        referenceId: appId,
        isRead: Math.random() > 0.5,
        createdAt: daysAgo(1 + Math.floor(Math.random() * 5)),
      });
    } else if (status === 'rejected') {
      await db.insert(notifications).values({
        userId,
        type: 'application_rejected',
        title: { en: 'Application update', ar: 'تحديث حالة الطلب' },
        body: { en: 'Thank you for your interest. Unfortunately, the employer has decided not to proceed with your application at this time.', ar: 'شكرًا على اهتمامك. للأسف، قرر صاحب العمل عدم المضي قدمًا في طلبك في الوقت الحالي.' },
        referenceType: 'application',
        referenceId: appId,
        isRead: Math.random() > 0.5,
        createdAt: daysAgo(1 + Math.floor(Math.random() * 5)),
      });
    } else if (status === 'hired') {
      await db.insert(notifications).values({
        userId,
        type: 'application_hired',
        title: { en: 'Congratulations — You\'re hired!', ar: 'تهانينا — لقد تم قبولك!' },
        body: { en: 'Congratulations! The employer has selected you for this position. They will be in touch with next steps.', ar: 'تهانينا! لقد اختارك صاحب العمل لهذا المنصب. سيتواصلون معك بشأن الخطوات التالية.' },
        referenceType: 'application',
        referenceId: appId,
        isRead: Math.random() > 0.3,
        createdAt: daysAgo(1 + Math.floor(Math.random() * 3)),
      });
    }
  }

  // ── 8. Shifts and ratings (for hired applications) ────────────────────────────
  console.log('[seed] Creating shifts and ratings...');

  const hiredApplications = applicationIds.filter((_, i) => applicationStatuses[i] === 'hired');

  for (const appId of hiredApplications.slice(0, 8)) {
    const [app] = await db.select({
      professionalId: applications.professionalId,
      jobId: applications.jobId,
    }).from(applications).where(eq(applications.id, appId)).limit(1);
    if (!app) continue;

    const [job] = await db.select({ employerId: jobs.employerId }).from(jobs).where(eq(jobs.id, app.jobId)).limit(1);
    if (!job) continue;

    const shiftId = uuid();
    const shiftDateOffset = 10 + Math.floor(Math.random() * 20);

    await db.insert(shifts).values({
      id: shiftId,
      employerId: job.employerId,
      professionalId: app.professionalId,
      applicationId: appId,
      shiftDate: daysAgo(shiftDateOffset).toISOString().split('T')[0]!,
      startTime: '08:00:00',
      endTime: '16:00:00',
      location: 'As per job posting',
      roleDescription: 'Complete shift as agreed in the job posting.',
      status: 'completed',
      professionalConfirmedAt: daysAgo(shiftDateOffset - 1),
      employerConfirmedCompletion: true,
      professionalConfirmedCompletion: true,
      createdAt: daysAgo(shiftDateOffset + 2),
    });

    // Professional rates employer
    const proUserId = professionalUserMap[app.professionalId];
    const empRow = await db.select({ ownerUserId: employers.ownerUserId }).from(employers).where(eq(employers.id, job.employerId)).limit(1);
    const empUserId = empRow[0]?.ownerUserId;

    if (proUserId && empUserId) {
      const stars = 3 + Math.floor(Math.random() * 3); // 3–5 stars
      await db.insert(ratings).values({
        shiftId,
        reviewerId: proUserId,
        revieweeId: empUserId,
        reviewerRole: 'professional',
        stars,
        reviewText: stars >= 4 ? 'Great employer. Clear instructions and timely payment.' : 'Decent experience overall.',
        moderationStatus: 'approved',
      });

      // Employer rates professional
      const empStars = 3 + Math.floor(Math.random() * 3);
      await db.insert(ratings).values({
        shiftId,
        reviewerId: empUserId,
        revieweeId: proUserId,
        reviewerRole: 'employer',
        stars: empStars,
        reviewText: empStars >= 4 ? 'Reliable and skilled professional. Would hire again.' : 'Completed the work satisfactorily.',
        moderationStatus: 'approved',
      });
    }
  }

  await client.end();

  // ── 9. Print credentials ──────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('  ✓ Seed complete');
  console.log('═'.repeat(60));
  console.log('\n  Development login credentials (password: ' + DEV_PASSWORD + ')');
  console.log('\n  Role          Email');
  console.log('  ─────────────────────────────────────────────────────');
  console.log('  Admin         admin@zivara.com');
  console.log('  Employer      hr@alfardan-construction.com');
  console.log('  Employer      careers@solarvision-gulf.com');
  console.log('  Employer      talent@royalpalm-hospitality.com');
  console.log('  Employer      jobs@cleanpro-services.com');
  console.log('  Employer      hire@homewise-domestic.com');
  console.log('  Professional  mohammed.rashidi@example.com');
  console.log('  Professional  priya.sharma@example.com');
  console.log('  Professional  carlos.mendez@example.com');
  console.log('\n' + '═'.repeat(60) + '\n');
}

void seed().catch((err) => {
  console.error('[seed] ✗ Fatal error:', err);
  process.exit(1);
});
