import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalsRepository } from './professionals.repository';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'prof-1',
    userId: 'user-1',
    fullName: 'Jane Doe',
    phone: '+97150000000',
    nationality: 'British',
    showNationality: false,
    countryOfOrigin: 'UK',
    currentCity: 'Dubai',
    currentCountry: 'UAE',
    primaryIndustry: 'Construction',
    bio: 'Experienced professional.',
    profilePhotoUrl: 'https://example.com/photo.jpg',
    isProfilePublic: true,
    verificationStatus: 'unverified',
    profileCompleteness: 70,
    governmentIdHash: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeExperience(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'exp-1',
    professionalId: 'prof-1',
    jobTitle: 'Site Engineer',
    companyName: 'Acme Corp',
    industry: 'Construction',
    startDate: '2020-01-01',
    endDate: '2022-12-31',
    description: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeSkill(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'skill-1',
    professionalId: 'prof-1',
    skillName: 'Scaffolding',
    yearsExperience: 3,
    ...overrides,
  };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRepo = {
  findByUserId: jest.fn(),
  findById: jest.fn(),
  updateProfile: jest.fn(),
  listExperience: jest.fn(),
  addExperience: jest.fn(),
  findExperienceById: jest.fn(),
  updateExperience: jest.fn(),
  deleteExperience: jest.fn(),
  listSkills: jest.fn(),
  addSkill: jest.fn(),
  findSkillById: jest.fn(),
  deleteSkill: jest.fn(),
  countSkills: jest.fn(),
  countExperience: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProfessionalsService', () => {
  let service: ProfessionalsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessionalsService,
        { provide: ProfessionalsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ProfessionalsService>(ProfessionalsService);
  });

  // ─── getMyProfile ─────────────────────────────────────────────────────────

  describe('getMyProfile', () => {
    it('returns full profile with experience and skills', async () => {
      const profile = makeProfile();
      const experience = [makeExperience()];
      const skills = [makeSkill()];

      mockRepo.findByUserId.mockResolvedValue(profile);
      mockRepo.listExperience.mockResolvedValue(experience);
      mockRepo.listSkills.mockResolvedValue(skills);

      const result = await service.getMyProfile('user-1');

      expect(result.id).toBe('prof-1');
      expect(result.fullName).toBe('Jane Doe');
      expect(result.experience).toHaveLength(1);
      expect(result.skills).toHaveLength(1);
      // government_id_hash must never appear
      expect(result).not.toHaveProperty('governmentIdHash');
    });

    it('throws NotFoundException when profile does not exist', async () => {
      mockRepo.findByUserId.mockResolvedValue(null);

      await expect(service.getMyProfile('no-such-user')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── getPublicProfile ─────────────────────────────────────────────────────

  describe('getPublicProfile', () => {
    it('returns profile with nationality null when show_nationality=false', async () => {
      const profile = makeProfile({ showNationality: false, nationality: 'British' });
      mockRepo.findById.mockResolvedValue(profile);
      mockRepo.listExperience.mockResolvedValue([]);
      mockRepo.listSkills.mockResolvedValue([]);

      const result = await service.getPublicProfile('prof-1');

      expect(result.nationality).toBeNull();
    });

    it('returns nationality when show_nationality=true', async () => {
      const profile = makeProfile({ showNationality: true, nationality: 'British' });
      mockRepo.findById.mockResolvedValue(profile);
      mockRepo.listExperience.mockResolvedValue([]);
      mockRepo.listSkills.mockResolvedValue([]);

      const result = await service.getPublicProfile('prof-1');

      expect(result.nationality).toBe('British');
    });

    it('throws NotFoundException when profile is private', async () => {
      const profile = makeProfile({ isProfilePublic: false });
      mockRepo.findById.mockResolvedValue(profile);

      await expect(service.getPublicProfile('prof-1')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when profile does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getPublicProfile('no-such-id')).rejects.toThrow(NotFoundException);
    });

    it('never returns userId or governmentIdHash on public profile', async () => {
      const profile = makeProfile({ showNationality: true });
      mockRepo.findById.mockResolvedValue(profile);
      mockRepo.listExperience.mockResolvedValue([]);
      mockRepo.listSkills.mockResolvedValue([]);

      const result = await service.getPublicProfile('prof-1');

      expect(result).not.toHaveProperty('userId');
      expect(result).not.toHaveProperty('governmentIdHash');
      expect(result).not.toHaveProperty('showNationality');
    });
  });

  // ─── updateMyProfile ──────────────────────────────────────────────────────

  describe('updateMyProfile', () => {
    it('updates fields and recomputes completeness', async () => {
      const profile = makeProfile();
      const updatedProfile = makeProfile({ bio: 'Updated bio', profileCompleteness: 75 });

      mockRepo.findByUserId.mockResolvedValue(profile);
      mockRepo.updateProfile.mockResolvedValue(updatedProfile);
      mockRepo.countSkills.mockResolvedValue(1);
      mockRepo.countExperience.mockResolvedValue(1);
      mockRepo.findById.mockResolvedValue(updatedProfile);

      const result = await service.updateMyProfile('user-1', { bio: 'Updated bio' });

      expect(mockRepo.updateProfile).toHaveBeenCalledWith(
        'prof-1',
        expect.objectContaining({ bio: 'Updated bio' }),
      );
      // Completeness should have been recomputed (updateProfile called twice)
      expect(mockRepo.updateProfile).toHaveBeenCalledTimes(2);
      expect(result.bio).toBe('Updated bio');
    });
  });

  // ─── Experience ───────────────────────────────────────────────────────────

  describe('addExperience', () => {
    it('creates an experience row and recomputes completeness', async () => {
      const profile = makeProfile();
      const exp = makeExperience();

      mockRepo.findByUserId.mockResolvedValue(profile);
      mockRepo.addExperience.mockResolvedValue(exp);
      mockRepo.findById.mockResolvedValue(profile);
      mockRepo.countSkills.mockResolvedValue(1);
      mockRepo.countExperience.mockResolvedValue(1);
      mockRepo.updateProfile.mockResolvedValue(profile);

      const result = await service.addExperience('user-1', {
        jobTitle: 'Site Engineer',
        companyName: 'Acme Corp',
        startDate: '2020-01-01',
      });

      expect(mockRepo.addExperience).toHaveBeenCalledWith(
        expect.objectContaining({
          professionalId: 'prof-1',
          jobTitle: 'Site Engineer',
        }),
      );
      expect(result.id).toBe('exp-1');
    });
  });

  describe('deleteExperience', () => {
    it('throws ForbiddenException when experience belongs to a different professional', async () => {
      const profile = makeProfile({ id: 'prof-1' });
      const exp = makeExperience({ professionalId: 'prof-OTHER' }); // different owner

      mockRepo.findByUserId.mockResolvedValue(profile);
      mockRepo.findExperienceById.mockResolvedValue(exp);

      await expect(
        service.deleteExperience('user-1', 'exp-1'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockRepo.deleteExperience).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when experience does not exist', async () => {
      const profile = makeProfile();
      mockRepo.findByUserId.mockResolvedValue(profile);
      mockRepo.findExperienceById.mockResolvedValue(null);

      await expect(service.deleteExperience('user-1', 'no-exp')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Skills ───────────────────────────────────────────────────────────────

  describe('addSkill', () => {
    it('creates a skill row and recomputes completeness', async () => {
      const profile = makeProfile();
      const skill = makeSkill();

      mockRepo.findByUserId.mockResolvedValue(profile);
      mockRepo.addSkill.mockResolvedValue(skill);
      mockRepo.findById.mockResolvedValue(profile);
      mockRepo.countSkills.mockResolvedValue(1);
      mockRepo.countExperience.mockResolvedValue(0);
      mockRepo.updateProfile.mockResolvedValue(profile);

      const result = await service.addSkill('user-1', { skillName: 'Scaffolding' });

      expect(mockRepo.addSkill).toHaveBeenCalledWith(
        expect.objectContaining({ professionalId: 'prof-1', skillName: 'Scaffolding' }),
      );
      expect(result.skillName).toBe('Scaffolding');
    });
  });

  // ─── computeCompleteness ─────────────────────────────────────────────────

  describe('recomputeCompleteness', () => {
    it('returns 100 for a fully complete profile', async () => {
      const profile = makeProfile({
        fullName: 'Jane Doe',
        phone: '+97150000000',
        bio: 'Bio',
        profilePhotoUrl: 'https://example.com/photo.jpg',
        primaryIndustry: 'Construction',
        currentCity: 'Dubai',
        currentCountry: 'UAE',
        nationality: 'British',
      });

      mockRepo.findById.mockResolvedValue(profile);
      mockRepo.countSkills.mockResolvedValue(2);
      mockRepo.countExperience.mockResolvedValue(1);
      mockRepo.updateProfile.mockResolvedValue({ ...profile, profileCompleteness: 100 });

      const score = await service.recomputeCompleteness('prof-1');

      expect(score).toBe(100);
    });

    it('returns partial score for incomplete profile', async () => {
      const profile = makeProfile({
        fullName: 'Jane',
        phone: null,
        bio: null,
        profilePhotoUrl: null,
        primaryIndustry: null,
        currentCity: null,
        currentCountry: null,
        nationality: null,
      });

      mockRepo.findById.mockResolvedValue(profile);
      mockRepo.countSkills.mockResolvedValue(0);
      mockRepo.countExperience.mockResolvedValue(0);
      mockRepo.updateProfile.mockResolvedValue({ ...profile, profileCompleteness: 15 });

      const score = await service.recomputeCompleteness('prof-1');

      expect(score).toBe(15); // only fullName (15pts)
    });
  });
});
