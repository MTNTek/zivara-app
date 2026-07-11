import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EmployersService } from './employers.service';
import { EmployersRepository } from './employers.repository';
import { DRIZZLE_CLIENT } from '../database/database.module';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEmployer(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'emp-1',
    ownerUserId: 'user-owner',
    companyName: 'Acme Construction',
    tradeLicenseNumber: 'TL-001',
    tradeLicenseUrl: null,
    industry: 'Construction',
    description: null,
    logoUrl: null,
    websiteUrl: null,
    employeeCountRange: '10-50',
    operatingCountry: 'UAE',
    verificationStatus: 'unverified',
    isBadgeVisible: false,
    complianceFlag: false,
    verifiedAt: null,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeMember(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'mem-1',
    employerId: 'emp-1',
    userId: 'user-owner',
    role: 'owner',
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRepo = {
  findById: jest.fn(),
  findByOwnerUserId: jest.fn(),
  findEmployerByMemberUserId: jest.fn(),
  updateEmployer: jest.fn(),
  recomputeBadgeVisibility: jest.fn(),
  listMembers: jest.fn(),
  findMember: jest.fn(),
  findMemberById: jest.fn(),
  addMember: jest.fn(),
  updateMemberRole: jest.fn(),
  removeMember: jest.fn(),
  countMembers: jest.fn(),
};

// Mock DB client for user lookup in inviteMember
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  limit: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('EmployersService', () => {
  let service: EmployersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployersService,
        { provide: EmployersRepository, useValue: mockRepo },
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
      ],
    }).compile();

    service = module.get<EmployersService>(EmployersService);
  });

  // ─── getMyProfile ─────────────────────────────────────────────────────────

  describe('getMyProfile', () => {
    it('returns employer profile with member role and count', async () => {
      const employer = makeEmployer();
      const member = makeMember();

      mockRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockRepo.findMember.mockResolvedValue(member);
      mockRepo.countMembers.mockResolvedValue(2);

      const result = await service.getMyProfile('user-owner');

      expect(result.id).toBe('emp-1');
      expect(result.companyName).toBe('Acme Construction');
      expect(result.memberRole).toBe('owner');
      expect(result.memberCount).toBe(2);
      // Internal fields must not appear
      expect(result).not.toHaveProperty('complianceFlag');
      expect(result).not.toHaveProperty('ownerUserId');
    });

    it('throws NotFoundException when no employer found', async () => {
      mockRepo.findEmployerByMemberUserId.mockResolvedValue(null);
      await expect(service.getMyProfile('nobody')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── updateMyProfile ──────────────────────────────────────────────────────

  describe('updateMyProfile', () => {
    it('allows owner to update profile', async () => {
      const employer = makeEmployer();
      const ownerMember = makeMember({ role: 'owner' });
      const updated = makeEmployer({ description: 'Updated description' });

      mockRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockRepo.findMember.mockResolvedValue(ownerMember);
      mockRepo.updateEmployer.mockResolvedValue(updated);

      const result = await service.updateMyProfile('user-owner', { description: 'Updated description' });
      expect(result.description).toBe('Updated description');
    });

    it('throws ForbiddenException when non-owner tries to update', async () => {
      const employer = makeEmployer();
      const managerMember = makeMember({ role: 'manager', userId: 'user-mgr' });

      mockRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockRepo.findMember.mockResolvedValue(managerMember);

      await expect(
        service.updateMyProfile('user-mgr', { description: 'Hack' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Team Members ─────────────────────────────────────────────────────────

  describe('inviteMember', () => {
    it('throws NotFoundException when inviting non-existent user', async () => {
      const employer = makeEmployer();
      const ownerMember = makeMember({ role: 'owner' });

      mockRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockRepo.findMember.mockResolvedValue(ownerMember);
      mockDb.limit.mockResolvedValue([]); // user not found

      await expect(
        service.inviteMember('user-owner', { email: 'ghost@example.com', role: 'recruiter' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when user is already a member', async () => {
      const employer = makeEmployer();
      const ownerMember = makeMember({ role: 'owner' });
      const existingUser = { id: 'user-existing', email: 'existing@example.com', deletedAt: null };
      const existingMember = makeMember({ userId: 'user-existing' });

      mockRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockRepo.findMember
        .mockResolvedValueOnce(ownerMember) // requestor check
        .mockResolvedValueOnce(existingMember); // already-member check
      mockDb.limit.mockResolvedValue([existingUser]);

      await expect(
        service.inviteMember('user-owner', { email: 'existing@example.com', role: 'manager' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ForbiddenException when recruiter tries to invite', async () => {
      const employer = makeEmployer();
      const recruiterMember = makeMember({ role: 'recruiter', userId: 'user-rec' });

      mockRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockRepo.findMember.mockResolvedValue(recruiterMember);

      await expect(
        service.inviteMember('user-rec', { email: 'new@example.com', role: 'manager' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('throws ForbiddenException when non-owner tries to remove', async () => {
      const employer = makeEmployer();
      const managerMember = makeMember({ role: 'manager', userId: 'user-mgr' });

      mockRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockRepo.findMember.mockResolvedValue(managerMember);

      await expect(service.removeMember('user-mgr', 'mem-2')).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when owner tries to remove themselves', async () => {
      const employer = makeEmployer();
      const ownerMember = makeMember({ role: 'owner', userId: 'user-owner' });
      const targetMember = makeMember({ id: 'mem-self', userId: 'user-owner', role: 'owner' });

      mockRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockRepo.findMember.mockResolvedValue(ownerMember);
      mockRepo.findMemberById.mockResolvedValue(targetMember);

      await expect(service.removeMember('user-owner', 'mem-self')).rejects.toThrow(BadRequestException);
    });

    it('removes member when owner removes another member', async () => {
      const employer = makeEmployer();
      const ownerMember = makeMember({ role: 'owner', userId: 'user-owner' });
      const targetMember = makeMember({ id: 'mem-2', userId: 'user-other', role: 'recruiter' });

      mockRepo.findEmployerByMemberUserId.mockResolvedValue(employer);
      mockRepo.findMember.mockResolvedValue(ownerMember);
      mockRepo.findMemberById.mockResolvedValue(targetMember);
      mockRepo.removeMember.mockResolvedValue(undefined);

      await service.removeMember('user-owner', 'mem-2');
      expect(mockRepo.removeMember).toHaveBeenCalledWith('mem-2');
    });
  });

  // ─── getDashboardStats ────────────────────────────────────────────────────

  describe('getDashboardStats', () => {
    it('returns employer stats with company name and verification status', async () => {
      const employer = makeEmployer({ verificationStatus: 'verified', isBadgeVisible: true });
      mockRepo.findEmployerByMemberUserId.mockResolvedValue(employer);

      const result = await service.getDashboardStats('user-owner');

      expect(result.companyName).toBe('Acme Construction');
      expect(result.verificationStatus).toBe('verified');
      expect(result.isBadgeVisible).toBe(true);
    });
  });
});
