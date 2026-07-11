import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { EmployersRepository } from './employers.repository';
import type { UpdateEmployerDto } from './dto/update-employer.dto';
import type { InviteMemberDto } from './dto/invite-member.dto';
import type { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { users } from '../database/schema/users';
import { DRIZZLE_CLIENT, type DrizzleClient } from '../database/database.module';
import { Inject } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';

/** Safe employer response — never exposes internal fields */
export interface EmployerResponse {
  id: string;
  companyName: string;
  tradeLicenseNumber: string;
  industry: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  employeeCountRange: string | null;
  operatingCountry: string;
  verificationStatus: string;
  isBadgeVisible: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function toEmployerResponse(row: {
  id: string;
  companyName: string;
  tradeLicenseNumber: string;
  industry: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  employeeCountRange: string | null;
  operatingCountry: string;
  verificationStatus: string;
  isBadgeVisible: boolean;
  complianceFlag: boolean;
  verifiedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  ownerUserId: string;
}): EmployerResponse {
  return {
    id: row.id,
    companyName: row.companyName,
    tradeLicenseNumber: row.tradeLicenseNumber,
    industry: row.industry,
    description: row.description,
    logoUrl: row.logoUrl,
    websiteUrl: row.websiteUrl,
    employeeCountRange: row.employeeCountRange,
    operatingCountry: row.operatingCountry,
    verificationStatus: row.verificationStatus,
    isBadgeVisible: row.isBadgeVisible,
    verifiedAt: row.verifiedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class EmployersService {
  constructor(
    private readonly repository: EmployersRepository,
    @Inject(DRIZZLE_CLIENT)
    private readonly db: DrizzleClient,
  ) {}

  // ─── Profile ──────────────────────────────────────────────────────────────

  /** Get the employer profile for the authenticated employer user */
  async getMyProfile(userId: string): Promise<EmployerResponse & {
    memberRole: string;
    memberCount: number;
  }> {
    const employer = await this.repository.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');

    const member = await this.repository.findMember(employer.id, userId);
    const memberCount = await this.repository.countMembers(employer.id);

    return {
      ...toEmployerResponse(employer),
      memberRole: member?.role ?? 'owner',
      memberCount,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateEmployerDto): Promise<EmployerResponse> {
    const employer = await this.repository.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');

    // Only owner can update core profile details
    const member = await this.repository.findMember(employer.id, userId);
    if (!member || member.role !== 'owner') {
      throw new ForbiddenException('Only the account owner can update the company profile.');
    }

    const updated = await this.repository.updateEmployer(employer.id, dto);
    return toEmployerResponse(updated);
  }

  /** Public employer profile — no internal fields */
  async getPublicProfile(id: string): Promise<EmployerResponse> {
    const employer = await this.repository.findById(id);
    if (!employer) throw new NotFoundException('Employer not found.');
    return toEmployerResponse(employer);
  }

  // ─── Team Members ─────────────────────────────────────────────────────────

  async listMembers(userId: string) {
    const employer = await this.repository.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');
    return this.repository.listMembers(employer.id);
  }

  async inviteMember(userId: string, dto: InviteMemberDto) {
    const employer = await this.repository.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');

    // Only owner or manager can invite
    const requestor = await this.repository.findMember(employer.id, userId);
    if (!requestor || requestor.role === 'recruiter') {
      throw new ForbiddenException('Only owners and managers can invite team members.');
    }

    // Find the user by email
    const targetUser = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, dto.email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);

    if (!targetUser[0]) {
      throw new NotFoundException(
        'No Zivara account found for that email address. The user must register first.',
      );
    }

    const target = targetUser[0];

    // Check not already a member
    const existing = await this.repository.findMember(employer.id, target.id);
    if (existing) {
      throw new ConflictException('This user is already a member of your team.');
    }

    return this.repository.addMember({
      employerId: employer.id,
      userId: target.id,
      role: dto.role,
    });
  }

  async updateMemberRole(
    userId: string,
    memberId: string,
    dto: UpdateMemberRoleDto,
  ) {
    const employer = await this.repository.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');

    // Only owner can change roles
    const requestor = await this.repository.findMember(employer.id, userId);
    if (!requestor || requestor.role !== 'owner') {
      throw new ForbiddenException('Only the account owner can change member roles.');
    }

    const member = await this.repository.findMemberById(memberId);
    if (!member || member.employerId !== employer.id) {
      throw new NotFoundException('Team member not found.');
    }

    // Cannot change the owner's own role
    if (member.userId === userId) {
      throw new BadRequestException('You cannot change your own role.');
    }

    return this.repository.updateMemberRole(memberId, dto.role);
  }

  async removeMember(userId: string, memberId: string): Promise<void> {
    const employer = await this.repository.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');

    const requestor = await this.repository.findMember(employer.id, userId);
    if (!requestor || requestor.role !== 'owner') {
      throw new ForbiddenException('Only the account owner can remove team members.');
    }

    const member = await this.repository.findMemberById(memberId);
    if (!member || member.employerId !== employer.id) {
      throw new NotFoundException('Team member not found.');
    }

    if (member.userId === userId) {
      throw new BadRequestException('You cannot remove yourself from the team.');
    }

    await this.repository.removeMember(memberId);
  }

  // ─── Dashboard Stats ──────────────────────────────────────────────────────

  async getDashboardStats(userId: string) {
    const employer = await this.repository.findEmployerByMemberUserId(userId);
    if (!employer) throw new NotFoundException('Employer profile not found.');

    return {
      employerId: employer.id,
      companyName: employer.companyName,
      verificationStatus: employer.verificationStatus,
      isBadgeVisible: employer.isBadgeVisible,
      // Job/application counts come from the Jobs module in the next sprint
      activeJobCount: 0,
      totalApplicationCount: 0,
      shortlistedCount: 0,
    };
  }
}
